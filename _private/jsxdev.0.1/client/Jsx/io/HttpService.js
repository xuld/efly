/**
 * @class Jsx.io.HttpService
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Config.js');
include('Jsx/Delegate.js');
include('Jsx/Path.js');

define(function(global) {
    var Path = Jsx.Path;
    var SERVICES = {};
    global.__jsonp__ = {};

    // cross-domain jsonp
    function _jsonp(url, callback, err) {

        var DOC = document;
        var jsonp = '_' + Jsx.guid();
        var url = Path.set('jsonp', '__jsonp__.' + jsonp, url);
        var head = DOC.getElementsByTagName('head')[0];
        var script = DOC.createElement('script');

        function cb(data, m) {

            head.removeChild(script);
            delete __jsonp__[jsonp];

            if (m == 'err') {
                err.message = data;
                data = undefined;
            }
            else
                err = undefined;

            callback(err, data);
        }

        head.appendChild(script);
        __jsonp__[jsonp] = cb;
        script.onerror = cb.bind(null, 'ajax jsonp error', 'err');
        script.src = url;
    }

    // request
    function _request(_this, type, url, param, callback) {

        var p = [];
        var key = url;

        for (var i in param) {
            var item = param[i];
            var value = encodeURIComponent(typeof item == 'object' ? JSON.stringify(item) : item);
            key = Path.remove(i, key);
            p.push(i + '=' + value);
        }

        p = p.join('&');
        key += (key.match(/\?/) ? '&' : '?') + p;
        var value = _getCache(_this, key);

        if (value) {
            if (callback)
                callback(null, value, true);
            return value;
        }

        if (_this._current[key]) //current param of request is no complete
            return;

        _this._current[key] = true;

        var cb = function(err, result) {
            delete _this._current[key];

            //game factory protocol
            if (result && result.err == '\u0000\ufffd') {
                delete result.err;
                err = result;
            }

            if (err)
                throwError(err, callback);
            else {
                if (type == 'GET')
                    _setCache(_this, key, result);
                return callback ? callback(err, result) : result;
            }
        }

        var dataType = _this.dataType;
        var isBrowserCache = _this.browserCache;

        if (_this.jsonp && Path.host(url).toLowerCase() != Path.host().toLowerCase()) {

            var err = {
                message: 'ajax-jsonp asyn mode only and return data must be json',
                url: url,
                data: param,
                type: type,
                jsonp: true,
                dataType: dataType
            };

            if (!callback || dataType != 'json')
                return throwError(err, callback);

            //Can not use the browser cache
            return _jsonp(key, cb, err);
        }

        if (type == 'GET') {
            p = null;
            url = isBrowserCache ? key : Path.set('_', Jsx.guid(), key);
        }

        var opt = {
            type: type,
            url: url,
            data: p,
            dataType: dataType,

            onopen: function(xhr) {
                type == 'POST' && xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
        };
        return callback ? Jsx.ajax(opt, cb) : cb(null, Jsx.ajax(opt));
    }

    //get cache
    function _getCache(_this, key) {

        if (_this.cacheTime !== 0)
            return _this._cache[key];
    }

    //set cache
    function _setCache(_this, key, value) {

        if (_this.cacheTime !== 0) {
            _this._cache[key] = value;

            setTimeout(function() { delete _this._cache[key]; }, _this.cacheTime);
        }
    }

    var HttpService =

    Class('Jsx.io.HttpService', null, {

        //private:
        _cache: null,   //cache the data
        _current: null, //current request item

        //public:
        /**
         * service name
         * @type {String}
         */
        name: '',
        
        /**
         * is use jsonp
         * @type {Boolean}
         */
        jsonp: true,

        /**
         * service path config
         * @type {String}
         * @static
         */
        path: Jsx.APP_DIR,

        /**
         * is use browser cache
         * @type {Boolean}
         */
        browserCache: false,

        /**
         * cache data time only to get effective
         * @type {Number}
         */
        cacheTime: 0,

        /**
         * response data type  'text' || 'json' || 'xml'
         * @type {String}
         */
        dataType: 'json',

        /**
         * call type 'get' || 'post'
         * @type {String}
         */
        callType: 'post',

        /**
         * constructor function
         * @param {String} name (Optional) service name
         * @param {String} path (Optional) service path config
         * @constructor
         */
        HttpService: function(name, path) {
            this._cache = {};
            this._current = {};
            this.name = name || '';
            this.path = Jsx.format(path || Jsx.Config.get('webService') || '');
        },

        /**
         * call api
         * @param  {String}   name                api name
         * @param  {Object}   parame   (Optional) call parame
         * @param  {Function} callback (Optional) call success callback and return data, not incoming use sync
         * @return {Object}                       if sync access immediately return the data
         */
        call: function(name, parame, callback) {

            if (typeof parame == 'function') {
                callback = parame;
                parame = {};
            }

            parame = Array.isArray(parame) ? { args: parame} : parame || {};
            var service = this.name;
            var mat = Path.remove('method', this.path).match(/^([^\?]+)(\?([^\#]+))?/);

            return this[this.callType]
                (
                    mat[1] + '?method=' + (service ? service + '.' : '') + name + (mat[3] ? '&' + mat[3] : ''),
                    parame,
                    callback
                );
        },

        /**
         * use get mode access data
         * @param  {String}   url                 visit the url
         * @param  {Object}   parame              query param
         * @param  {Function} callback (Optional) query success callback and return data, not incoming use sync
         * @return {Object}                       if sync access immediately return the data
         */
        get: function(url, parame, callback) {
            return _request(this, 'GET', url, parame, callback);
        },

        /**
         * use post mode access data
         * @param  {String}   url                 visit the url
         * @param  {Object}   parame              send paeam
         * @param  {Function} callback (Optional) send success callback and return data, not incoming use sync
         * @return {Object}                       if sync access immediately return the data
         */
        post: function(url, parame, callback) {
            return _request(this, 'POST', url, parame, callback);
        }

    }, {

        /**
         * get service by name
         * @param  {String} name
         * @return {Jsx.io.HttpService}
         * @static
         */
        get: function(name) {
            if (!name)
                throw new Error('service name can not be empty');
            var service = SERVICES[name];

            if (!service)
                SERVICES[name] = service = new HttpService(name);
            return service;
        }

    });

});