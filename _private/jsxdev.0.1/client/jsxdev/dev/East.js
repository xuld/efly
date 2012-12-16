/**
 * @class jsxdev.dev.East
 * extends Ext.TabPanel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('jsxdev/dev/Resources.js');
//include('jsxdev/dev/Property.js');
//include('jsxdev/dev/Publish.js');
//include('jsxdev/dev/Object.js');

define(function() {

    Class('jsxdev.dev.East', Ext.TabPanel, {

        id: 'ide_east',
        region: 'east',
        split: true,
        minSize: 0,
        width: 260,
        maxSize: 1500,
        activeTab: 0,
        tabPosition: 'bottom', //'bottom',
        //collapsible: true,
        //animCollapse: false,

        /**
         * @type {jsxdev.dev.Resources}
         */
        resources: null,

        /**
         * constructor function
         * @constructor
         */
        East: function(cnf) {
            Ext.TabPanel.call(this, { collapseMode: 'mini' });
        },

        //overlay:
        initComponent: function() {

            this.resources = new jsxdev.dev.Resources();
            this.items = [this.resources];

            Ext.TabPanel.prototype.initComponent.call(this);

            var _this = this;
            this.on('render', function() {
                var el = _this.getEl();
                var dom = Ext.DomHelper.createDom({ tag: 'div', style: 'background-color:#fff;width:1px;height:100%;position:absolute;right:0;top:0' });
                Ext.get(dom).on('click', function() {
                    if (_this.collapsed)
                        _this.expand(true);
                    else
                        _this.collapse(true);
                });
                el.appendChild(dom);
            });
        }
        
        //,

        /**
         * Open the specified name ui
         * @param {String} name    panel name
         */
        //openMode: function(name) {

        //},

        /**
         * Close the specified name ui
         * @param {String} name    ui name
         */
        //closeMode: function(name) {

        //}

    });
});