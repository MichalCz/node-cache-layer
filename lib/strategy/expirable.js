// (The MIT License)
//
// Copyright Michał Czapracki, budleigh.salterton@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * @fileoverview
 * @author Michał Czapracki
 *
 * A simple expiration strategy.
 *
 */

"use strict";

var cacheException = require('./exception.js').cacheException;

/**
 * Expirable caching class with basic interface
 *
 * @class
 * @implements nad_cache
 * @implements nad_synchronous_cache
 */
var ExpirableCache = exports.ExpirableCache = function() {};

// Defaults
ExpirableCache.defaultConfig = {
    "maxLength" : 16384,   // How many objects to keep (16K objects) [NYI]
    "maxAge"    : 60000,   // How long to keep objects (60 seconds)" +
    "cleanInt"  : 1000     // Clean cycle minimum interval (1 second)
};

/**
 * Initialize cache storage and configuration
 *
 * @param {CacheConfig} config
 * @param {Cache} engine
 */
ExpirableCache.prototype.init = function(config, engine) {

    // Init config
    for (var key in ExpirableCache.defaultConfig)
        this['_' + key] = config[key] || ExpirableCache.defaultConfig[key];

    this._engine = engine.init(config);

    this._cleanupSlots = {};
    this._cleanupKeys = {};

};

/**
 * Asynchronously put object to cache
 *
 * @param {String} key
 * @param {Any} obj
 * @param {Function} callback
 * @returns {ExpirableCache}
 */
ExpirableCache.prototype.put = function(key, obj, time, callback) {
    // optionals
    if (!callback) {
        callback = time;
        time = this._keepTime;
    }

    this._engine.put(key, obj, callback);

    // schedule removal of expired keys
    this._scheduleCleanup(key, time);

    return this;
};

/**
 * Asynchronously get object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {ExpirableCache}
 */
ExpirableCache.prototype.get = function() {
    return this._engine.get.apply(this._engine, arguments);
};

/**
 * Asynchronously remove object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {ExpirableCache}
 */
ExpirableCache.prototype.remove = function() {
    return this._engine.get.apply(this._engine, arguments);
};

/**
 * Schedules a pending clean operation.
 *
 * If the index length exceeds the specified maximum
 *
 * @param {String} key
 * @param {Number} time
 */
ExpirableCache.prototype._scheduleCleanup = function(key, time) {

    var cleanSlot = ~~((new Date().getTime() + time) / this._cleanInt + 1)
                    * this._cleanInt + "";

    if (this._cleanupKeys[key]) {
        this._cleanupKeys[key]
            .splice(this._cleanupKeys[key].indexOf(key), 1);
    }

    if (!this._cleanupSlots[cleanSlot]) {
        this._cleanupSlots[cleanSlot] = [];
        setTimeout(this._cleanup.bind(this, cleanSlot), time);
    }

    this._cleanupSlots[cleanSlot].push(key);
    this._cleanupKeys[key] = this._cleanupSlots[cleanSlot];

};

/**
 * Cleans outdated and overflown cache entries.
 */
ExpirableCache.prototype._cleanup = function(cleanSlot) {

    var c = this._cleanupSlots[cleanSlot];
    delete this._cleanupSlots[cleanSlot];

    for (var i=0; i<c.length; i++) {
        this._engine.remove(c[i]);
    }

};
