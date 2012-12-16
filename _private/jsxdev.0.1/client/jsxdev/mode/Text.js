/**
 * @class jsxdev.mode.Text
 * @extends Ext.BoxComponent
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/io/HttpService.js');
include('jsxdev/dev/TextEditor.js');
include('jsxdev/dev/TextSession.js');
include('extjs/ext.js');
include('Jsx/Util.js');

define(function() {
    var TextEditor = jsxdev.dev.TextEditor;

    var service = Jsx.io.HttpService.get('jsxdev.service.IDE');
    var MAX_COLUMN = 90;
    var EDIROR_CONTAINER = 'EDIROR_CONTAINER';
    var GLOBAL_EDITOR;

    function resizeEditor(ownerCt) {
        var container = GLOBAL_EDITOR.container;
        container.style.width = ownerCt.getInnerWidth() - 2 + 'px';
        container.style.height = ownerCt.getInnerHeight() - 2 + 'px';
        GLOBAL_EDITOR.resize();
    }

    /*
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     * because the buffer-to-string conversion in `fs.readFileSync()`
     * translates it to FEFF, the UTF-16 BOM.
     */
    function stripBOM(content) {
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    }

    function getBaseFilename(filename) {
        return filename.match(/[^\/]+$/);
    }

    function activate(_this) {
        var editor = getEditor(_this);
        _this.el.appendChild(editor.container);
        editor.setSession(_this.session);
        editor.focus();
        resizeEditor(_this.ownerCt);
    }

    function getEditor(_this) {

        if (GLOBAL_EDITOR)
            return GLOBAL_EDITOR;

        var Dom = Ext.DomHelper;
        var div = Dom.append(
            Dom.append(
                Ext.getBody(),
                { id: EDIROR_CONTAINER, tag: 'div', style: 'display:none' }
            ),
            { tag: 'div' }
        );
        var ownerCt = _this.ownerCt;
        var renderer = new ace.VirtualRenderer(div);
        renderer.setPrintMarginColumn(MAX_COLUMN);
        
        GLOBAL_EDITOR = new TextEditor(renderer);
        ownerCt.on('resize', resizeEditor.bind(null, ownerCt));
        return GLOBAL_EDITOR;
    }

    function setTitle(_this, title) {
        var label = Ext.get(_this.ownerCt.getTabEl(_this.id)).select('span.x-tab-strip-text').item(0);
        label.update(title);
    }

    Class('jsxdev.mode.Text', Ext.BoxComponent, {

        _breakData: null,

        closable: true,

        /**
         * Whether to synchronize with the server files 
         * @type {Boolean}
         */
        sync: true,

        /**
         * @typr {jsxdev.dev.TextEditSession}
         */
        session: null,

        /**
         * constructor function
         * @constructor
         */
        Text: function(filename) {

            Ext.BoxComponent.call(this, {
                id: filename,
                tabTip: filename,
                title: getBaseFilename(filename)
            });

            var _this = this;

            TextEditor.getMode(filename, function(err, mode) {
                if (err)
                    return Ext.Msg.error('', err.message);

                var session =
                _this.session = new jsxdev.dev.TextSession(_this, '', mode);
                session.setUndoManager(new ace.UndoManager());
                activate(_this);

                _this.on('show', function() {
                    nextTick(activate, _this);
                });
                _this.on('beforedestroy', function() {
                    session.destroy();
                    if (_this.el.select('div').item(0))
                        Ext.get(EDIROR_CONTAINER).appendChild(GLOBAL_EDITOR.container);
                });

                //read file code
                service.call('readFileAsText', [filename], function(err, data) {

                    if (err)
                        return Ext.Msg.error('', err.message);

                    var code = data.code;
                    var breakpoints = data.breakpoints;
                    var folds = data.folds;

                    session.setValue(stripBOM(code));
                    session.setBreakpoints(breakpoints);
                    //TODO folds
                    //?

                    var data = _this._breakData;
                    if (data)
                        session.setBreak(data.row, data.startColumn, data.endColumn);

                    session.on('changeBreakpoint', function(e) {

                        service.call('setBreakpoints', [_this.id, e.row, e.action], function(err) {
                            if (err)
                                Ext.Msg.error('', err.message);
                        });
                    });

                    session.on('change', function() {
                        if (!_this.sync)
                            return;
                        setTitle(_this, getBaseFilename(filename) + '*');
                        _this.sync = false;
                    });
                });
            });
        },

        /**
         * debug break
         * @param {Object} thread
         */
        setBreak: function(data) {
            var session = this.session;
            if (session)
                return session.setBreak(data.row, data.startColumn, data.endColumn);
            this._breakData = data;
        },

        /***/
        clearBreak: function() {
            this._breakData = null;
            var session = this.session;
            if (session)
                session.clearBreak();
        },

        /**
         * save file
         * @param {Function} cb (Optional)
         */
        save: function(cb) {

            if (this.sync)
                return;

            var _this = this;
            var session = this.session;
            var code = session.getValue();
            var breakpoints = [];
            var folds = [];
            session.getBreakpoints().map(function(item, i) { breakpoints.push(i) });

            service.call('saveFileAsText', [this.id, code, breakpoints, folds], function(err) {
                if (err)
                    Ext.Msg.error('', err.message);
                else {
                    setTitle(_this, getBaseFilename(_this.id));
                    _this.sync = true;
                }

                cb && cb(err);
            });
        },

        /**
         * set theme 
         * @method setTheme
         * @param {String} name
         */
        setTheme: function(themename) {
            getEditor(_this).setTheme(themename);
        }

    });
});