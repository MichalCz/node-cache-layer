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

var util = require('util'),
    cacheException = require('./exception.js').cacheException;

/**
 * Expirable caching class with basic interface
 *
 * @class
 * @implements nad_cache
 * @implements nad_synchronous_cache
 */
var PrimedCache = exports.PrimedCache = function() {};

// Defaults
PrimedCache.defaultConfig = {
};

/**
 * Initialize cache storage and configuration
 *
 * @param {CacheConfig} config
 * @param {Cache} engine
 */
PrimedCache.prototype.init = function(config, engine) {

    // Init config
    for (var key in PrimedCache.defaultConfig)
        this['_' + key] = config[key] || PrimedCache.defaultConfig[key];

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
 * @returns {PrimedCache}
 */
PrimedCache.prototype.put = function(key, obj, callback) {
    this._engine.apply(this._engine, arguments);
    return this;
};

/**
 * Asynchronously get object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {PrimedCache}
 */
PrimedCache.prototype.get = function() {
    this._engine.get.apply(this._engine, arguments);
    return this;
};

/**
 * Asynchronously remove object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {PrimedCache}
 */
PrimedCache.prototype.remove = function() {
    this._engine.get.apply(this._engine, arguments);
    return this;
};

PrimedCache.prototype.prime = function(keys, fillMethod, callback) {
    this._primeCount = 1;

    if (util.isArray(keys))
        keys.forEach(execPrime.bind(this, fillMethod, callback));
    else
        for (var key in keys)
            execPrime.call(this, fillMethod, callback, key, keys[key]);

    this._primeCount--;

    if (this._primeCount == 0)
        callback();

    return this;
};

var execPrime = function(fillMethod, callback, key, args) {
    this._primeCount++;

    args = args || [key];
    args.unshift(callbackPrime.bind(this, callback, key));

    fillMethod.apply(null, args);


};

var callbackPrime = function(callback, key, value) {
    this._primeCount--;

    this.put(key, value, this._primeCount == 0 && callback());
};
