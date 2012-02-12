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
 * TODO: Cleanups on full seconds are not such a good idea.
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
    "maxLength" : 16384,   // How many objects to keep (16K objects)
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

    this._cleanups = {};
    this._cleanupKeys = [];

    this._storeKeyCleanups = {};

    // Set next cleanup time in maximum future
    this._nextCleanup = Infinity;
    this._cleanupTimeout = null;

};

ExpirableCache.prototype.put = function(key, obj, time, callback) {
    // optionals
    if (!callback) {
        callback = time;
        time = this._keepTime;
    }

    this._engine.put(key, obj, time, callback);

    // schedule removal of expired keys
    this._scheduleCleanup(key, time);

    // schedule callback for next tick
    callback && process.nextTick(callback);

    return this;
};

ExpirableCache.prototype.get = function() {
    this._engine.get.apply(arguments);
};

/**
 * Schedules a pending clean operation.
 *
 * If the index length exceeds the specified maximum
 *
 * +1 . . . .-1 +1 . . .+2-1 . . .-2 +1 . . .+3-1 . . .(-2-3)
 *
 * @param {String} key
 * @param {Number} time
 */
ExpirableCache.prototype._scheduleCleanup = function(key, time) {

    if (!time) {
        time = key;
        key = false;
    }

    var cleanTime = ~~(new Date().getTime() / this._cleanInt + 1)
                    * this._cleanInt;

    if (this._storeKeyCleanups[key] &&
            this._cleanups[this._storeKeyCleanups[key]]) {

        var oldCleanup = this._cleanups[this._storeKeyCleanups[key]];
        oldCleanup.splice(oldCleanup.indexOf(key), 1);
        if (!oldCleanup.length) {
            delete this._cleanups[this._storeKeyCleanups[key]];
        }
    }

    this._cleanups[cleanTime] = this._cleanups[cleanTime] ||
        this._cleanupKeys.push(cleanTime) && [];

    this._cleanups[cleanTime].push(key);

    this._storeKeyCleanups[key] = this._cleanups[cleanTime];

    if (cleanTime < this._nextCleanup) {
        if (this._cleanupTimeout) {
            clearTimeout(this._cleanupTimeout);
            this._cleanupTimeout = null;
        }
        this._cleanupTimeout = setTimeout(this._cleanup.bind(this),
                cleanTime - new Date().getTime());
    }

};

/**
 * Cleans outdated and overflown cache entries.
 */
ExpirableCache.prototype._cleanup = function() {

    this._cleanupKeys = this._cleanupKeys.sort();

    var now = new Date().getTime(), c = this._cleanupKeys, i = 0, k, d = c[0];

    while (d < now || this._storeLength > this._indexSize) {

        // get cleanup
        d = c.shift();
        k = this._cleanups[d];

        for (i = 0; i < k.length; i++) {
            delete this._store[k[i]];
            delete this._cleanupKeys[k[i]];
            this._storeLength--;
        }


    }
};
