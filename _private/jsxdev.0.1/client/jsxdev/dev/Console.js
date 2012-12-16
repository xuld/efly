/**
 * @class jsxdev.dev.Console
 * extends Ext.Panel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('extjs/ext.js');
include('Jsx/Util.js');
include('Jsx/Delegate.js');

define(function() {
    var LOCAL_STORAGE = localStorage
    var COMMAND_KEY = 'CONSOLE_COMMANDS';
    var MAX_COUNT = 100;

    function log(msg, err) {
        msg = msg.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&#160;';

        var out = this.items.items[0].el;
        var html = err ? '<span style="color:#f00">' + msg + '</span>' : msg;
        var obj = { tag: 'div', html: html, style: 'white-space: pre;' };

        if (this.count === MAX_COUNT) {
            out.first().remove();
            this.count--;
        }

        this.count++;
        out.appendChild(Ext.DomHelper.createDom(obj));

        var div = this.el.first().first();
        var value = div.dom.scrollHeight - 175 - div.dom.clientHeight;

        if (div.dom.scrollTop < value)
            div.scrollTo('top', value);
    }

    function error(err) {
        log.call(this, err, true);
    }

    Class('jsxdev.dev.Console', Ext.Panel, {

        title: 'Console',
        iconCls: 'icon-console',
        closable: false,
        autoScroll: true,
        //cursor:text;
        //font-family:Monaco,Menlo,'Ubuntu Mono','Droid Sans Mono','Courier New',monospace;
        style: "font-size:12px;",
        onstdin: null,
        commands: null,
        count: 0,

        /**
        * constructor function
        * @constructor
        */
        Console: function() {
            Ext.Panel.call(this);
            Jsx.Delegate.def(this, 'stdin');
            var data = LOCAL_STORAGE.getItem(COMMAND_KEY);
            this.commands = data ? JSON.parse(data) : [];
        },

        initComponent: function() {

            var out = new Ext.Container({ html: '', style: 'line-height:16px;' });
            var bottom = new Ext.BoxComponent({ tag: 'div',
                html: [
                    '<div style="line-height:16px;width:12px;float:left;">&gt;</div>',
                    '<div style="margin-left:{0}px;overflow:hidden">'
                        .format(Jsx.UA.TRIDENT ? '13' : '12'),
                        '<textarea ',
                        'style="background:#fff;color:#000;margin-top:{0}px;height:200px;width:100%;overflow-y:hidden;overflow-x:auto;box-sizing:border-box;border:0;'
                            .format(Jsx.UA.TRIDENT ? '-1' : '-2'),
                        //font-family:Monaco,Menlo,'Ubuntu Mono','Droid Sans Mono','Courier New',monospace;\"
                        "font-size:12px;line-height:16px;",
                        'dir="ltr" ',
                        'wrap="SOFT" ',
                        'spellcheck="false" ',
                        'autocapitalize="off" ',
                        'autocomplete="off" ',
                        'autocomplete="off" ',
                        'rows="3">',
                        '</textarea>',
                    '</div>'
                ].join('')
            });

            this.items = [out, bottom];
            Ext.Panel.prototype.initComponent.call(this);

            var _this = this;
            nextTick(function() {


                _this.body.applyStyles({ background: '#fff', /*cursor: 'text',*/ color: '#000' });

                var div = bottom.el.select('div').item(0);
                var text = bottom.el.select('textarea').item(0);

                text.on('keydown', function(e) {
                    var dom = text.dom;
                    var value = dom.value;
                    var commands = _this.commands;
                    var len = commands.length;

                    switch (e.keyCode) {
                        case 13:
                            if (e.shiftKey)
                                break;
                            _this.log('> ' + value);
                            dom.value = '';

                            var index = commands.indexOf(value);
                            if (index !== -1)
                                commands.splice(index, 1);
                            else
                                commands.splice(0, len - 10);
                            if (value)
                                commands.push(value);

                            LOCAL_STORAGE.setItem(COMMAND_KEY, JSON.stringify(commands));
                            e.preventDefault();
                            if (value.trim())
                                _this.onstdin.emit(value);
                            return;
                        case 38:
                            var index = commands.indexOf(value);
                            index = (index === -1 || index === 0 ? len - 1 : index - 1);
                            dom.value = commands[index] || dom.value;
                            e.preventDefault();

                            break;
                        case 40:
                            var index = commands.indexOf(value);
                            index = (index === -1 || index === len - 1 ? 0 : index + 1);
                            dom.value = commands[index] || dom.value;
                            e.preventDefault();

                            break;
                    }

                    var count = 0;
                    value.replace(/\r?\n/g, function() { count++ });
                    text.setHeight(count * 16 + 200);
                });
                _this.el.on('click', text.dom.focus, text.dom);
            });
        },

        log: function() {
            Array.toArray(arguments).forEach(log, this);
        },

        error: function() {
            Array.toArray(arguments).forEach(error, this);
        },

        clear: function() {
            this.items.items[0].el.dom = '';
            this.count = 0;
        }

    });
});