/**
 * @class jsxpub.FileMap
 * @createTime 2012-05-18
 * @updateTime 2012-05-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('node/crypto.js');
include('node/fsx.js');

define(function() {
    var crypto = node.crypto;
    var fsx = node.fsx;
    var MAP_NAME = '_file.map';
    var MAP_MAX_COUNT = 1000;
    var JSX_DEBUG_EXCLUDE = 'JSX_DEBUG_EXCLUDE';

    function hash(data) {
        return crypto.createHash('md5').update(data);
    }

    function readMap(name) {
        var data = '';
        try {
            data += fsx.readFileSync(name);
        } catch (e) { }

        var items = data ? data.split(/\r?\n/) : [];
        var l = items.length;
        var result = { length: l, body: {}, name: name };
        var body = result.body;
        for (var i = 0; i < l; i++) {

            var ls = items[i].split(/\s+/);
            body[ls[0]] = { md5: ls[1], other: ls[2] };
        }
        return result;
    }

    function getMd5(filename) {
        var md5 = '';
        try {
            var data = fsx.readFileSync(filename);
            md5 = hash(data).digest('base64');
        }
        catch (e) { }
        return md5;
    }

    Class('jsxpub.FileMap', null, {
        //private:
        _path: '',
        _maps: null,
        _updateMap: false,

        //public:
        /**
         * 构造函数
         * @param {String} path
         * @param {String} updateMap (Optional) 传入该参数表示强制从文件读取map值并且更新值
         * @constructor
         */
        FileMap: function(path, updateMap) {
            this._path = path;
            this._maps = {};
            this._updateMap = !!updateMap;
        },

        /**
         * 获取文件map值,
         * @param {String} filename
         * @return {String}
         */
        get: function(filename) {
            var mapdir = this._path;
            var name = filename;
            
            //include('<thk/scene/MyPage.js>');
            //use('thk/scene/MyPage.js');
            

            while (true) {
                var mapname = mapdir + MAP_NAME;
                var map = this._maps[mapname];
                if (!map) {
                    map = { length: 0, body: {}, name: mapname };
                    this._maps[mapname] = map = (this._updateMap ? map : readMap(mapname) || map);
                }

                var body = map.body;
                var item = body[name];
                if (item)
                    return item.md5;

                var index = name.indexOf('/');
                if (map.length < MAP_MAX_COUNT || index === -1) {
                    var md5 = getMd5(this._path + filename);

                    body[name] = { md5: md5 };
                    map.length++;
                    return md5;
                }
                else {
                    mapdir += name.substr(0, index + 1);
                    name = name.substr(index + 1);
                }
            }
        },

        /**
         * 设置文件MAP值
         * @param {String} filename
         * @param {String} value
         */
        set: function(filename, md5) {
            if (md5 == this.get(filename))
                return;
            var mapdir = this._path;
            var name = filename;

            while (true) {
                var mapname = mapdir + MAP_NAME;
                var map = this._maps[mapname];

                var body = map.body;
                var item = body[name];
                if (item) {
                    item.md5 = md5;
                    return;
                }

                var index = name.indexOf('/');
                if (index != -1) {
                    mapdir += name.substr(0, index + 1);
                    name = name.substr(index + 1);
                }
            }
        },

        /**
         * 提交MAP文件至文件系统
         * @param {Function} cb 执行完成回调
         */
        commit: function(cb) {

            var maps = this._maps;
            var items = [];

            function handler() {
                if (!items.length)
                    return cb();

                var item = items.shift();
                var name = item.name;
                var body = item.body;
                var result = [];
                for (var i in body) {
                    var e = body[i];
                    result.push(i + ' ' + e.md5 + (e.other ? ' ' + e.other : ''));
                }
                fsx.writeFile(name, result.join('\n'), handler.cb(cb));
            }

            for (var name in maps)
                items.push(maps[name]);
            handler();
        }
    });

});