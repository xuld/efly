include('node/fsx.js');
include('Jsx/Delegate.js');
include('Jsx/Util.js');

define(function() {
    var fsx = node.fsx;
    var SETTINGS = {};
    var SAVE_TIMEOUT = 6e4;
    var DESTROY_TIME = 36e5;
    var SETTINGS_FILE_NAME = 'dev_app.conf';

    /**
     * @class jsxdev.Settings.private$settings
     * @extends Object
     * @createTime 2012-03-03
     * @updateTime 2012-03-03
     * @author www.mooogame.com, simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     */

    function _save(_this) {
        if (SETTINGS[_this.path])
            fsx.writeFile(_this._path, JSON.stringify(_this._values));
    }

    function save(_this) {
        clearTimeout(_this._timeout);
        _this._timeout = _save.delay(SAVE_TIMEOUT, _this);
    }

    function destroy(path) {
        var setting = SETTINGS[path].value;
        delete SETTINGS[path];
        setting.ondestroy.emit();
        setting.ondestroy.unon();
        setting.onchangebreakpoints.unon();
    }

    function encodeName(filename) {
        return filename.replace(/\./g, '&lg');
    }

    function decodeName(filename) {
        return filename.replace(/&lg/g, '.');
    }

    function getFileKey(filename) {
        return 'files.' + encodeName(filename).replace(/\//g, '.');
    }

    function forEach(values, name, cb) {

        if (Array.isArray(values.breakpoints))
            return cb(name, values);
        for (var i in values)
            forEach(values[i], name + '/' + decodeName(i), cb);
    }

    function setBreakpoints(_this, filename, row, action) {

        if (action == 'set' || action == 'clear') {

            var key = getFileKey(filename) + '.breakpoints';
            var breakpoints = _this.get(key) || [];
            var type = /^client\//i.test(filename) ? 'client' : 'server';

            if (action == 'set') {

                if (breakpoints.indexOf(row) === -1){
                    breakpoints.push(row);
                }
            }
            else if (action == 'clear'){
                breakpoints.removeVal(row);
            }

            _this.set(key, breakpoints);
            
            if(breakpoints.length){
                _this.set(key, breakpoints);
            }
            else{ //没有属性,清空之
                var value = _this.getFileProperty(filename);
                if(!value.folds || !value.folds.length){
                    _this.removeFileProperty(filename);
                }
            }
            
            var type = filename.match(/^[^\/]+/)[0];

            _this.onchangebreakpoints.emit(
                { 
                    name: filename, 
                    row: row, 
                    action: action, 
                    type: /^(server|client)$/.test(type) ? type : 'other'
                }
            );
        }
    }

    var private$settings =

    Class('private$settings', null, {

        //private:
        _timeout: 0,
        _path: '',
        _values: null,

        //public:
        /**
         * @event onchangebreakpoints
         */
        onchangebreakpoints: null,

        /**
         * @event ondestroy
         */
        ondestroy: null,

        /**
         * constructor
         * @param {String}  path
         * @constructor
         */
        private$settings: function(path) {
            this._path = path + SETTINGS_FILE_NAME;
            this._values = {};
            Jsx.Delegate.def(this, 'changebreakpoints', 'destroy');

            try {
                var data = fsx.readFileSync(this._path);
                this._values = eval('(' + data + ')');
            }
            catch (err) { }
        },

        /**
         * Get setting by name
         * @param  {String}   name
         * @return {Object}
         */
        get: function(name) {
            return Jsx.get(name, this._values);
        },

        /**
         * Get all setting by name
         * @return {Object}
         */
        getAll: function() {
            return this._values;
        },

        /**
         * Set setting by name
         * @param {String}   name
         * @param {Object}   value
         * @return {Object}
         */
        set: function(name, value) {
            Jsx.set(name, value, this._values);
            save(this);
        },

        /**
         * @param {String}
         */
        remove: function(name) {
            Jsx.remove(name, this._values);
            save(this);
        },

        /**
         * Set all setting by name
         * @param {Object}   values
         * @return {Object}
         */
        setAll: function(values) {
            this._values = values;
            save(this);
        },

        /*
         * @param {Object}   filename
         * @return {Object}
         */
        getFileProperty: function(filename) {
            return this.get(getFileKey(filename)) || { breakpoints: [], folds: [] };
        },

        /*
         * @param {Object}   filename
         * @param {Object}   value
         */
        setFileProperty: function(filename, value) {
            var key = getFileKey(filename);

            if(
                (!value.breakpoints || !value.breakpoints.length) && 
                (!value.folds || !value.folds.length)
            ) {
                this.remove(key);
            }
            else
                this.set(key, value);
        },

        /*
         * @param {Object}   filename
         */
        removeFileProperty: function(filename) {
            this.remove(getFileKey(filename));
        },

        /*
         * @param {Object}   oldFilename
         * @param {Object}   newFilename
         */
        renameFileProperty: function(oldFilename, newFilename) {
            var value = this.get(getFileKey(oldFilename));
            if (value) {
                this.removeFileProperty(oldFilename);
                this.setFileProperty(newFilename, value);
            }
        },

        /**
         * @param {String}   filename
         * @param {Number}   row
         */
        setBreakpoints: function(filename, row) {
            setBreakpoints(this, filename, row, 'set');
        },

        /**
         * @param {String}   filename
         * @param {Number}   row
         */
        clearBreakpoints: function(filename, row) {
            setBreakpoints(this, filename, row, 'clear');
        },

        /**
         * clear all breakpoint
         */
        clearAllBreakpoints: function() {
            forEach(this.get('files'), '', function(name, value) {
                value.breakpoints = [];
            });
            this.onchangebreakpoints.emit({ action: 'clearAll' });
        },

        /**
         * @param  {String}   filename
         * @return {Object}
         */
        getBreakpoints: function(filename) {
            var key = getFileKey(filename) + '.breakpoints';
            return this.get(key) || [];
        },

        /**
         * @return {Object}
         */
        getAllBreakpoints: function() {

            var client = [];
            var server = [];
            var reg = /^\/(((client)|(server)).+)/i;

            forEach(this.get('files') || {}, '', function(name, value) {
                var mat = name.match(reg);
                if (mat){
                    (mat[3] ? client : server).push(
                        { 
                            name: mat[1], 
                            breakpoints: value.breakpoints.concat() 
                        }
                    );
                }
            });

            var result = { client: client, server: server };
            return result;
        }
    });


    /**
     * @class jsxdev.Settings
     * @extends Object
     * @createTime 2012-03-03
     * @updateTime 2012-03-03
     * @author www.mooogame.com, simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     * @singleton 
     */

    Class('jsxdev.Settings', null, null, {

        SETTINGS_FILE_NAME: SETTINGS_FILE_NAME,

        /**
         * Get settings by path
         * @param  {String} path
         * @return {jsxdev.Settings.private$settings}
         */
        get: function(path) {
            var INSTANCE = SETTINGS[path];
            if (!INSTANCE) {
                SETTINGS[path] =
                    INSTANCE = { value: new private$settings(path) };
            }

            clearTimeout(INSTANCE.timeout);
            INSTANCE.timeout = destroy.delay(DESTROY_TIME, path);

            return INSTANCE.value;
        }
    });

});