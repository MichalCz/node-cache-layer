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

var cacheException = require('../exception.js').cacheException,
    storageCallProxy = require('../helpers').storageCallProxy
;

/**
 * Expirable caching class with basic interface
 *
 * @class
 * @implements nad_cache
 * @implements nad_synchronous_cache
 */
var ExpirableCache = exports.ExpirableCache = function() {};

/**
 * Initialize cache storage and configuration
 *
 * @param {CacheConfig} config
 * @param {Function} engine
 */
ExpirableCache.prototype.init = function(config, EngineClass, callback) {

    // How many objects to keep (16K objects) [NYI]
    this._maxLength = config.maxLength || 16384;

    // How long to keep objects (60 seconds)
    this._maxAge = config.maxAge || 60000;

    // Clean cycle minimum interval (1 second)
    this._cleanInt = config.cleanInt || 1000;

    this._cleanupSlotOrder = [];
    this._cleanupSlots = {};
    this._cleanupKeys = {};

    this._keyCount = 0;

    this._engine = new EngineClass().init(config, callback);

    return this;

};

/**
 * Synchronously put object to cache
 *
 * @param {String} key
 * @param {Any} obj
 * @param {Function} callback
 * @returns {ExpirableCache}
 */
ExpirableCache.prototype.putSync = function(key, obj, time) {

    this._engine.put(key, obj);
    this._keyCount++;

    // schedule removal of expired keys
    this._scheduleCleanup(key, time);

    return this;
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
        time = this._maxAge;
    }

    this._engine.put(key, obj, callback);
    this._keyCount++;

    // schedule removal of expired keys
    this._scheduleCleanup(key, time);

    return this;
};

/**
 * Asynchronously remove object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {ExpirableCache}
 */
ExpirableCache.prototype.remove = ExpirableCache.prototype.removeSync = function() {
    var v = this._engine.remove.apply(this._engine, arguments);
    delete this._cleanupKeys[key];
    this._keyCount--;
    return v == this._engine ? this : v;
};

/**
 * Proxied storage methods
 * get, getSync, isSync
 */
ExpirableCache.prototype.get = storageCallProxy('get');
ExpirableCache.prototype.getSync = storageCallProxy('getSync');
ExpirableCache.prototype.isSync = storageCallProxy('isSync');

/**
 * Schedules a pending clean operation.
 *
 * If the index length exceeds the specified maximum
 *
 * @param {String} key
 * @param {Number} time
 */
ExpirableCache.prototype._scheduleCleanup = function(key, time) {

    var cleanSlot = ~~((new Date().getTime() + time) / (this._cleanInt + 1))
                    * (this._cleanInt + 1) + "";

    this._cleanupKeys[key] = cleanSlot;

    if (!this._cleanupSlots[cleanSlot]) {
        this._cleanupSlots[cleanSlot] = [setTimeout(this._cleanup.bind(this, cleanSlot), time)];
    }

    this._cleanupSlots[cleanSlot].push(key);
    this._cleanupKeys[key] = this._cleanupSlots[cleanSlot];

};

var numberSort = function(a,b) {return a-b;};

/**
 * Cleans outdated and overflown cache entries.
 */
ExpirableCache.prototype._cleanup = function(cleanSlot) {
    var c, i;
    if (!cleanSlot) {
        this._cleanupSlotOrder.sort(numberSort);
        while (this._keyCount > this._maxLength && this._maxLength > 0) {
            c = this._cleanupSlotOrder[0].splice(1, this.maxLength - this._keyCount);
            for (i=0; i<c.length; i++) {
                this.remove(c[i]);
            }
            if (this._cleanupSlotOrder[0].length == 1) {
                clearTimeout(this._cleanupSlotOrder[0]);
                this._cleanupSlotOrder.shift();
            }
        }
    } else if (!cleanSlot in this._cleanupSlots) {

        c = this._cleanupSlots[cleanSlot];
        delete this._cleanupSlots[cleanSlot];

        this._cleanupSlotOrder.splice(this._cleanupSlotOrder.indexOf(cleanSlot), 1);

        for (i=1; i<c.length; i++) {
            this.remove(c[i]);
        }
    }
};
