/**
 * @class Jsx.Path url path 路径处理
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */
 
include('Jsx/Util.js');

define(function() {
    var _LOCATION = location + '';
    
    function get(search, name){
        if(!search)
            return null;
        var r = new RegExp('(^|&+)' + name + '=([^&]*)(&|$)');
        var m = search.match(r);
        return m ? decodeURIComponent(m[2]) : null;
    }

    function set(search, name, value){
        search = rm(search || '', name);
        if(value === undefined || value === null)
            return search;
        var values = name + '=' + encodeURIComponent(value);
        return search ? search + '&' + values : values;
    }
    
    function rm(search, name){
        if(!search)
            return search;
        var reg = new RegExp('(^|&)(&*{0}=[^&]*)(&+|$)'.format(name), 'g');
        return search.replace(reg, function(all, a){
            return a || '';
        });
    }

    function split(url){
        url = Jsx.format(url || _LOCATION);
        var ls = url.split('?');
        var search = ls.splice(1);
        var hash;
        
        if(search.length) {
            search = search.join('?').split('#');
            hash = search.splice(1);
            if(hash.length)
                search.push(hash.join('#'));
            return ls.concat(search);
        }
        else{
            ls = url.split('#');
            hash = ls.splice(1);
            if(hash.length)
                ls.push(undefined, hash.join('#'))
        }
        return ls;
    }
    
    function format(ls){
        return ls[0] + (ls[1] ? '?' + ls[1] : '') + (ls[2] ? '#' + ls[2] : '');
    }

    var Path =

    Class('Jsx.Path', null, null, {

        /**
         * 获取URL参数
         * @param {String} name 获取url参数名称
         * @param {String} url (Optional) 要操作的URL
         * @return {String} 返回参数值
         */
        get: function(name, url) {
            return get(split(url)[1], name);
        },

        /**
         * 设置URL参数
         * @param {String} name url参数名称
         * @param {String} value 要操作的URL
         * @param {String} url (Optional) 要设置的url,默认使用当前url
         * @return {String} 返回新URL
         */
        set: function(name, value, url) {
            var ls = split(url);
            ls[1] = set(ls[1], name, value);
            return format(ls);
        },

        /**
         * 移除URL参数
         * @param {String} name 要移除的参数名称
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String} 返回删除后的URL
         * @static
         */
        remove: function(name, url) {
            var ls = split(url);
            ls[1] = rm(ls[1], name);
            return format(ls);
        },
        
        /**
         * 移除URL hash参数
         * @param {String} name 要移除的参数名称
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String} 返回参数值
         * @static
         */
        getHash: function(name, url) {
            return get(split(url)[2], name);
        },
        
        /**
         * 设置URL hash参数
         * @param {String} name 要移除的参数名称
         * @param {String} value 要操作的URL
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String} 返回设置参数后的URL
         * @static
         */
        setHash: function(name, value, url) {
            var ls = split(url);
            ls[2] = set(ls[2], name, value);
            return format(ls);
        },

        /**
         * 移除URL hash参数
         * @param {String} name 要移除的参数名称
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String} 返回删除参数后的URL
         * @static
         */
        removeHash: function(name, url) {
            var ls = split(url);
            ls[2] = rm(ls[2], name);
            return format(ls);
        },

        /**
         * 通过url获取主机头
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String}
         * @static
         */
        host: function(url) {
            return Jsx.format(url || _LOCATION).match(/^(https?|wss?):\/\/([^\/]*)/i)[2];
        },

        /**
         * get hostname
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String}
         */
        hostname: function(url) {
            return Path.host(url).split(':')[0];
        },

        /**
         * 通过url获取端口号
         * @param  {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {Number}
         * @static
         */
        port: function(url) {
            return parseInt(Path.host(url).split(':')[1]) || null;
        },

        /**
         * 获取干净的不带参数的URL
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String}
         * @static
         */
        cleanurl: function(url) {
            return Jsx.format((url || _LOCATION).replace(/[\?\#].*$/, ''));
        },

        /**
         * 获取网页目录
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String}
         * @static
         */
        dir: function(url) {
            return Path.cleanurl(url || _LOCATION).replace(/\/[^\/]*$/, '') + '/';
        },

        /**
         * 通过url获取根目录
         * @param {String} url (Optional) 要操作的URL,默认使用当前url
         * @return {String}
         * @static
         */
        rootdir: function(url) {
            return Jsx.format(url || _LOCATION).match(/^(https?|wss?):\/\/[^\/]*/i) + '/';
        },

        /**
         * 是否为完整URL
         * @param {String} url 要操作的URL
         * @return {Boolean}
         * @static
         */
        is: function(url) {
            return new RegExp('^(https?|wss?)://.+', 'i').test(url);
        }

    });

});