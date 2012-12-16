/**
 * @class jsxdev.dev.West
 * extends Ext.TabPanel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('jsxdev/dev/Console.js');
include('jsxdev/dev/Watch.js');
//include('jsxdev/dev/CallStack.js');

define(function() {

    function initTool(_this) {

        var items = [
            '-',
            {
                iconCls: 'icon-start',
                tooltip: 'Start run not debug Ctrl+F5'
            },
            {
                iconCls: 'icon-start-debug',
                tooltip: 'Run F5'
            },
            {
                iconCls: 'icon-stop-debug',
                tooltip: 'Stop Shift+F5'
                , disabled: true
            },
            {
                iconCls: 'icon-restart-debug',
                tooltip: 'Restart Ctrl+Shift+F5'
                , disabled: true
            },
            '-',
            {
                iconCls: 'icon-by-function',
                tooltip: 'Next F6'
                , disabled: true
            },
            {
                iconCls: 'icon-by-statement',
                tooltip: 'Step F7'
                , disabled: true
            },
            {
                iconCls: 'icon-out-of',
                tooltip: 'Out F8'
                , disabled: true
            },
            '-',
            {
                xtype: 'combo',
                title: 'Select Thread',
                emptyText: 'Select Thread',
                typeAhead: true,
                triggerAction: 'all',
                mode: 'local',
                store: {
                    xtype: 'arraystore',
                    fields: ['text', 'value'],
                    data: []//['Server: ' + Jsx.guid(), '100001'], ['Client : ' + Jsx.guid(), '100002']
                },
                valueField: 'value',
                displayField: 'text',
                selectOnFocus: true,
                width: 200
                , disabled: true
            }
        ];

        _this.tbar = new Ext.Toolbar({
            items: items,
            style: 'border-style:solid;border-width:1px;border-bottom-width:0;'
        });
    }

    Class('jsxdev.dev.West', Ext.TabPanel, {

        id: 'ide_west',
        //region: 'west',
        region: 'south',
        split: true,
        minSize: 0,
        width: 450,
        maxSize: 1500,
        activeTab: 0,
        bodyBorder: false,
        tabPosition: 'bottom', //'bottom',
        //collapsible: true,
        //animCollapse: false,

        console: null,
        Watch: null,

        /**
         * constructor function
         * @constructor
         */
        West: function(cnf) {
            Ext.TabPanel.call(this, { collapseMode: 'mini' });

        },

        //overlay:
        initComponent: function() {
            initTool(this);
            Ext.TabPanel.prototype.initComponent.call(this);

            var console = this.console = new jsxdev.dev.Console();
            var watch = this.Watch = new jsxdev.dev.Watch();

            this.add(console);
            this.add(watch);
            
            var _this = this;
            this.on('render', function() {
                var el = _this.getEl();
                var dom = Ext.DomHelper.createDom({ tag: 'div', style: 'background-color:#fff;width:100%;height:1px;position:absolute;left:0;bottom:0' });
                Ext.get(dom).on('click', function() {
                    if (_this.collapsed)
                        _this.expand(true);
                    else
                        _this.collapse(true);
                });
                el.appendChild(dom);
            });
        }

    });
});