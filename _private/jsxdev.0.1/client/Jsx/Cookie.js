/**
 * @class Jsx.Cookie Cookie 操作类
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');

define(function() {

    Class('Jsx.Cookie', null, null, {

        /**
         * 根据名字取Cookie值
         * @param {String} name cookie的名称
         * @return {String} 返回cookie值
         * @static
         */
        get: function(name) {
            var i = document.cookie.match(new RegExp('(?:^|;\\s*){0}=([^;]+)(;|$)'.format(name)));
            return i && decodeURIComponent(i[1]);
        },

        /**
         * 获取全部Cookie
         * @return {Object} 返回cookie值
         * @static
         */
        getAll: function() {

            var j = document.cookie.split(';');
            var cookie = {};

            for (var i = 0, len = j.length; i < len; i++) {

                var item = j[i];
                if (item) {

                    item = item.split('=');

                    cookie[item[0]] = decodeURIComponent(item[1]);
                }
            }

            return cookie;
        },

        /**
         * 设置cookie值
         * @param {String}  name 名称
         * @param {String}  value 值
         * @param {Date}    expires (Optional) 过期时间
         * @param {String}  path    (Optional)
         * @param {String}  domain  (Optional)
         * @param {Boolran} secure  (Optional)
         * @static
         */
        set: function(name, value, expires, path, domain, secure) {

            var cookie =
                '{0}={1}{2}{3}{4}{5}'.format(
                    name, encodeURIComponent(value),
                    expires ? '; Expires=' + expires.toUTCString() : '',
                    path ? '; Path=' + path : '',
                    domain ? '; Domain=' + domain : '',
                    secure ? '; Secure' : ''
                );
            document.cookie = cookie;
        },

        /**
         * 删除一个cookie
         * @param {String}  name 名称
         * @param {String}  path    (Optional)
         * @param {String}  domain  (Optional)
         * @static
         */
        remove: function(name, path, domain) {

            Jsx.Cookie.set(name, 'NULL', new Date(0, 1, 1), path, domain);
        },


        /**
         * 删除全部cookie
         * @static
         */
        removeAll: function() {

            var cookie = this.getAll();
            for (var i in cookie)
                this.remove(i);
        }

    });

});