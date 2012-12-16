/**
 * @class jsxdev.Login
 * @extends Object
 * @createTime 2012-01-28
 * @updateTime 2012-01-28
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/io/HttpService.js');
include('extjs/ext.js');

define(function() {

    includeCss('jsxdev/res/css/style.css');

    var user = Jsx.io.HttpService.get('jsxdev.service.User');

    /*
    {
    xtype: 'displayfield',
    name: 'displayfield1',
    fieldLabel: 'Code',
    value: '<input style="width: 50px;" class="x-form-field x-form-text" id="code" /> \
            <a href="javascript:"><img border="0" /></a>'
    }
    */

    function handler(_this) {
        var form = _this.form.getForm();
        var load = _this.load;

        if (!form.isValid())
            return;

        load.show();

        var values = form.getValues();
        user.call('login', [values.username, values.password, ''], function(err, data) {
            load.hide();
            if (err)
                return Ext.Msg.error(' ', err.message);
            location.href = Jsx.Path.get('uri') || '/start';
        });
    }

    // init
    function init(_this) {

        user.call('getCurrentUser', null, function(err, data) {

            if (data)
                return location.href = Jsx.Path.get('uri') || '/start';

            Ext.QuickTips.init();

            new Ext.Toolbar({
                renderTo: Ext.getBody(),
                height: 26,
                items: ['<b>JsxDEV</b>', '->',
                    {
                        text: 'Register',
                        handler: function() {
                            location.href = '/register';
                        }
                    }
                ]
            });

            var panel = _this.form = new Ext.form.FormPanel({
                renderTo: Ext.getBody(),
                style: 'margin: 200px auto',
                title: 'Login',
                labelWidth: 75, // label settings here cascade unless overridden
                frame: true,
                bodyStyle: 'padding:5px 5px 0',
                width: 300,
                defaults: { anchor: '95%', msgTarget: 'side' },
                defaultType: 'textfield',

                items: [
                    {
                        fieldLabel: 'Username',
                        name: 'username',
                        allowBlank: false
                        ,
                        //listeners: {
                        //    click: function(){
                        //        alert('dsdsd')
                        //    }
                        //}
                        
                        //listeners: {
                        //    keyup: function() {
                        //        alert('dsads');
                        //    }
                        //}

                    }, {
                        fieldLabel: 'Password',
                        name: 'password',
                        inputType: 'password',
                        allowBlank: false
                    }
                ],

                buttons: [{ text: 'Login', handler: handler.bind(null, _this)}]
            });

            
            panel.items.items.forEach(function(item){
                item.el.on('keydown', function(evt){
                    if(evt.keyCode == 13){
                        handler(_this);
                    }
                });
            });

            _this.load = new Ext.LoadMask(panel.el);
        });
    }
    
    
    Class('jsxdev.Login', null, {

        /**
         * form panel
         * @type {Ext.form.FormPanel}
         */
        form: null,

        /**
         * form panel
         * @type {Ext.LoadMask}
         */
        load: null,

        /**
         * constructor function
         * @constructor
         */
        Login: function() {
            init(this);
            Ext.get('loading_box').hide();
        }

    });

    new jsxdev.Login();
});