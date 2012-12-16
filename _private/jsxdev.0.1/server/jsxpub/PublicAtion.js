/**
 * @class jsxpub.Publication
 * @createTime 2012-05-18
 * @updateTime 2012-05-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/xml/Document.js');
include('node/crypto.js');
include('node/fsx.js');
include('jsxpub/Parser.js');
include('jsxpub/FileMap.js');
include('jsxpub/Code.js');

define(function() {
    var crypto = node.crypto;
    var fsx = node.fsx;
    var FileMap = jsxpub.FileMap;
    var Parser = jsxpub.Parser;
    var Document = Jsx.xml.Document;

    var REG_EXP = /\.(\w+)$/;
    var JSX_NAME = 'bin/2fbb50df5a120a57649e3ccd7bc2e446.js';
    var THREAD_NAME = 'bin/6cc9abb37091fa9debc122f8b42d1b8e.js';
    var SOURCE_CODE = {};

    //get hans 
    function hash(data) {
        return crypto.createHash('md5').update(data);
    }

    //开始发布
    function start(_this, source, target, cb, type) {
        if (_this.start)
            return throwError('Is current in publication', cb);
        _this.start = true;
        _this.type = type;
        _this.output = [];
        _this.conf = {};
        _this.version = new Date().valueOf() + '';

        source = Jsx.format(source).trim().replace(/\/?$/, '/');
        target = Jsx.format(target).trim().replace(/\/?$/, '/');

        _this.sourceMap = new FileMap(source, _this.updateMap);
        _this.targetMap = new FileMap(target);
        _this.source = source;
        _this.target = target;

        function handler(err) {
            _this.start = false;
            if (err) 
                return cb(err);
                
            var targetMap = _this.targetMap;
            function commit() {
                _this.sourceMap.commit(targetMap.commit.cb(targetMap, cb, cb));
            }
            
            if (type != 'client')
                return commit();

            //处理client app.conf 文件 
            var conf = 'bin/app.conf';
            var md5 = hash(JSON.stringify(_this.conf)).digest('base64');

            fsx.readFile(_this.target + conf, function(err, buff) {
                var o = eval(err ? '({})' : '(' + buff + ')');

                for (var i in _this.conf) {
                    if (!(i in o))
                        o[i] = _this.conf[i];
                }

                var targetVal = JSON.stringify(o);
                var targetMd5 = hash(targetVal).digest('base64');
                
                if (targetMd5 != targetMap.get(conf)) {
                    console.log(conf);
                    _this.output.push(conf);
                    targetMap.set(conf, targetMd5);

                    fsx.writeFile(_this.target + conf, targetVal, commit.cb(cb));
                }
                else
                    commit();
            });
        }

        fsx.mkdir(target, (type == 'client' ? pub_client : pub_server).cb(handler, _this, handler));
    }

    //开始发布客户端文件
    function pub_client(_this, cb) {
        var target = _this.target;
        var items = ['Jsx/Core.js', JSX_NAME, 'Jsx/_ThreadService.js', THREAD_NAME];

        function handler() {

            while (items.length && _this.sourceMap.get(items[0]) == _this.targetMap.get(items[1]))
                items.splice(0, 2);
            if (!items.length)
                return each(_this, '', cb);

            var sourceFilename = items.shift();
            var targetFilename = items.shift();
            _this.targetMap.set(targetFilename, _this.sourceMap.get(sourceFilename));
            _this.getSourceCode(sourceFilename, function(data) {

                if (targetFilename == JSX_NAME)
                    data = data.replace(/,DEBUG:!0,/, ',DEBUG:!!0,');

                console.log(targetFilename);
                _this.output.push(targetFilename);

                fsx.writeFile(target + targetFilename, data, handler.cb(cb));
            } .cb(handler));
        }

        fsx.mkdir(
            Jsx.format(_this.source + '../temp/'),
            fsx.mkdir.cb(cb, target + 'bin/', handler.cb(cb))
        );
    }

    //pub server code
    //发布服务器文件
    function pub_server(_this, cb) {
        each(_this, '', cb);
    }

    //each and pub client code
    //遍历文件目录
    function each(_this, name, cb) {
        var source = _this.source + name;
        var target = _this.target + name;
        var items = [];

        function handler() {
            if (!items.length)
                return cb();
            var item = items.shift();
            var _name = item.name;

            if (/^\./.test(_name))
                return handler();

            _name = name + _name;
            
            if(_this.excludes.indexOf(_name) != -1){
                return handler();
            }
            
            item.dir ? 
            each(_this, _name + '/', handler.cb(cb)) : file(_this, _name, handler.cb(cb));
        }

        fsx.ls(source, function(ls) {
            var dir = [];
            ls.forEach(function(item) { item.dir ? dir.push(item) : items.push(item) });
            items = items.concat(dir);
            handler();
        } .cb(cb));
    }

    //处理客户端html文件
    function html(_this, name, cb) {
        var filename = _this.source + name;
        var doc = new Document();

        fsx.readFile(filename, function(data) {
            doc.load(data + '');
            var ls = doc.getElementsByTagName('script');

            function h() {
                var html = doc + '';
                var md5 = hash(html).digest('base64');

                if (_this.targetMap.get(name) == md5)
                    return cb();

                console.log(name);
                _this.output.push(name);
                _this.targetMap.set(name, md5);
                var target = _this.target + name;
                
                //BUG 需要修改,没有否在Jsx app script 标签时直接copy文件
                fsx.mkdir(target.match(/^(.+\/)([^\/]+)$/)[1], fsx.writeFile.cb(cb, target, html, cb));
            }

            //是否存在 Jsx app 节点,发布之
            for (var i = 0, l = ls.length; i < l; i++) {
                var item = ls.item(i);
                var src = item.getAttribute('src');
                if (!src)
                    continue;
                if (src.indexOf('Jsx/Core.js') == -1)
                    continue;

                item.setAttribute('src', src.replace('Jsx/Core.js', JSX_NAME));

                var main = item.getAttribute('main');
                if (main)
                    return new jsxpub.Code(main, _this).parse(function(md5) {
                        item.setAttribute('main', md5);
                        item.setAttribute('version', _this.version);
                        if (_this.map)
                            item.setAttribute('map', 'true');
                        h();
                    } .cb(cb)); //解析与合并代码
            }
            h();

        } .cb(cb));
    }

    //复制普通文件
    function copy(_this, name, cb) {
        var sourceMap = _this.sourceMap;
        var targetMap = _this.targetMap;
        var target = _this.target + name;

        var s_md5 = sourceMap.get(name);
        var t_md5 = targetMap.get(name);

        if (s_md5 == t_md5) //文件内容相同,不需要拷贝
            return cb();

        console.log(name);
        _this.output.push(name);
        targetMap.set(name, s_md5);

        fsx.mkdir(target.match(/^(.+\/)([^\/]+)$/)[1], 
            fsx.cp.cb(cb, _this.source + name, target, cb)
        );
    }

    //处理配置文件
    function conf(_this, name, cb) {
        
        fsx.readFile(_this.source + name, function(data) {
            
            var md5  = _this.sourceMap.get(name);
            var conf = eval('(' + data + ')');
            
            if(_this.type == 'client') {
                Jsx.extend(_this.conf, conf);
                return cb();
            }
            
            var targetMap = _this.targetMap;
            var targetMd5 = targetMap.get(name);
            
            if(targetMd5 == md5)
                return cb();
            var targetName = _this.target + name;
            
            fsx.readFile(targetName, function(err, data){
                data = data || '{}';
                tconf = eval('(' + data + ')');
                for (var i in conf) {
                    if (!(i in tconf))
                        tconf[i] = conf[i];
                }
                
                var targetVal = JSON.stringify(tconf);
                var newTargetMd5 = hash(targetVal).digest('base64');
                
                if (targetMd5 != newTargetMd5) {
                    console.log(name);
                    _this.output.push(name);
                    targetMap.set(name, newTargetMd5);

                    fsx.mkdir(targetName.match(/^(.+\/)([^\/]+)$/)[1], 
                        fsx.writeFile.cb(cb, targetName, targetVal, cb)
                    );
                }
                else
                    cb();
            });
            
        } .cb(cb));
    }

    //取得文件类型
    function gettype(name) {
        var mat = name.match(REG_EXP);
        if (!mat)
            return 1;
        var f = mat[1].toLowerCase();
        var ls = { js: 2, vx: 3, htm: 4, html: 4, map: 5, conf: 6 };
        return ls[f] || 1;
    }

    //遍历后处理文件
    function file(_this, name, cb) {
        var type = gettype(name);

        switch (type) {
            case 1: //xxx
                copy(_this, name, cb);
                break;
            case 2: //js,compress;
            case 3: //vx,compress
                if(_this.type == 'client'){
                    _this.sourceMap.get(name);
                    cb();
                }
                else
                    copy(_this, name, cb);
                break;
            case 4: //html,pub
                if(_this.type == 'client')
                    html(_this, name, cb);
                else
                    copy(_this, name, cb);
                break;
            case 5: //map
                cb();
                break;
            case 6: //conf
                conf(_this, name, cb);
                break;
        }
    }

    Class('jsxpub.PublicAtion', null, {
        
        //public:
        /**
         * 当前运行发布的类型client|server
         * @type {String}
         */
        type: '',
        
        /**
         * 压缩代码解析器
         * @type {jsxpub.Parser}
         */
        parser: null,
        
        /**
         * 发布源文件 map
         * @type {jsxpub.FileMap}
         */        
        sourceMap: null,
        
        /**
         * 发布目标文件 map
         * @type {jsxpub.FileMap}
         */
        targetMap: null,
        
        /**
         * 该参数表示强制从淅文件读取map值并且更新值源map文件,
         * @type {Boolean}
         */
        updateMap: true,
        
        /**
         * 发布源路径
         * @type {String}
         */
        source: '',
        
        /**
         * 发布目标路径
         * @type {String}
         */
        target: '',
        
        /**
         * 是否已经开始运行发布
         * @type {Boolean}
         */
        start: false,
        
        /**
         * 输出日志
         * @type {Boolean}
         */
        output: null,
        
        /**
         * 读取的配置
         * @type {Object}
         */
        conf: null,
        
        /**
         * 当前版本号
         */
        version: 0,
        
        /**
         * 是否启用MAP
         * @type {Boolean}
         */
        map: false,
        
        /**
         * 排除文件列表
         * @type {String[]}
         */
        excludes: null,

        /**
         * 构造函数
         * @constructor
         */
        PublicAtion: function() {
            this.parser = new Parser();
            this.excludes = [];
        },

        /**
         * 发布服务器代码
         * @param {String}   source
         * @param {String}   target
         * @param {Function} cb
         */
        server: function(source, target, cb) {
            start(this, source, target, cb, 'server');
        },

        /**
         * 发布客户端代码
         * @param {String}   source
         * @param {String}   target
         * @param {Function} cb
         */
        client: function(source, target, cb) {
            start(this, source, target, cb, 'client');
        },

        /**
         * 获取压缩的js与vx数据
         * @param {String}   name
         * @param {Function} cb
         */
        getSourceCode: function(name, cb) {
            var _this = this;
            var sourceMap = _this.sourceMap;
            var md5 = sourceMap.get(name);
            var temp = Jsx.format(_this.source + '../temp/');
            var path = temp + hash(md5).digest('hex');

            var code = SOURCE_CODE[name];
            if (code)
                return nextTick(cb, null, code);

            fsx.readFile(path, function(err, data) {

                if (data) {
                    var code = data + '';
                    SOURCE_CODE[name] = code;
                    return cb(err, code);
                }

                fsx.readFile(_this.source + name, function(data) {
                    
                    try{
                        var code;
                        if (gettype(name) == 3) { //vx
                            var doc = new Document();
                            doc.load(data + '');
                            code = _this.parser.vx(doc)
                        }
                        else
                            code = _this.parser.js(data + '');
                        
                        if (name == 'Jsx/Thread.js')
                            code = code.replace('Jsx/_ThreadService.js', THREAD_NAME);

                        SOURCE_CODE[name] = code;
                        fsx.writeFile(path, code, cb.cb(cb, null, code));
                    }
                    catch(e){
                        var err = name + ':\n' + e.message;
                        console.error(err);
                        cb(Error(err));
                    }
                } .cb(cb));
            });
        }
    });

});
