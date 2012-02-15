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
 * A simple put, get, remove cache API
 *
 */

"use strict";

var cacheException = require('./exception.js').cacheException;

/**
 * Initialize cache storage and strategy, return a cache object.
 *
 * TODO: Should there be an event emitted upon cache initialization?
 * TODO: Or maybe a callback?
 *
 * @param {CacheConfig} config
 *
 */
exports.init = function(config, Storage, Strategy, callback) {

    Strategy = Strategy || getStandardStrategy(config.strategy);
    Storage = Storage || getStandardStorage(config.storage);

    var cache = new Strategy().init(config, Storage, callback);

    return cache;

};

exports.memoize = function(func, config, Storage, Strategy) {
    config = config || {storage: 'refcache', strategy :'expirable'};

    var cache = exports.init(config, Storage, Strategy).isSync();

    return function() {
        var k = Array.prototype.concat.apply([], arguments).join('\0');
        return cache.getSync(k) || cache.putSync(k, func.apply(this, arguments)) && cache.getSync(k);
    };
};

var getStandardStorage = function(name) {
    switch (name) {
        case "refcache":
            return require('./storage/refcache').RefCache;
        default:
            throw cacheException(cacheException.unknownStorage);
    }
};

var getStandardStrategy = function(name) {
    switch (name) {
        case "expirable":
            return require('./strategy/expirable').ExpirableCache;
        case "primed":
            return require('./strategy/primed').PrimedCache;
        default:
            throw cacheException(cacheException.unknownStrategy);
    }
};

