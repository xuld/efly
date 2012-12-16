/**
 * @class jsxdev.BrowserBreak
 * @extends Jsx.web.service.HttpService
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/service/HttpService.js');
include('jsxdev/Debug.js');

define(function() {
    var Conversation = Jsx.web.service.conversation.Conversation;

    function error(_this, cb) {
        _this.returnError('error');
        cb(null, false);
    }

    Class('jsxdev.BrowserBreak', Jsx.web.service.HttpService, {

        debug: null,

        auth: function(cb) {
            var params = this.params;
            var auth = params.auth;
            var token = params.token;

            if (!auth || !token)
                return error(this, cb);

            var conv = Conversation.get(token);
            if (!conv)
                return error(this, cb);
            var debug = conv.service

            if (
                !(debug instanceof jsxdev.Debug) || debug.globalAuthId != auth ||
                !debug.startup ||
                !debug.debug
            )
                return error(this, cb);

            this.debug = debug;
            this.response.setHeader('Access-Control-Allow-Origin', '*'); //ajax x domain

            cb(null, true);
        },

        ready: function() {
            this.debug.newBrowserThread().init(this);
        },

        'break': function(threadId, data, cb) {
        
            var thread = this.debug.threads[threadId];
            if (!thread)
                return cb('Can not find the Thread');

            thread['break'](this, data);
        },

        exit: function(threadId, cb) {

            var thread = this.debug.threads[threadId];
            if (!thread)
                return cb('Can not find the Thread');

            cb();
            thread.exit();
        }

    });

});


