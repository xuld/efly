/**
 * @class Jsx.web.StaticService static file service
 * @extends Jsx.web.service.Service
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/web/service/Service.js');
include('node/fsx.js');
include('node/http.js');
include('node/zlib.js');
include('node/crypto.js');
include('node/buffer.js');

define(function() {
    var fsx = node.fsx;
    var http = node.http;
    var zlib = node.zlib;
    var crypto = node.crypto;
    var CACHE = {};

    //set util
    function setHeader(_this) {
        var res = _this.response;
        res.setHeader('Server', 'MoooGame Jsx');
        res.setHeader('Date', new Date().toUTCString());
        var expires = _this.server.expires;
        if(expires){
            res.setHeader('Expires', new Date().add(1440 * expires).toUTCString());
            res.setHeader('Cache-Control', 'public, max-age=' + (expires * 86400));
        }
    }

    // 文件是否可支持gzip压缩
    function isGzip(_this, filename) {

        var ae = _this.request.headers['accept-encoding'];
        var type = _this.server.getMIME(filename);

        return !!(ae && ae.match(/gzip/i) && type.match(_this.server.gzip));
    }
    
    //返回目录
    function _returnDirectory(_this, filename) {
        if(_this.server.dirRead)
            _this.returnDirectory(filename);
        else 
            _this.returnStatus(403);
    }

    //返回目录
    function returnDirectory(_this, filename) {

        //读取目录
        if (!filename.match(/\/$/))  //目录不正确,重定向
            return _this.redirect(_this.cleanurl + '/');

        var def = _this.server.defaults;
        if (!def.length)  //默认页
            return _returnDirectory(_this, filename);

        fsx.readdir(filename, function(err, files) {

            for (var i = 0, name; (name = def[i]); i++) {
                if (files.indexOf(name) != -1)
                    return _this.returnFile(filename.replace(/\/?$/, '/') + name);
            }
            _returnDirectory(_this, filename);
        });
    }

    //返回缓存
    function returnCache(_this, filename) {

        var cache = CACHE[filename];
        if (cache && cache.data) {

            var req = _this.request;
            var res = _this.response;
            var gzip = isGzip(_this, filename);
            var type = _this.server.getMIME(filename);
            var ims = req.headers['if-modified-since'];
            var mtime = cache.time;

            setHeader(_this);

            res.setHeader('Last-Modified', mtime.toUTCString());
            res.setHeader('Content-Type', type);
            gzip &&
                res.setHeader('Content-Encoding', 'gzip');

            if (ims && new Date(ims) - mtime === 0) { //使用 304 缓存
                res.writeHead(304);
                res.end();
            }
            else {

                res.writeHead(200);
                res.end(cache.data);
            }
            return true;
        }
        return false;
    }

    //返回数据
    function resultData(_this, filename, type, time, err, data) {

        if (err) {
            delete CACHE[filename];
            return _this.returnStatus(404);
        }

        var res = _this.response;
        var cache = { data: data, time: time };
        if (_this.server.fileCacheTime) {

            CACHE[filename] = cache;
            setTimeout(function() { delete cache.data; }, _this.server.fileCacheTime * 1e3);
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
    }

    //返回异常状态
    function resultError(_this, statusCode, text) {
        var res = _this.response;
        var type = _this.server.getMIME('html');

        setHeader(_this);

        res.writeHead(statusCode, { 'Content-Type': type });
        res.end('<!DOCTYPE html><html><body><h3>' + statusCode + ': ' + (http.STATUS_CODES[statusCode] || '') + '</h3><br/></h5>' + (text || '') + '</h5></body></html>');
    }

    Class('Jsx.web.service.StaticService', Jsx.web.service.Service, {

        //public:
        /**
         * response of server
         * @type {http.ServerRequest}
         */
        response: null,

        /**
         * init service
         * @param {http.ServerRequest} req
         * @param {http.ServerResponse} res
         */
        init: function(req, res) {
            this.initBase(req);
            this.response = res;
        },

        action: function() {

            var method = this.request.method;
            if (method == 'GET' || method == 'HEAD') {

                var filename = this.cleanurl;
                if (this.server.virtual) { //是否有虚拟目录
                    var mat = filename.match(new RegExp('^' + this.server.virtual, 'i'));

                    if (mat)
                        filename = filename.replace(mat[0], '');
                    else
                        return this.returnStatus(404);
                }

                if (this.server.disable.test(filename))  //禁止访问的路径
                    return this.returnStatus(403);

                this.returnFile(this.server.root + filename);
            }
            else
                this.returnStatus(405);
        },

        /**
         * redirect
         * @param {String} path
         */
        redirect: function(path) {
            var res = this.response;
            res.setHeader('Location', path);
            res.writeHead(302);
            res.end();
        },

        /**
         * return the state to the browser
         * @param {Number} statusCode
         * @param {String} text (Optional)  not default status ,return text
         */
        returnStatus: function(statusCode, text) {

            var _this = this;
            var filename = this.server.errorStatus[statusCode];

            if (filename) {
                filename = _this.server.root + filename;
                fsx.stat(filename, function(err) {

                    if (err)
                        resultError(_this, statusCode, text);
                    else
                        _this.returnFile(filename);
                });
            }
            else
                resultError(_this, statusCode, text);
        },

        /**
         * return file to browser
         * @param {String}       filename
         */
        returnFile: function(filename) {

            var _this = this;
            var req = this.request;
            var res = this.response;
            var DEBUG = Jsx.DEBUG;

            if (!DEBUG && returnCache(_this, filename))  //high speed Cache
                return;

            fsx.stat(filename, function(err, stat) {
                if (err)
                    return _this.returnStatus(404);

                if (stat.isDirectory())  //dir
                    return returnDirectory(_this, filename);

                if (!stat.isFile())
                    return _this.returnStatus(404);

                //for file
                if (stat.size > _this.server.maxFileSize) //File size exceeds the limit
                    return _this.returnStatus(403);

                var mtime = stat.mtime;
                var ims = req.headers['if-modified-since'];
                var type = _this.server.getMIME(filename);
                var gzip = isGzip(_this, filename);

                setHeader(_this);

                res.setHeader('Last-Modified', mtime.toUTCString());
                gzip &&
                    res.setHeader('Content-Encoding', 'gzip');

                if (ims && new Date(ims) - mtime === 0) { //use 304 cache

                    res.writeHead(304, { 'Content-Type': type });
                    res.end();
                    return;
                }

                if (DEBUG && Jsx._Debug.debugJs(_this, req.url, filename, mtime, gzip)){
                    return;
                }

                if (!gzip) //use gzip format
                    return fsx.readFile(filename, resultData.bind(null, _this, filename, type, mtime));

                var md5 = crypto.createHash('md5').update(filename).digest('hex');
                var c_filename = _this.server.temp + md5;
                var is_update = false;
                var cache = CACHE[filename];

                if (cache)
                    is_update = cache.time < mtime;
                else {
                    try {
                        var stat = fsx.statSync(c_filename);
                        is_update = stat.mtime < mtime;

                    } catch (e) {
                        is_update = true;
                    }
                }

                if (!is_update)  //not update gzip cache
                    return fsx.readFile(c_filename, resultData.bind(null, _this, filename, type, mtime));

                fsx.readFile(filename, function(err, data) {

                    zlib.gzip(data, function(err, data) {        //gzip
                        fsx.writeFile(c_filename, data, Jsx.noop); //save gzip
                        resultData(_this, filename, type, mtime, err, data);
                    });
                });
            });
        },

        /**
         * return dir
         * @param {String}       filename
         */
        returnDirectory: function(filename) {

            var _this = this;
            var res = this.response;
            var req = this.request;

            //读取目录
            if (!filename.match(/\/$/))  //目录不正确,重定向
                return _this.redirect(_this.cleanurl + '/');

            fsx.ls(filename, function(err, files) {
                if (err)
                    return _this.returnStatus(404);

                var dir = filename.replace(_this.server.root + '/', '');
                var html =
                    '<!DOCTYPE html><html><head><title>Index of /{0}</title>'.format(dir) +
                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
                    '<style type="text/css">*{font-family:Courier New}div,span{line-height:20px;height:20px;}span{display:block;float:right;width:220px}</style>' +
                    '</head><body bgcolor="white">' +
                    '<h1>Index of /{0}</h1><hr/><pre><div><a href="{1}">../</a></div>'.format(dir, dir ? '../' : 'javascript:')

                var ls1 = [];
                var ls2 = [];

                for (var i = 0, stat; (stat = files[i]); i++) {
                    var name = stat.name;
                    if (name.slice(0, 1) == '.')
                        continue;

                    var link = name;
                    var size = (stat.size / 1024).toFixed(2) + ' KB';
                    var isdir = stat.dir;

                    if (isdir) {
                        link += '/';
                        size = '-';
                    }

                    var s =
                        '<div><a href="{0}">{0}</a><span>{2}</span><span>{1}</span></div>'
                                .format(link, stat.ctime.toString('yyyy-MM-dd hh:mm:ss'), size);
                    isdir ? ls1.push(s) : ls2.push(s);
                }

                html += ls1.join('') + ls2.join('') + '</pre><hr/></body></html>';
                setHeader(_this);

                var type = _this.server.getMIME('html');
                res.writeHead(200, { 'Content-Type': type });
                res.end(html);
            });
        }

    });
});