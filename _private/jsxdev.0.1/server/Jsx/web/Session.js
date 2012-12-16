/**
 * @class Jsx.web.Session server session
 * @createTime 2012-01-20
 * @updateTime 2012-03-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/web/service/HttpService.js');
include('Jsx/web/Cookie.js');

define(function() {
    var HttpService = Jsx.web.service.HttpService;
    var Cookie = Jsx.web.Cookie;

    var SESSIONS = {};
    var SESSION_TOKEN_NAME = '__SESSION_TOKEN_NAME__';

    function deleteSession(token) {
        var data = SESSIONS[token];

        if (data.ws)
            return data.timeout = deleteSession.delay(data.expired, token);
        delete SESSIONS[token];
    }

    function getData(_this) {
        var token = _this.token;

        if (!token) {
            _this.token = token = Jsx.guid();
            var service = _this._service;

            if (service instanceof HttpService)  // http service
                service.cookie.set(SESSION_TOKEN_NAME, token);
            else  //ws service
                throw 'Can not set the session, session must first be activated in HttpService';
        }

        var expired = _this._service.server.session * 6e4;

        var se = SESSIONS[token] || (SESSIONS[token] = {
            timeout: deleteSession.delay(expired, token),
            expired: expired,
            data: {},
            ws: 0
        });
        return se;
    }

    Class('Jsx.web.Session', null, {

        //private:
        _service: null,

        /**
         * Conversation token
         * @type {Number}
         */
        token: 0,

        /**
         * constructor
         * @param {Jsx.service.Service} service Jsx.service.HttpService or Jsx.service.WSService
         * @constructor
         */
        Session: function(service) {
            this._service = service;

            var is = service instanceof HttpService;
            var cookie = is ? service.cookie : new Cookie(service.request);
            var token = cookie.get(SESSION_TOKEN_NAME);

            if (!token)
                return;

            this.token = token;
            var data = SESSIONS[token];
            if (data) {

                clearTimeout(data.timeout);
                data.timeout = deleteSession.delay(service.server.session * 6e4, token);
            }

            if (is)  // ws service
                return

            var _this = this;
            var conv = service.conversation;

            conv.onopen.on(function() {
                var data = getData(_this);

                data.ws++;
                conv.onclose.on(function() { data.ws--; });
            });
        },

        /**
         * get session value by name
         * @param  {String} name session name
         * @return {String}
         */
        get: function(name) {
            var se = SESSIONS[this.token];
            return se ? se.data[name] ? se.data[name] : null : null;
        },

        /**
         * set session value
         * @param {String} name
         * @param {String} value
         */
        set: function(name, value) {
            getData(this).data[name] = value;
        },

        /**
         * delete session
         * @param {String} name
         */
        remove: function(name) {
            var token = this.token;
            if (!token)
                return;
            var se = SESSIONS[token];
            if (se)
                delete se.data[name];
        },

        /**
         * get all session
         * @return {Object}
         */
        getAll: function() {
            return getData(this).data;
        },

        /**
         * delete all session
         */
        removeAll: function() {
            var token = this.token;
            if (!token)
                return;
            var se = SESSIONS[token];
            if (se)
                se.data = {};
        }

    });
});