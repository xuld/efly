/**
 * @class jsxdev.BrowserService
 * @extends Jsx.web.service.WSService
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('jsxdev/Debug.js');

define(function() {
    var Conversation = Jsx.web.service.conversation.Conversation;

    Class('jsxdev.BrowserService', Jsx.web.service.WSService, {

        thread: null,
        oncommand: null,

        BrowserService: function() {
            Jsx.Delegate.def(this, 'command');
        },

        auth: function(cb) {

            var params = this.params;
            var auth = params.auth;
            var token = params.token;

            if (!auth || !token)
                return cb(null, false);

            var conv = Conversation.get(token);

            if (!conv)
                return cb(null, false);
            var debug = conv.service

            if (
                !(debug instanceof jsxdev.Debug) ||
                debug.globalAuthId != auth ||
                !debug.startup ||
                !debug.debug
            )
                return cb(null, false);

            var thread =
            this.thread = debug.threads[params.threadId];
            var _this = this;

            if (!thread)
                return cb(null, false);

            this.conversation.onopen.on(function() {
                thread.wsClient(_this);
            });

            cb(null, true);
        },

        stdout: function(data) {
            this.thread.onstdout.emit(data);
        },

        stderr: function(data) {
            this.thread.onstderr.emit(data);
        },

        commandComplete: function(data) {
            //DOTO ?
            this.thread.commandComplete(data);
        }
        
        //,
        //exit: function() {
        //    this.thread.onexit.emit();
        //}
    });

});


