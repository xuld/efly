/**
 * @class jsxdev.BrowserThread
 * @extends jsxdev.Thread
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('jsxdev/Thread.js');

define(function() {
    var TIMEOUT = 2E4;

    function enqueue(_this, command) {
        var commands = _this._commands;
        commands.push(command);
        dequeue(_this);
    }

    function dequeue(_this) {
        var commands = _this._commands;
        if (!commands.length)
            return;

        var httpClient = _this._httpClient;
        var wsClient = _this._wsClient;
        var data = { threadId: _this.id, commands: commands.concat() };

        if (httpClient) {
            httpClient.result(data);
            _this._httpClient = null;
            timing(_this); //start timing exit
        }
        else if (wsClient && !_this.isBreak)
            wsClient.oncommand.emit(data);
        else return;

        _this._commands = [];
        var _waitCommands = _this._waitCommands;
        for (var i = 0, command; (command = commands[i]); i++) {
            if (command.receipt)
                _waitCommands.push(command);
            else {
                var cb = command.cb;
                cb && cb();
            }
        }
    }

    function setBreakpoints(_this, cb) {
        enqueue(_this, { command: 'setbreakpoints', arguments: { breakpoints: _this._breakpoints }, cb: cb, receipt: false });
    }

    function _continue(_this, stepaction, cb) {
        _this.isBreak = false;
        enqueue(_this, { command: 'continue', arguments: { stepaction: stepaction }, cb: cb, receipt: false });
    }

    function exit(_this) {
        enqueue(_this, { command: 'exit', receipt: false });
        //TODO?
        _this.onexit.emit();
        clearTiming(_this);
    }

    function timing(_this) {
        clearTiming(_this);
        if (_this._httpClient || _this._wsClient)
            return;
        //timeout exit
        _this._timeoutid = _this.onexit.emit.delay(_this.onexit, TIMEOUT);
    }

    function clearTiming(_this) {
        clearTimeout(_this._timeoutid);
    }

    Class('jsxdev.BrowserThread', jsxdev.Thread, {

        //private:
        _commands: null,
        _waitCommands: null,
        _httpClient: null, //Jsx.web.service.HttpService
        _wsClient: null,   //Jsx.web.service.WSService
        _timeoutid: 0,

        //public:
        /**
         * constructor
         * @param {Object} opt
         * @constructor
         */
        BrowserThread: function(opt) {
            this._commands = [];
            this._waitCommands = [];
            this.Thread(opt);
        },

        init: function(client) {
            this.setAllBreakpoints(this.breakpoints);

            var USER_AGENT = client.request.headers['user-agent'];
            var mobile = USER_AGENT.indexOf('Mobile') > -1;

            var platform =
                USER_AGENT.indexOf('Windows') > -1 ? USER_AGENT.indexOf('Windows Phone') > -1 ? 'Windows Phone' : 'Windows' :
                USER_AGENT.indexOf('Linux') > -1 ? USER_AGENT.indexOf('Android') > -1 ? 'Android' : 'Linux' :
                USER_AGENT.indexOf('Mac OS X') > -1 ? USER_AGENT.indexOf('iPhone') > -1 ? 'iPhone' :
                USER_AGENT.indexOf('iPad') > -1 ? 'iPad' : 'MacOS' : 'Other';

            this.name =
                platform + (
                USER_AGENT.match(/Trident|MSIE/) ? ' IE' :
                USER_AGENT.match(/Presto|Opera/) ? ' Opera' :
                USER_AGENT.indexOf('Chrome') > -1 ? ' Chrome' :
                USER_AGENT.indexOf('Safari') > -1 ? ' Safari' :
                USER_AGENT.indexOf('Gecko') > -1 && USER_AGENT.indexOf('KHTML') == -1 ? ' Firefox' : '');

            this.onready.emit();
            this._httpClient = client;
            dequeue(this);
        },

        'break': function(client, data) {

            this._httpClient = client;
            this.isBreak = true;

            var _this = this;

            clearTiming(_this);
            client.request.on('close', function() {
                _this._httpClient = null;
                exit(_this)
            });

            //var data = {
            //    seq: 9,
            //    type: 'event',
            //    event: 'break',
            //    body: {
            //        invocationText: '[anonymous]()',
            //        sourceLine: 1,
            //        sourceColumn: 0,
            //        sourceLineText: 'include(\'\')',
            //        script: {
            //            id: 32,
            //            name: 'D:/project/mooogame/kkk.js',
            //            lineOffset: 0,
            //            columnOffset: 0,
            //            lineCount: 5
            //        },
            //        breakpoints: [2]
            //    },
            //    watchsExp: []
            //};

            //var _data =
            //{
            //    type: 'break',    // 'break'|'againbreak'|'commandComplete'
            //    body: {},
            //    watchsExp: [],
            //    stdout: [],
            //    stderr: []
            //};

            dequeue(this);
        },

        wsClient: function(client) {
            var _this = this;
            this._wsClient = client;

            clearTiming(_this);
            client.conversation.onclose.on(function() {
                try{
                    _this._wsClient = null;
                    if(!_this._httpClient)
                        exit(_this);
                }
                catch(e){
                    console.error(e);
                }
            });
            dequeue(this);
        },

        commandComplete: function(data) {
            var commands = this._waitCommands;

            data.forEach(function(item) {
                var cb = commands.shift().cb;
                if (cb)
                    cb(item.error, item.result);
            })
        },

        //*****************************
        //overlay 
        set_watchsExp: function(expressions) {
            this._watchsExp = expressions || [];
            enqueue(this, { command: 'setwatchsexp', arguments: { expressions: this._watchsExp }, receipt: false });
        },

        //*****************************
        //overlay
        watchs: function(expressions, cb) {
            enqueue(this, { command: 'watchs', arguments: { expressions: expressions }, cb: cb, receipt: true });
        },

        //overlay
        eval: function(expression, cb) {
            enqueue(this, { command: 'evaluates', arguments: { expression: expression }, cb: cb, receipt: true });
        },

        //overlay
        setBreakpoints: function(name, breakpoints, cb) {

            var _breakpoints = this._breakpoints;
            var index = _breakpoints.propertyIndexOf('name', name);

            if (index == -1)
                _breakpoints.push({ name: name, breakpoints: breakpoints });
            else {
                var breakpoint = _breakpoints[index];
                var ls = breakpoint.breakpoints;
                
                breakpoints.forEach(function(item) {
                    if (!ls.indexOf(item))
                        ls.puhs(item);
                });
            }
            setBreakpoints(this, cb);
        },

        //overlay
        setAllBreakpoints: function(breakpoints, cb) {
            this._breakpoints = breakpoints;
            setBreakpoints(this, cb);
        },

        //overlay
        clearBreakpoints: function(name, breakpoints, cb) {
            var _breakpoints = this._breakpoints;
            var index = _breakpoints.propertyIndexOf('name', name);

            if (index == -1)
                return cb();

            var breakpoint = _breakpoints[index];
            var ls = breakpoint.breakpoints;
            breakpoints.forEach(function(item) {
                ls.removeVal(item);
            });
            
            if(!ls.length){
                _breakpoints.splice(index, 1);
            }
            
            setBreakpoints(this, cb);
        },

        //overlay
        clearAllBreakpoints: function(cb) {
            this._breakpoints = [];
            setBreakpoints(this, cb);
        },

        //overlay
        cont: function(cb) {
            _continue(this, null, cb);
        },

        //overlay
        next: function(cb) {
            _continue(this, 'next', cb);
        },

        //overlay
        step: function(cb) {
            _continue(this, 'in', cb);
        },

        //overlay
        out: function(cb) {
            _continue(this, 'out', cb);
        },

        //overlay
        exit: function() {
            nextTick(exit, this);
        }

    });
});