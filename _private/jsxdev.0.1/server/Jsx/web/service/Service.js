/**
 * @class Jsx.web.service.Service base service abstract class
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('node/querystring.js');

define(function() {
    var querystring = node.querystring;

    Class('Jsx.web.service.Service', null, {

        //private:
        _cleanurl: null,
        _dir: null,
        _extname: null,
        _params: null,

        //public:
        /**
         * server
         * @type {Jsx.web.Server}
         */
        server: null,
        
        /**
         * request of server
         * @type {http.ServerRequest}
         */
        request: null,
        
        /**
         * request host
         * @type {String}
         */
        host: '',
        
        /**
         * request path
         * @type {String}
         */
        url: '',
        
        /**
         * no param url
         * @type {String}
         */
        get cleanurl() {
       
            if(!this._cleanurl) 
                this._cleanurl = this.url.match(/[^\?\#]+/)[0];

            return this._cleanurl;
        },
        
        /**
         * request path directory
         * @type {String}
         */
        get dir() {
            
            if(!this._dir)
                this._dir = this.cleanurl.replace(/[^\/]*$/, '');
            return this._dir;
        },
        
        /**
         * request extended name
         * @type {String}
         */
        get extname() {
        
            if(this._extname === null) {
                var mat = this.cleanurl.match(/\.(.+)/);
                this._extname = mat ? mat[1] : '';
            }
            return this._extname;
        },
        
        /**
         * url param list
         * @type {Object}
         */
        get params() {

            if(!this._params) {
                var mat = this.url.match(/\?(.+)/);
                this._params = querystring.parse(mat ? mat[1] : '');
            }
            return this._params;
        },
        
        /**
         * set request timeout
         * @param {Number} time
         */
        setTimeout: function(time) {
            this.request.socket.setTimeout(time);
        },
        
        /**
         * init base service
         * @param {http.ServerRequest} req
         * @constructor
         */
        initBase: function(req) {
            this.server = req.socket.server;
            this.request = req;
            this.host = req.headers.host;
            this.url = decodeURI(req.url);
            this.setTimeout(this.server.timeout * 1e3);
        },

        /**
         * authentication by default all, subclasses override
         * @param {Function} cb
         * @param {String}   action
         */
        auth: function(cb, action) {
            cb(null, true);
        },

        /**
         * call function virtual function
         * @param {Object} info service info
         */
        action: virtual

    });


});