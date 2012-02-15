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
    storageCallProxy = require('../helpers').storageCallProxy,
    cacheException = require('../exception').cacheException;

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
 * @param {Function} engine
 */
PrimedCache.prototype.init = function(config, EngineClass, callback) {

    // Init config
    for (var key in PrimedCache.defaultConfig)
        this['_' + key] = config[key] || PrimedCache.defaultConfig[key];

    this._cleanupSlots = {};
    this._cleanupKeys = {};

    this._engine = new EngineClass().init(config, callback);

    return this;
};

/**
 * proxy methods:
 *   get, put, remove, getSync, putSync, removeSync, isSync
 */
PrimedCache.prototype.get = storageCallProxy('get');
PrimedCache.prototype.put = storageCallProxy('put');
PrimedCache.prototype.remove = storageCallProxy('remove');
PrimedCache.prototype.getSync = storageCallProxy('getSync');
PrimedCache.prototype.putSync = storageCallProxy('putSync');
PrimedCache.prototype.removeSync = storageCallProxy('removeSync');

/**
 * Method for synchronous priming.
 *
 * @see /examples/prime-sync.js
 *
 * @param keys
 * @param fillMethod
 * @param callback
 * @returns {PrimedCache}
 */
PrimedCache.prototype.primeSync = function(keys, fillMethod) {
    this._primeCount = 1;

    if (util.isArray(keys))
        keys.forEach(execPrimeSync.bind(this, fillMethod));
    else
        for (var key in keys)
            execPrimeSync.call(this, fillMethod, key, keys[key]);

    this._primeCount--;

    if (this._primeCount == 0)
        callback();

    return this;
};

var execPrimeSync = function(fillMethod, key, args) {
    this._primeCount++;

    args = args || [key];

    this.putSync(key, fillMethod.apply(null, args));


};

/**
 * Method for asynchronous priming.
 *
 * @see /examples/prime-async.js
 *
 * @param keys
 * @param fillMethod
 * @param callback
 * @returns {PrimedCache}
 */
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

    if (value)
        this.put(key, value, this._primeCount == 0 && callback());
    else
        this.remove(key);
};
