/**
 * @class jsxdev.FileMap
 * @extends Object
 * @createTime 2012-03-03
 * @updateTime 2012-03-03
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('node/crypto.js');
include('node/fsx.js');
include('Jsx/Delegate.js');

define(function() {
    var crypto = node.crypto;
    var fsx = node.fsx;
    var MAPS = {};
    var MAP_NAME = '_file.map';
    var MAP_MAX_COUNT = 1000;
    var DESTROY_TIME = 36e5;

    function destroy(path) {
        var map = MAPS[path].value;
        delete MAPS[path];
        map.ondestroy.emit();
        map.onchange.unon();
        map.ondestroy.unon();
    }

    var private$map =

    Class('private$map', null, {

        //private:
        _path: '',
        _maps: null,

        //public:
        /**
         * @event onchange
         */
        onchange: null,

        /**
         * @event ondestroy
         */
        ondestroy: null,

        /**
         * constructor
         * @param {String}  path root path
         * @constructor
         */
        private$map: function(path) {
            this._maps = {};
            this._path = path;
            Jsx.Delegate.def(this, 'change', 'destroy');
        },

        /**
         * get
         */
        get: function(filename) {},

        /**
         * set map
         * @param {String}   filename
         * @param {String}   text
         * @param {Function} cb
         */
        set: function(filename, text, cb) {
            //MAP_NAME
            var mat = filename.match(/^client\/(.+?)\/?$/);
            if (!mat) //is client
                return cb();

            var _this = this;
            var md5 = crypto.createHash('md5').update(text).digest('base64');
            var mapdir = this._path + 'client/';
            var name = mat[1];
            var mapname = mapdir + MAP_NAME;

            fsx.readFile(mapname, function(err, buff) {

                var items = (buff ? (buff + '').split(/\r?\n/) : []);

                for (var i = 0,
                l = items.length; i < l; i++) {

                    var item = items[i];
                    var ls = item.split(/\s+/);

                    if (ls.shift() == name) {
                        //JSX_DEBUG_EXCLUDE
                        items[i] = name + ' ' + md5 + (ls[1] ? ' ' + ls[1]: '');
                        break;
                    }
                }

                if (i === l) {
                    var index = name.indexOf('/');

                    if (l < MAP_MAX_COUNT || index === -1){
                        items.push(name + ' ' + md5);
                    }
                    else {

                        mapdir += name.substr(0, index + 1);
                        name = name.substr(index + 1);
                        mapname = mapdir + MAP_NAME;
                        return fsx.readFile(mapname, arguments.callee);
                    }
                }

                _this.onchange.emit();
                nextTick(fsx.writeFile, mapname, items.join('\r\n'), cb);
            });
        },

        /**
         * sets
         * @param {String}   dirname
         * @param {Function} 
         */
        sets: function(dirname, cb) {
            cb();
        },

        /**
         * @param {String}   filename
         * @param {Function} cb
         */
        remove: function(filename, cb) {
            //MAP_NAME
            var mat = filename.match(/^client\/(.+?)\/?$/);
            if (!mat) { //is client
                return cb();
            }

            var _this = this;
            var mapdir = this._path + 'client/';
            var name = mat[1];
            var mapname = mapdir + MAP_NAME;

            fsx.readFile(mapname, function(err, buff) {

                var items = (buff ? (buff + '').split(/\r?\n/) : []);
                var reg = new RegExp('^' + name + '(/|$)');
                var change = false;

                for (var i = items.length - 1; i > -1; i--) {
                    var key = items[i].split(/\s+/)[0] + '';

                    if (reg.test(key)) {
                        items.splice(i, 1);
                        change = true;
                    }
                }

                if (change) {
                    _this.onchange.emit();
                    return nextTick(fsx.writeFile, mapname, items.join('\r\n'), cb);
                }

                var index = name.indexOf('/');
                if (index == -1) {
                    return cb();
                }

                mapdir += name.substr(0, index + 1);
                name = name.substr(index + 1);
                mapname = mapdir + MAP_NAME;
                fsx.readFile(mapname, arguments.callee);
            });
        },

        /**
         * @param {String}   oldFilename
         * @param {String}   newFilename
         * @param {Function} cb
         */
        rename: function(oldFilename, newFilename, cb) {
            var _this = this;
            this.remove(oldFilename, this.sets.cb(this, cb, newFilename, cb));
            //TODO
            //?
        }

    });

    Class('jsxdev.FileMap', null, null, {

        MAP_NAME: MAP_NAME,

        /**
         * Get FileMap by path
         * @param  {String} path
         * @return {jsxdev.FileMap.private$map}
         */
        get: function(path) {
            var INSTANCE = MAPS[path];
            if (!INSTANCE) {
                MAPS[path] =
                INSTANCE = {
                    value: new private$map(path)
                };
            }

            clearTimeout(INSTANCE.timeout);
            INSTANCE.timeout = destroy.delay(DESTROY_TIME, path);
            return INSTANCE.value;
        }
    });
});