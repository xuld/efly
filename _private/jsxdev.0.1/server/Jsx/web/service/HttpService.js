/**
 * @class Jsx.web.service.HttpService http service
 * @extends Jsx.web.service.StaticService
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/web/Cookie.js');
include('Jsx/web/service/StaticService.js');
include('Jsx/web/form/IncomingForm.js');
include('Jsx/web/Session.js');
include('node/zlib.js');
include('node/buffer.js');

define(function() {
    var zlib = node.zlib;
    var Buffer = node.buffer.Buffer;
    var IncomingForm = Jsx.web.form.IncomingForm;
    var REGEXP = /^_/;

    Class('Jsx.web.service.HttpService', Jsx.web.service.StaticService, {

        //public:

        /**
         * site cookie
         * @type {Jsx.web.Cookie}
         */
        cookie: null,

        /**
         * site session
         * @type {Jsx.web.Session}
         */
        session: null,

        /**
         * ajax jsonp callback name
         * @tpye {String}
         */
        jsonp: '',

        /**
         * post form
         * @type {Jsx.web.form.IncomingForm}
         */
        form: null,

        /**
         * post form data
         * @param {Object}
         */
        data: null,

        //overlay
        init: function(req, res) {
            this.Jsx_web_service_StaticService_init(req, res);

            this.cookie = new Jsx.web.Cookie(req, res);
            this.session = new Jsx.web.Session(this);
            this.jsonp = this.params.jsonp || '';
            this.data = {};

            var _this = this;
            if (req.method == 'POST') {
                var form = this.form = new IncomingForm(this);
                form.uploadDir = this.server.temp;
                
                form.onend.on(function() {
                    _this.data = Jsx.extend({}, Jsx.extend(form.fields, form.files));
                });
                form.parse();
            }
        },

        action: function(info) {

            /*
             * Note: 
             * The network fault tolerance, 
             * the browser will cause strange the second request, 
             * this error only occurs on the server restart, 
             * the BUG caused by the request can not respond to
             */

            var _this = this;
            var req = this.request;
            var action = info.action;
            var fn;

            //Filter private function
            if (REGEXP.test(action) || (fn = this[action], typeof fn != 'function'))
                return _this.Jsx_web_service_StaticService_action();

            delete info.service;
            delete info.action;

            function end() {
                var args = _this.data.args || _this.params.args;
                var ok = false;

                if (args) {
                    try {
                        args = JSON.parse(args);
                    } catch (e) { }
                }

                args = Jsx.values(info).concat(Array.isArray(args) ? args : []);
                args.push(function(err, data) {
                    if (ok)
                        throw 'callback has been completed';
                    ok = true;

                    err ? _this.returnError(err) : 
                    _this.result(data === undefined ? null : data);
                });

                fn.apply(_this, args);
            }

            var form = this.form;
            form ? form.onend.on(end) : req.on('end', end);
        },

        /**
         * return string to browser
         * @param {String} type    MIME type
         * @param {String} data    data
         */
        returnString: function(type, data) {

            var req = this.request;
            var res = this.response;
            var ae = req.headers['accept-encoding'];

            res.setHeader('Server', 'MoooGame Jsx');
            res.setHeader('Date', new Date().toUTCString());
            res.setHeader('Content-Type', type + ';charset=utf-8');

            if (this.server.agzip && ae && ae.match(/gzip/i)) {

                zlib.gzip(data, function(err, data) {
                    res.setHeader('Content-Encoding', 'gzip');
                    res.writeHead(200);
                    res.end(data);
                });
            }
            else {
                res.writeHead(200);
                res.end(data);
            }
        },

        /**
         * return error to browser
         * @param {Object} err
         */
        returnError: function(err) {

            if (typeof err == 'string')
                err = new Error(err);

            error = (err instanceof Error ? Jsx.extend({
                name: err.name,
                description: err.description,
                message: err.message
            }, err) : err);

            error.err = '\u0000\ufffd';
            this.result(error);
        },

        /**
         * return data to browser
         * @param {Object}  data
         */
        result: function(data) {

            var type = this.server.getMIME(this.jsonp ? 'js' : 'json');
            var result = JSON.stringify(data);

            if (this.jsonp)
                result = this.jsonp + '(' + result + ')';
            this.returnString(type, result);
        }
    });


});