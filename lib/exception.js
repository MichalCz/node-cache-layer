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

"use strict";

/**
 * Returns a cache exception
 *
 * @param {any} extype
 * @param {Error} e
 * @returns {Error}
 */
var cacheException = exports.cacheException = function(extype, e) {
    if (extype instanceof Error) {
        e = extype;
        extype = null;
    }

    e = e || new Error();

    if (extype) {

        if (extype.msg)
            e.message = extype.msg;

        if (extype.errno)
            e.errno = e.code = extype.errno;

        if (extype.symbol)
            e.symbol = extype.symbol;

    } else {

        e.message = extype.toString();

    }

    return e;
};

cacheException.notConfigured = {
        msg: 'Cache is not configured',
        symbol: 'P_CRT_ERR_CACHE_NONCONF'
    };

cacheException.unknownStorage = {
        msg: 'Could not load cache standard storage module: %s',
        symbol: 'P_CRT_ERR_CACHE_STORLOAD'
    };

cacheException.unknownStrategy = {
        msg: 'Could not load cache standard strategy module: %s',
        symbol: 'P_CRT_ERR_CACHE_STRGLOAD'
    };

