/**
 * @class Jsx.Storage 本地存储
 * @createTime 2012-06-08
 * @updateTime 2012-06-08
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('Jsx/Util.js');

define(function() {
    var LOCAL_STORAGE = localStorage;
    var CACHE_MARK_NAME = 'OF6U%;';
    var CACHE_REGEXP = /[^,]+$/;

    function format(name) {
        return name.replace(/,/g, '%m');
    }

    function removeName(names, name) {
        return names.replace(new RegExp('(^|,)' + name + '(,|$)', 'g'), function(all, start, end) {
            return start == end ? start : '';
        })
    }

    var Storage =

    Class('Jsx.Storage', null, null, {

        /**
         * 获取本地数据
         * @param  {String} name 名称
         * @return {Object}
         * @static
         */
        get: function(name) {
            return JSON.parse(LOCAL_STORAGE.getItem(format(name)) || 'null');
        },

        /**
         * 设置本地数据
         * @param {String} name 数据键
         * @param {Object} val 值
         * @static
         */
        set: function(name, val) {
            name = format(name);
            val = JSON.stringify(val);
            var names = LOCAL_STORAGE.getItem(CACHE_MARK_NAME);
            try {

                LOCAL_STORAGE.setItem(name, val);
                names = names ? name + ',' + removeName(names, name) : name;
                LOCAL_STORAGE.setItem(CACHE_MARK_NAME, names);
            }
            catch (e_) {
                if (names) {
                    Storage.remove(names.match(/[^,]+$/)[0]);
                    Storage.set(name, val);
                }
            }
        },

        /**
         * 删除本地数据
         * @param {String} key 数据键
         * @static
         */
        remove: function(name) {

            if (name) {
                name = format(name);
                var names = LOCAL_STORAGE.getItem(CACHE_MARK_NAME);
                if (names)
                    LOCAL_STORAGE.setItem(CACHE_MARK_NAME, removeName(names, name));
                LOCAL_STORAGE.removeItem(name);
            }
        },

        /**
         * 删除所有本地数据
         * @static
         */
        clear: function() {
            LOCAL_STORAGE.clear();
        }

    });
});