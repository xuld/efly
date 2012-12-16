/**
 * @class jsxdev.Upload
 * extends Object
 * @createTime 2012-06-25
 * @updateTime 2012-06-25
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('Jsx/Config.js');

define(function() {
    var UPLOAD;

    function remove(_this) {
        _this.onchange.unon();
        _this.oncomplete.unon();
        _this.onstart.unon();
        Ext.get(_this._iframe).remove();
    }

    function error(_this) {
        Ext.Msg.error('', 'Upload error,the file is too large or network outages')
        _this.onerror.emit();
        remove(_this);
    }

    var private_upload =

    Class('private_upload', null, {

        //private:
        _iframe: null,
        _form: null,
        _file: null,
        _submit: null,
        _isupload: false,

        //public:
        /**
         * @event onchange
         */
        onchange: null,

        /**
         * @event onstart
         */
        onstart: null,

        /**
         * @event onstart
         */
        onerror: null,

        /**
         * @event oncomplete
         */
        oncomplete: null,

        private_upload: function() {
            Jsx.Delegate.def(this, 'change', 'complete', 'start', 'error');

            var iframe = Ext.DomHelper.createDom(
                { tag: 'iframe', src: 'about:blank', style: 'display:none' });

            this._iframe = iframe;

            Ext.select('body').appendChild(iframe);

            var win = iframe.contentWindow;
            var doc = win.document;

            var html = [
                '<!DOCTYPE html>',
                '<html>',
                '<body>',
                '<form enctype="multipart/form-data" method="post">',
                    '<input type="file" name="file" multiple="" />',
                    '<input type="submit" value="submit" />',
                '</form>',
                '</body>',
                '</html>'
            ];

            doc.write(html.join(''));

            var _this = this;
            var input = doc.getElementsByTagName('input');
            this._form = doc.getElementsByTagName('form').item(0);
            this._file = input.item(0);
            this._submit = input.item(1);

            if (!Jsx.UA.GECKO)
                win.stop && win.stop() || doc.execCommand && (doc.execCommand('Stop'), doc.close());

            this._file.onchange = function() {
                UPLOAD = null;
                _this._submit.click();
                _this.onstart.emit();
            }

            iframe.onload = function(evt) {

                var err;
                try {
                    
                    var doc = iframe.contentWindow.document;
                    if (!doc || doc.body.innerHTML != 'ok')
                        err = true;
                } catch (e) {
                    err = true;
                }

                if (err)
                    return error(_this);

                _this.oncomplete.emit();
                remove(_this);
            }

            iframe.onerror = function(evt) {
                error(_this);
            }
        },

        setAction: function(url) {
            this._form.action = url;
        },

        setService: function(service, api, dir) {
            var path = Jsx.Config.get('webService') || Jsx.APP_DIR;
            path = Jsx.Path.set('method', service + '.' + api, path) +
                '&args=' + encodeURIComponent(JSON.stringify([dir]));
            this.setAction(path);
        },

        start: function() {
            this._file.click();
        }

    });

    Class('jsxdev.Upload', null, null, {

        /**
         * 获取upload 
         * @return {jsxdev.Upload}
         * @static
         */
        get: function() {

            if (!UPLOAD)
                UPLOAD = new private_upload();
            UPLOAD.onchange.unon();
            UPLOAD.oncomplete.unon();
            UPLOAD.onstart.unon();
            return UPLOAD;
        }
    });
});