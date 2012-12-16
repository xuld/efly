/*
 * @class Jsx._Debug 系统调试
 * @createTime 2011-11-02
 * @updateTime 2011-11-02
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('node/crypto.js');
include('node/fsx.js');
include('node/zlib.js');
include('node/buffer.js');

define(function(global) {
    var crypto = node.crypto;
    var fsx = node.fsx;

    var DEBUG = Jsx.DEBUG;
    var ENV = process.env;
    var JSX_DEBUG_CLIENT_VERSION_NAME = 'VERSION';
    var JSX_DEBUG_CLIENT = 'JSX_DEBUG';
    var JSX_DEBUG_CLIENT_SERVICE = encodeURIComponent(ENV.JSX_DEBUG_CLIENT_SERVICE || '');
    
    var GLOBAL_AUTH_ID_NAME = 'JSX_SERVER_GLOBAL_AUTH_ID';
    var GLOBAL_AUTH_ID = parseInt(ENV.WEB_SERVER_GLOBAL_AUTH_ID) || 0;
    var GLOBAL_AUTH_URL = ENV.WEB_SERVER_GLOBAL_AUTH_URL;

    if (!DEBUG && !GLOBAL_AUTH_ID) {
        throw 'Can not include "Jsx/_Debug.js" file';
    }
    
    var debugCodeVersion = new Date().valueOf();

    var setDebugClient = JSX_DEBUG_CLIENT_SERVICE ? function (req, res) {

        var setcookie = [];
        var cookie = req.headers.cookie;
        var mat1 = cookie.match('(?:^|;\\s*){0}=([^;$]+)'.format(JSX_DEBUG_CLIENT));
        var mat2 = cookie.match('(?:^|;\\s*){0}=([^;$]+)'.format(JSX_DEBUG_CLIENT_VERSION_NAME));

        if (DEBUG) {

            if (!mat1 || mat1[1] != JSX_DEBUG_CLIENT_SERVICE) {
                setcookie.push('{0}={1}; Path=/'.format(JSX_DEBUG_CLIENT, JSX_DEBUG_CLIENT_SERVICE));
            }
            if (!mat2 || mat2[1] != debugCodeVersion) {
                setcookie.push('{0}={1}; Path=/'.format(JSX_DEBUG_CLIENT_VERSION_NAME, debugCodeVersion));
            }
        }
        else {
            var date = new Date(0, 1, 1).toUTCString();
            if (mat1) {
                setcookie.push('{0}=NULL; Path=/; Expires={1}'
                .format(JSX_DEBUG_CLIENT, date));
            }
            if (mat2) {
                setcookie.push('{0}=NULL; Path=/; Expires={1}'
                .format(JSX_DEBUG_CLIENT_VERSION_NAME, date));
            }
        }
        res.setHeader('Set-Cookie', setcookie);
    }: 
    noop;


    var globalAuth = GLOBAL_AUTH_ID ? function (req) {
        var cookie = req.headers.cookie;
        if (cookie) {
            var i = cookie.match('(?:^|;\\s*){0}=([^;]+)(;|$)'.format(GLOBAL_AUTH_ID_NAME));
            return (i ? i[1] == GLOBAL_AUTH_ID: false);
        }
        return false;
    }: 
    function(){ return true };


    var toString = Object.prototype.toString;

    function info(o) {

        var type = typeof o;
        var isObject = false;
        var isArray = false;
        var value = '[object Object]';
        var isProperties = false;
        type = type.substr(0, 1).toUpperCase() + type.substr(1);

        if (type == 'Object') {
            isObject = true;
            var t = toString.call(o).match(/\[.+ (.+)\]/)[1];
            if (t != 'Object' || (t = o.constructor && o.constructor.__name__)) {
                type += ',(' + t + ')';
            }
        }

        try {
            isArray = o instanceof Array;
            if (isObject && isArray) {
                value = '[' + (o.length < 10 ? o: '...') + ']';
            }
            else {
                value = o + '';
            }
        }
        catch(e) {}

        if (isObject) {
            if (isArray) {
                isProperties = (o.length !== 0);
            }
            else {
                for (var i in o) {
                    isProperties = true;
                    break;
                }
            }
        }

        return {
            type: type,
            value: value,
            isProperties: isProperties,
            isArray: isArray
        };
    }


    //获取 JsxDEV 调试代码
    function getDebugScript(script) {
        //DOTO ?
        return script;
    }


    //返回调试脚本
    function returnDebugJavaScript(service, filename, mtime, gzip) {

        var md5 = crypto.createHash('md5').update(filename + 'DEBUG_JS').digest('hex');
        var c_filename = service.server.temp + md5;

        function result(err, data) {
            if (err) {
                return service.returnStatus(404);
            }
            var res = service.response;
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(data);
        }

        fsx.stat(c_filename, function(err, stat) {

            if (!err && stat.mtime - mtime === 0) { //not update gzip cache
                return fsx.readFile(c_filename, result);
            }

            fsx.readFile(filename, function(err, data) {
                if (err) {
                    return service.returnStatus(404);
                }

                var script = getDebugScript(data + '');

                if (!gzip) {
                    fsx.writeFile(c_filename, script, Jsx.noop); //save code
                    return result(null, script);
                }

                node.zlib.gzip(new node.buffer.Buffer(script), function(err, data) { //gzip
                    if (!err) {
                        fsx.writeFile(c_filename, data, Jsx.noop); //save gzip
                    }
                    result(null, data);
                });
            });

        });
    }

    var _Debug =

    Class('Jsx._Debug', null, null, {
        
        /**
         * 是否输出请求日志
         * @type{Boolean}
         */
        printRequest: true,

        //监视变量,返回JSON
        watch: function(o) {

            var properties = [];
            var result = info(o);
            var reg = [ / ^\d + $ / , /\.|(^\d)/];
            result.properties = properties;

            o = (typeof o == 'string' ? String.prototype: o);

            if (result.isProperties) {

                if (result.isArray) {
                    o.forEach(function(item, i) {
                        item = info(item);
                        item.name = '[' + i + ']';
                        properties.push(item);
                    });
                }
                else {
                    for (var i in o) {
                        var item = info(o[i]);
                        item.name = reg[0].test(i) ? '[' + i + ']': reg[1].test(i) ? '["' + i + '"]': i;
                        properties.push(item);
                    }
                }
            }
            return JSON.stringify(result);
        },

        //更新代码版本号
        updateCodeVersion: function() {
            debugCodeVersion = new Date().valueOf();
        },

        //文件名指示是否启用 JsxDEV 调试
        debugJs: function(service, url, filename, mtime, gzip) {
            var is = /\.(j|J)(s|S)\?.*JSX_DEBUG$/.test(url);
            if (is) {
                returnDebugJavaScript(service, filename, mtime, gzip);
            }
            return is;
        },
        
        //设置 http debug client
        setHttpDebug: function(server, req, res) {

            //print request log
            if (_Debug.printRequest) {
                console.log(req.url);
            }

            if (globalAuth(req)) {
                setDebugClient(req, res);
                return false;
            }

            var url = req.url;
            var mat = url.match(new RegExp('^' + server.virtual + '/' + GLOBAL_AUTH_ID + '/(.*)$'));
            if (mat) { //OK
                res.setHeader('Set-Cookie', [GLOBAL_AUTH_ID_NAME + '=' + GLOBAL_AUTH_ID + '; Path=/']);
                res.setHeader('Location', mat[1] ? decodeURIComponent(mat[1]) : '/');
                res.writeHead(302);
                res.end();
                return true;
            }

            if (GLOBAL_AUTH_URL) {
                var root = 'http://' + req.headers.host;

                res.setHeader('Location',
                    '{0}?setUrl={1}&gotoUrl={2}'.format(
                    GLOBAL_AUTH_URL,
                    encodeURIComponent(root + server.virtual + '/'),
                    encodeURIComponent(root + req.url))
                );
                res.writeHead(302);
            }
            else {
                res.writeHead(403);
            }
            res.end();
            return true;
        },

        //设置 web socket debug client
        setSocketDebug: function(server, req, socket) {

            //print request log
            if (_Debug.printRequest) {
                console.log('Web socket upgrade, ' + req.url);
            }
            
            return !globalAuth(req) && !socket.end();
        }

    });

    global.__gubed = _Debug;
});
