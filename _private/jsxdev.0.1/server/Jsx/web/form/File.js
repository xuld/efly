/**
 * @class Jsx.web.form.File
 * @extends Jsx.Event
 * @createTime 2012-01-12
 * @updateTime 2012-01-12
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('node/fsx.js');

define(function() {
    var WriteStream = node.fsx.WriteStream;

    Class('Jsx.web.form.File', Jsx.Event, {

        _writeStream: null,

        path: '',
        name: '',
        type: null,
        size: 0,
        lastModifiedDate: null,

        // @todo Next release: Show error messages when accessing these
        get length() {
            return this.size;
        },
        
        get filename() {
            return this.name;
        },
        
        get mime() {
            return this.type;
        },
        
        /**
         * @event onprogress
         */
        onprogress: null,
        
        /**
         * @event onend
         */
        onend: null,

        /**
         * constructor function
         * @param {Object} properties
         * @constructor
         */
        File: function(properties) {
            Jsx.Delegate.def(this, 'progress', 'end');
            Jsx.extend(this, properties);
        },
        
        open: function() {
            this._writeStream = new WriteStream(this.path);
        },

        write: function(buffer, cb) {
            var _this = this;

            if (!_this._writeStream) 
                _this.open();

            _this._writeStream.write(buffer, function() {
                _this.lastModifiedDate = new Date();
                _this.size += buffer.length;
                _this.onprogress.emit(_this.size);
                cb();
            });
        },

        end: function(cb) {
            var _this = this;

            if (_this._writeStream) {
                _this._writeStream.end(function() {
                    _this.onend.emit();
                    cb();
                });
            }
            else {
                _this.path = '';
                _this.onend.emit();
                cb();
            }
        }

    });
});
