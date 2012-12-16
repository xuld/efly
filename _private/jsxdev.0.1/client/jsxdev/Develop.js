/**
 * @class jsxdev.Develop
 * @extends Ext.Viewport
 * @createTime 2012-01-28
 * @updateTime 2012-01-28
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('Jsx/Delegate.js');
include('extjs/ext.js');
include('jsxdev/dev/Center.js');
include('jsxdev/dev/East.js');
include('jsxdev/dev/West.js');
include('jsxdev/Debug.js');
include('Jsx/io/HttpService.js');
include('jsxdev/CodeFormatter.js');

define(function() {
    includeCss('jsxdev/res/css/style.css');
    var CodeFormatter = jsxdev.CodeFormatter;

    function initCommands(_this) {
        var command = jsxdev.Commands.get();
        var debug = _this.debug;

        command.setCommands([
            {
                name: 'code_format',
                bindKey: command.bindKey('Ctrl-Shift-A', 'Command-Shift-A'),
                exec: function(editor) {
                    //html,js

                    var value;
                    var session = editor.getSession();
                    var mode = session.getMode();

                    if (ace.mode.Xml && mode instanceof ace.mode.Xml ||
                    ace.mode.Html && mode instanceof ace.mode.Html) {
                        value = CodeFormatter.style_html(session + '', 4, ' ');
                    }
                    else if (ace.mode.JavaScript && mode instanceof ace.mode.JavaScript) {
                        value = CodeFormatter.js_beautify(session + '');
                    }

                    if (value) {
                        var selection = session.getSelection();
                        var pos = selection.getCursor();
                        session.getDocument().setValue(value);
                        selection.moveCursorToPosition(pos);
                        selection.clearSelection();
                    }
                }
            },
            {
                name: 'save',
                bindKey: command.bindKey('Ctrl-S', 'Command-S'),
                exec: function(editor) {
                    editor.session.context.save();
                },
                readOnly: true
            },
            {
                name: 'open_east',
                bindKey: command.bindKey('F1', 'F1'),
                exec: function() {
                    var east = _this.east;
                    if (east.collapsed)
                    east.expand(true);
                    else
                    east.collapse(true);
                },
                readOnly: true
            },
            {
                name: 'open_west',
                bindKey: command.bindKey('F2', 'F2'),
                exec: function() {
                    var west = _this.west;
                    if (west.collapsed)
                    west.expand(true);
                    else
                    west.collapse(true);
                },
                readOnly: true
            },
            {
                name: 'run',
                bindKey: command.bindKey('F5', 'F5'),
                exec: function() {
                    debug.run();
                },
                readOnly: true
            },
            {
                name: 'not_debug_run',
                bindKey: command.bindKey('Ctrl-F5', 'Command-F5'),
                exec: function() {
                    debug.start('false');
                },
                readOnly: true
            },
            {
                name: 'next',
                bindKey: command.bindKey('F6', 'F6'),
                exec: function() {
                    debug.next();
                },
                readOnly: true
            },
            {
                name: 'step',
                bindKey: command.bindKey('F7', 'F7'),
                exec: function() {
                    debug.step();
                },
                readOnly: true
            },
            {
                name: 'out',
                bindKey: command.bindKey('F8', 'F8'),
                exec: function() {
                    debug.out();
                },
                readOnly: true
            },
            {
                name: 'stop',
                bindKey: command.bindKey('Shift-F5', 'Shift-F5'),
                exec: function() {
                    debug.stop();
                },
                readOnly: true
            },
            {
                name: 'restart',
                bindKey: command.bindKey('Ctrl-Shift-F5', 'Ctrl-Shift-F5'),
                exec: function() {
                    debug.restart();
                },
                readOnly: true
            }
        ]);

        //stop context menu or prevent default
        var el = _this.el;

        el.on('contextmenu',
        function(event) {
            event.preventDefault();
        });

        el.on('keydown',
        function(event) {
            if (event.target.type != 'textarea') {
                event.preventDefault();
                //event.stopPropagation();
            }
        });
    }

    function init(_this) {

        var resources = _this.east.resources;
        var debug = _this.debug;

        resources.onopenfile.on(function(e) {
            _this.center.openFile(e.data);
        });

        resources.onbrowsefile.on(function(evt) {

            if (!debug.isStart) {
                return Ext.Msg.error('', 'Please start the service (F5 or Ctrl-F5)');
            }
            var href = 'http://{0}:{1}{2}'.format(
            location.hostname, debug.debugPorts[1], evt.data.replace(/^client/i, ''));
            global.open(href, 'open', 'fullscreen=no,status=yes,menubar=yes,scrollbars=yes,resizable=yes,toolbar=yes,location=yes');
        });

        initCommands(_this);
    }


    Class('jsxdev.Develop', Ext.Viewport, {

        //Ext config
        layout: 'border',

        /**
         * @event onexit
         */
        onexit: null,

        /**
         * top bar
         * @type {jsxdev.dev.Topbar}
         */
        topbar: null,

        /**
         * right tab panel
         * @type {jsxdev.dev.East}
         */
        east: null,

        /**
         * right tab panel
         * @type {jsxdev.dev.West}
         */
        west: null,

        /**
         * debug mode
         * @type {jsxdev.dev.Debug}
         */
        debug: null,

        /**
         * left tab panel
         * @type {jsxdev.dev.Center}
         */
        center: null,

        /**
         * current info
         * @type {Object}
         */
        info: null,

        /**
         * constructor function
         * @constructor
         */
        Develop: function() {
            Ext.Viewport.call(this);
            Jsx.Delegate.def(this, 'exit');
        },

        //overlay:
        initComponent: function() {

            try {
                this.info = Jsx.io.HttpService.get('jsxdev.service.IDE').call('info');
            } catch(err) {
                return location.href = '/login';
            }

            Ext.state.Manager.setProvider(new Ext.state.CookieProvider());

            this.center = new jsxdev.dev.Center();
            this.east = new jsxdev.dev.East();
            this.west = new jsxdev.dev.West();
            this.items = [this.east, this.center, this.west];

            //call ext base
            Ext.Viewport.prototype.initComponent.call(this);

            this.debug = new jsxdev.Debug(this);
            init(this);
        },

        /**
         * exit
         */
        exit: function() {
            this.onexit.emit();
        }

    });
    
    
    
    //*********************************
    
    var develop = new jsxdev.Develop();

    develop.onexit.on(function() { //exit

        global.close();
        location.href = '/start';
    });
    
    Jsx.on(global, 'beforeunload', function (evt){
        evt.returnValue = 'Do you want to quit anyway?';
    });

});