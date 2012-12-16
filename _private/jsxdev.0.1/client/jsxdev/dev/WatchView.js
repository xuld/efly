/**
 * @class jsxdev.dev.WatchView
 * extends Ext.Window
 * @createTime 2012-03-31
 * @updateTime 2012-03-31
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('extjs/ext.js');

define(function() {

    Class('jsxdev.dev.WatchView', Ext.Window, {

        modal: true,
        maximizable: true,
        width: 650,
        height: 400,

        /**
         * constructor function
         * @param {String} title
         * @param {String} value
         * @constructor
         */
        WatchView: function(title, value) {
            Ext.Window.call(this, { title: title, value: value });
        },

        initComponent: function() {
            Ext.Window.prototype.initComponent.apply(this, arguments);

            var _this = this;
            var text = new Ext.BoxComponent({
                autoEl: {
                    tag: 'textarea',
                    html: this.value
                }
            });

            this.add(text);
            this.on('resize', function(e, w, h) {
                text.setSize(_this.getInnerWidth(), _this.getInnerHeight());
            });
        }

    });
});