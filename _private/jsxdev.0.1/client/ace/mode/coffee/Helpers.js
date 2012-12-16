/**
* Copyright (c) 2011 Jeremy Ashkenas
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/


define(function() {

    function extend(object, properties) {
        var key, val;
        for (key in properties) {
            val = properties[key];
            object[key] = val;
        }
        return object;
    }

    function flatten(array) {
        var element, flattened, _i, _len;
        flattened = [];
        for (_i = 0, _len = array.length; _i < _len; _i++) {
            element = array[_i];
            if (element instanceof Array) {
                flattened = flattened.concat(flatten(element));
            } else {
                flattened.push(element);
            }
        }
        return flattened;
    }

    Class('ace.mode.coffee.Helpers', null, null, {

        starts: function(string, literal, start) {
            return literal === string.substr(start, literal.length);
        },
        ends: function(string, literal, back) {
            var len;
            len = literal.length;
            return literal === string.substr(string.length - len - (back || 0), len);
        },
        compact: function(array) {
            var item, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = array.length; _i < _len; _i++) {
                item = array[_i];
                if (item) {
                    _results.push(item);
                }
            }
            return _results;
        },
        count: function(string, substr) {
            var num, pos;
            num = pos = 0;
            if (!substr.length) {
                return 1 / 0;
            }
            while (pos = 1 + string.indexOf(substr, pos)) {
                num++;
            }
            return num;
        },
        merge: function(options, overrides) {
            return extend(extend({}, options), overrides);
        },
        extend: extend,
        flatten: flatten,
        del: function(obj, key) {
            var val;
            val = obj[key];
            delete obj[key];
            return val;
        },
        last: function(array, back) {
            return array[array.length - (back || 0) - 1];
        }

    });

});
