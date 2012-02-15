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
 * A simple local reference cache storage class
 *
 * TODO: Replace with native collection as soon as it's introduced
 */

"use strict";

var cacheException = require('../exception.js').cacheException;

/**
 * Simple caching class with basic interface
 *
 */
var RefCache = exports.RefCache = function() {};

/**
 * Initialize cache storage and configuration
 *
 * @param {CacheConfig} config
 */
RefCache.prototype.init = function(config, callback) {
    if (this._store)
        return;

    if (!arguments.length)
        throw cacheException(RefCacheException.notConfigured);

    // Init store
    this._store = {};
    this._storeLength = 0;

    callback && process.nextTick(callback);

    return this;
};

/**
 * An informative method telling the parent whether this cache can
 * be used synchronously.
 *
 * @returns {RefCache}
 */
RefCache.prototype.isSync = function() {
    return this;
};

/**
 * Synchronously get object from cache.
 *
 * @param {String} key
 * @returns {Any}
 */
RefCache.prototype.getSync = function(key) {
    this.init();

    return this._store[key];
};

/**
 * Asynchronously get object from cache.
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {RefCache}
 */
RefCache.prototype.get = function(key, callback) {
    this.init();

    callback && process.nextTick(callback.bind(null, this._store[key]));

    return this;
};

/**
 * Asynchronously put object to cache
 *
 * @param {String} key
 * @param {Any} obj
 * @param {Function} callback
 * @returns {RefCache}
 */
RefCache.prototype.put = function(key, obj, callback) {
    this.init();

    // store the key
    this._store[key] = obj;
    this._storeLength++;

    // schedule callback for next tick
    callback && process.nextTick(callback);

    return this;
};

/**
 * Synchronously put object to cache
 *
 * @param {String} key
 * @param {Any} obj
 * @returns {RefCache}
 */
RefCache.prototype.putSync = function(key, obj) {
    this.init();

    // store the key
    this._store[key] = obj;
    this._storeLength++;

    return this;
};

/**
 * Asynchronously remove object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {RefCache}
 */
RefCache.prototype.remove = function(key, callback) {
    this.init();

    callback && process.nextTick(callback.bind(null, this._store[key]));
    delete this._store[key];
    this._storeLength--;

    return this;
};

/**
 * Synchronously remove object from cache
 *
 * @param {String} key
 * @param {Function} callback
 * @returns {RefCache}
 */
RefCache.prototype.removeSync = function(key, callback) {
    this.init();

    var v = this._store[key];
    delete this._store[key];
    this._storeLength--;

    return v;
};
