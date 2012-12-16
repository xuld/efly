/**
 * @class JSON
 * 解析JSON对像 
 * If you would like to compatible with earlier versions of the browser, 
 * that contains the file. Contain these browsers IE6, 7,8, Android early.
 * 
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */


if (!global.JSON) {

    global.JSON = {

        /**
         * 转换JSON字符串为Object
         * @param {String} json 要转换的字符串
         * @static
         */
        parse: function(json) {
            return EVAL('(' + json + ')');
        },

        /**
         * 转换Object为JSON字符串
         * @param {Object} value       要转换的对像
         * @param {String[]} whitelist 转换条件列表
         * @return {String}
         * @static
         */
        stringify: function(value, whitelist) {

            var m = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' };
            var a, i, k, l, v, r = /["\\\x00-\x1f\x7f-\x9f']/g;

            switch (typeof value) {
                case 'string':

                    return (r.test(value) ? '"' + value.replace(r, function(a) {
                        var c = m[a];
                        if (c)
                            return c;

                        c = a.charCodeAt();

                        return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
                    })
                        + '"' : '"' + value + '"');

                case 'number':
                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                    return value.toString();

                case 'null':
                    return String(value);

                case 'object':
                    if (!value)
                        return 'null';
                    if (typeof value.getDate === 'function') {

                        var year = value.getUTCFullYear();
                        var month = value.getUTCMonth() + 1;
                        var date = value.getUTCDate();
                        var hours = value.getUTCHours();
                        var minutes = value.getUTCMinutes();
                        var seconds = value.getUTCSeconds();
                        var milliseconds = value.getUTCMilliseconds();

                        return
                        year + '-' +
                            (month < 10 ? '0' : '') + month + '-' +
                            (date < 10 ? '0' : '') + date + 'T' +
                            (hours < 10 ? '0' : '') + hours + ':' +
                            (minutes < 10 ? '0' : '') + minutes + ':' +
                            (seconds < 10 ? '0' : '') + seconds + '.' +
                            milliseconds + 'Z';
                    }

                    a = [];
                    if (typeof value.length === 'number' && !(value.propertyIsEnumerable('length'))) {

                        l = value.length;

                        for (i = 0; i < l; i += 1)
                            a.push(JSON.stringify(value[i], whitelist) || 'null');

                        return '[' + a.join(',') + ']';
                    }

                    if (whitelist) {
                        l = whitelist.length;
                        for (i = 0; i < l; i += 1) {
                            k = whitelist[i];
                            if (typeof k === 'string') {
                                v = JSON.stringify(value[k], whitelist);
                                if (v)
                                    a.push(JSON.stringify(k) + ':' + v);
                            }
                        }
                    }
                    else {

                        for (k in value) {
                            if (typeof k === 'string') {
                                v = JSON.stringify(value[k], whitelist);
                                if (v)
                                    a.push(JSON.stringify(k) + ':' + v);
                            }
                        }

                    }
                    return '{' + a.join(',') + '}';
            }
        }
    };
}
