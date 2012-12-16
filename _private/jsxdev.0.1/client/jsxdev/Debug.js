/**
 * @class jsxdev.Debug
 * @extends Jsx.io.WSClient
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/dom/Element.js');
include('Jsx/io/WSClient.js');
include('extjs/ext.js');
include('jsxdev/Commands.js');

define(function(global) {

    function initThreadSelectBar(_this) {
        var threads = _this.threads;
        var ls = [];
        for (var i in threads) {
            var thread = threads[i]
            ls.push([thread.name + ': ' + i, i]);
        }

        _this._bar[10].store.loadData(ls);
    }

    function init(_this) {
        var ide = _this.develop;
        var bar = _this._bar;
        var conversation = _this.conversation;
        var _console = ide.west.console;
        var watch = ide.west.Watch;

        conversation.onerror.on(function(event) {
            Ext.Msg.error('', event.data.message);
        });

        conversation.onclose.on(function() {
            Ext.Msg.error('', 'Lost connection with server');
            stop(_this);
        });

        _this.on('error', function(e) {
            Ext.Msg.error('', e.data.message);
        });

        _this.$on('serverstop', stop);

        _this.on('ready', function(e) {

            var thread = e.data;
            var id = thread.threadId;
            var threads = _this.threads;
            var once = true;
            for (var i in threads) {
                once = false;
                break;
            }

            thread.isBreak = false;
            threads[id] = thread;
            _console.error('Thread start ' + thread.name + ' ' + thread.threadId);

            //TODO
            initThreadSelectBar(_this);
            if (once)
                update(_this, id);
        });

        _this.on('break', function(e) {

            var data = e.data;
            var id = data.threadId;
            //var script = data.body.script;

            data.isBreak = true;

            Jsx.extend(_this.threads[id], data);
            update(_this, id);
        });


        watch.onadds.on(function(e) {
            _this.call('addWatchsExp', [e.data]);
        });

        watch.onremoves.on(function(e) {
            _this.call('unWatchsExp', [e.data]);
        });

        watch.onupdates.on(function(e) {
            var data = e.data;
            _this.call('updateWatchsExp', [data.old, data.value]);
        });

        watch.onload.on(function(e) {
            var node = e.data;
            var id = _this.current;
            var thread = _this.threads[id];

            if (!_this.isDebug || !thread || !thread.isBreak)
                return watch.setNode(node, { type: 'Error', value: 'Did not choose a running thread' });

            var exp = watch.getNodeExpression(node);

            _this.call('watchs', [id, [exp]], function(err, data) {
                if (err)
                    return watch.setNode(node, { type: 'Error', value: err.message });
                watch.setNode(node, data[0]);
            });
        });

        _console.onstdin.on(function(e) {
            var id = _this.current;
            if (!_this.current)
                return _console.error('Did not choose a running thread');

            _this.call('eval', [id, e.data], function(err, e) {
                if (err)
                    return _console.error(err.message);
                _console.log(e.text);
            });
        });

        _this.on('stdout', function(e) {
            _console.log(e.data.body);
        });

        _this.on('stderr', function(e) {
            _console.error(e.data.body);
        });

        _this.on('exit', function(e) {

            var threads = _this.threads;
            var first = 0;
            var id = e.data.threadId;
            var thread = threads[id];

            if (!thread)
                return;

            _console.error('Thread end ' + thread.name + ' ' + thread.threadId);
            thread.isBreak = false;
            update(_this, id);
            delete threads[id];


            initThreadSelectBar(_this);
            //TODO
            for (var i in threads) {

                var thread = threads[i];
                if (!first)
                    first = i;
                if (thread.isBreak)
                    return update(_this, i);
            }
            update(_this, first);
        });

        bar[1].on('click', _this.start, _this);         //Start run not debug Ctrl+F5
        bar[2].on('click', _this.run, _this);  //Run F5
        bar[3].on('click', _this.stop, _this);          //Stop Shift+F5
        bar[4].on('click', _this.restart, _this);       //Restart Ctrl+Shift+F5
        bar[6].on('click', _this.next, _this);          //Next F6
        bar[7].on('click', _this.step, _this);          //Step F7
        bar[8].on('click', _this.out, _this);           //Out F8
        bar[10].on('select', function(a, b) {
            var id = b.data.value;
            if (_this.current !== id)
                update(_this, id);
        });
    }

    function start(_this, port) {
        _this.debugPorts = port;
        _this.isStart = true;

        var bar = _this._bar;
        bar.forEach(function(item) {
            item.disable();
        });

        bar[3].enable();
        if (_this.isDebug) {
            bar[4].enable();
            bar[10].enable();
        }
    }

    function stop(_this) {
        _this.isStart = false;
        _this.isDebug = false;

        var threads = _this.threads;
        for (var i in threads) {
            var thread = threads[i];
            thread.isBreak = false;
            update(_this, i);
        }

        _this.threads = {};
        initThreadSelectBar(_this);
        
        var bar = _this._bar;
        bar.forEach(function(item) {
            item.disable();
        });

        bar[1].enable();
        bar[2].enable();
    }

    //update debug thread
    function update(_this, id) {
        _this.current = id;

        var thread = _this.threads[id];
        var bar = _this._bar;
        var ide = _this.develop;
        var center = ide.center;
        var watch = ide.west.Watch;

        if (!thread)
            return bar[10].setValue('');

        if (thread.isBreak) {
            bar[2].enable();
            bar[6].enable();
            bar[7].enable();
            bar[8].enable();

            var body = thread.body;
            var row = body.sourceLine;
            var line = body.sourceLineText;
            var startColumn = line.match(/^\s*/)[0].length;
            var endColumn = line.match(/(.*?)\s*(\/(\*|\/).*)?$/)[1].length;
            var watchsExp = thread.watchsExp;
            var name = body.script.name;

            center.openFile(name);

            if (watchsExp && watchsExp.length)
                watch.setAll(watchsExp);
            //.map(function(item) { return item.body })
            watch.enable();
            center.findById(name).setBreak({ row: row, startColumn: startColumn, endColumn: endColumn });
        }
        else {
            bar[2].disable();
            bar[6].disable();
            bar[7].disable();
            bar[8].disable();

            var name = Jsx.get('body.script.name', thread);
            if (name) {
                var component =
                    center.findById(name);
                if (component)
                    component.clearBreak();
            }
            watch.disable();
        }
        bar[10].setValue(id);
    }

    function _continue(_this, command) {
        var id = _this.current;
        var thread = _this.threads[id];
        if (!_this.isDebug || !thread || !thread.isBreak)
            return;

        thread.isBreak = false;
        _this.call(command, [id]);
        update(_this, id);
    }

    Class('jsxdev.Debug', Jsx.io.WSClient, {

        _bar: null,

        //public:
        /**
         * ide 
         * @type {jsxdev.develop}
         */
        develop: null,

        /**
         * server run port list
         * @type {Number[]}
         */
        debugPorts: null,

        /**
         * is start run
         * @type {Boolean}
         */
        isStart: false,

        /**
         * is debug
         * @type {Boolean}
         */
        isDebug: false,

        /**
         * @type {Object}
         */
        threads: null,

        /**
         * current thread
         * @type {Number}
         */
        current: 0,

        /**
         * constructor function
         * @param {jsxdev.develop} develop
         * @constructor
         */
        Debug: function(develop) {
            this.WSClient('jsxdev.Debug');
            this.develop = develop;
            this._bar = develop.west.topToolbar.items.items;
            this.threads = {};
            init(this);
        },
        
        /**
         * run
          */
        run: function() {
            if (this.isStart)                              //is start run
                this.cont();
            else
                this.start('true');
        },

        /**
         * start run
         * @param {Boolean}  debug
         * @param {Function} cb
         */
        start: function(debug) {

            if (this.isStart)
                return;
            var _this = this;
            debug = (debug == 'true');

            this.call('start', [debug], function(err, data) {
                if (err)
                    return Ext.Msg.error('', err.message);

                _this.isDebug = debug;
                _this.develop.west.console.error(
                    'web server {0} mode start on port {1}, http://{2}:{1}/'
                    .format(debug ? 'debugger' : 'normal', data[1], location.hostname));

                //TOOD set ui
                start(_this, data);
            });
        },

        /**
         * stop
         */
        stop: function() {
            if (this.isStart)
                this.call('stop');
        },

        /**
         * restart
         */
        restart: function() {

            if (!this.isStart)
                return;
            var _this = this;

            this.call('restart', function(err, data) {
                if (err)
                    return Ext.Msg.error('', err.message);
                stop(_this);

                _this.isDebug = true;
                start(_this, data);
            });
        },

        /**
         * cont
         */
        cont: function() {
            _continue(this, 'cont');
        },

        /**
         * step
         */
        step: function() {
            _continue(this, 'step');
        },

        /**
         * next 
         */
        next: function() {
            _continue(this, 'next');
        },

        /**
         * out
         */
        out: function() {
            _continue(this, 'out');
        }

    });
});

