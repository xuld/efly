/**
 * @class jsxpub.Code
 * @createTime 2012-05-20
 * @updateTime 2012-05-20
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('node/crypto.js');
include('node/fsx.js');
include('Jsx/Util.js');

define(function() {
    var crypto = node.crypto;

    function hash(data) {
        return crypto.createHash('md5').update(data);
    }

    function exist(_this, name) {

        var includes = _this.includes;

        for (var i = 0, l = includes.length; i < l; i++) {
            if (exist(includes[i], name))
                return true;
        }
        return (name == _this.name);
    }

    var private_code =

    Class('private_code', null, {

        //private:
        _code: '',
        _replaceName: '',

        //public:
        name: '',
        pub: null,
        includes: null,
        includesChildren: null,
        parent: null,
        prev: null,
        independent: true, //文件关键节点

        private_code: function(name, parent, prev) {
            if (parent) {
                this.parent = parent;
                this.pub = parent.pub;
            }
            if (prev)
                this.prev = prev;

            this.name = name;
            this.includes = [];
            this.includesChildren = [];
            this.independent = (arguments.length == 3);
        },

        exist: function(name) {

            if (this.independent) {
                if (exist(this, name))
                    return true;
                else
                    return this.prev ? this.prev.exist(name) : this.parent.exist(name);
            }
            var code = this.parent;

            while (true) {
                if (code.independent)
                    return code.exist(name);
                else
                    code = code.parent;
            }
        },

        getName: function() {

            var name = this._replaceName;
            if (name)
                return name;

            name = (this.prev ? this.prev.getName() : this.parent.name) + this.name;
            this._replaceName =
                          name = 'bin/' + hash(name).digest('hex') + '.js';
            return name;
        },

        getCode: function() {

            var codes = [];

            this.includes.forEach(function(inc) {
                codes = codes.concat(inc.getCode());
            });
            codes.push(this._code);
            return codes;
        },

        write: function(cb) {

            var includes = this.includesChildren.concat(this.includes);

            function h() {
                if (!includes.length)
                    return cb();
                includes.shift().write(h.cb(cb));
            }

            if (!this.independent)
                return h();

            var code = this.getCode().join('\n').trim();
            var name = this.getName();

            if (!code)
                return h();

            var md5 = hash(code).digest('base64');
            if (md5 == this.pub.targetMap.get(name))
                h();
            else {
                console.log(name);
                this.pub.output.push(name);
                this.pub.targetMap.set(name, md5);
                node.fsx.writeFile(this.pub.target + name, code, h.cb(cb));
            }
        },

        parse: function(cb) {
            var _this = this;
            var name = this.name;
            var reg = /include\(("([^":]+)"|([^,:]+)),/;

            function includeChildren() {
                var source = _this._code;
                var mat = reg.exec(source);
                var prev = null;
                var replaceName = [];

                if (!mat)
                    return cb(null, _this.getCode().join('') && name + ':' + _this.getName());

                var key = mat[2];
                if (!key)
                    return cb(Error(name + ', error ' + mat[0] + '... ,include参数只能使用字符串常量'));

                var names = key.split(',');

                function handler(md5) {

                    if (md5)
                        replaceName.push(md5);

                    if (!names.length) {
                        _this._code = source.replace(mat[0], 'include("' + replaceName.join(',') + '",');
                        return includeChildren();
                    }

                    var n = names.shift();

                    var code =
                    prev = new private_code(n, _this, prev);
                    _this.includesChildren.push(code);
                    code.parse(handler.cb(cb));
                }
                handler();
            }

            //****
            var head = [];

            function includeHead() {

                if (!head.length)
                    return includeChildren();

                var h = head.shift();
                if (_this.exist(h))
                    return includeHead();

                var code = new private_code(h, _this);
                _this.includes.push(code);
                code.parse(includeHead.cb(cb));
            }

            this.pub.getSourceCode(name, function(code) {
                _this._code = code = code.trim();

                if (/\.vx$/i.test(name))
                    return cb(null, code && name + ':' + _this.getName());
                var mat;
                var reg2 = /(\r?\n)*include\(("([^"]+)"|([^,\)]+))\)(;|,)?/;

                while (mat = reg2.exec(code)) {

                    if (mat.index)
                        return cb(Error(name + ', error ' + mat[0] + ' ,include只能在头部包含'));

                    if (mat[4])
                        return cb(Error(name + ', error ' + mat[0] + ' ,include参数只能使用字符串常量'));

                    code = code.substr(mat[0].length);
                    var key = mat[3] || mat[4];
                    if (head.indexOf(key) == -1)
                        head.push(key);
                }

                reg2 = /((\r?\n)*define\()(function\([^\)]*\)\{)/gm;
                var i = 0;
                while (mat = reg2.exec(code)) {

                    if (i)
                        return cb(Error(name + ', error ,每个文件只能有一个define'));
                    if (mat.index)
                        return cb(Error(name + ', error ,代码只能包含在define内部,并且紧跟在include后'));

                    code = 'define("' + name + '",' + JSON.stringify(head) + ',' + code.substr(mat[1].length);
                    i++;
                }

                code = code.trim();

                if (!i) {
                    if (code) {
                        //Warning
                        //console.log(name + ', Warning ,请将代码包含在define块内,除头部include外');
                    }
                    code = 'define("' + name + '",' + JSON.stringify(head) + ',function(){});' + code;
                }
                _this._code = code;

                includeHead();
            } .cb(cb));
        }
    });


    Class('jsxpub.Code', private_code, {

        _name: '',

        /**
        * @param {String} name
        * @param {String} parent (Optional)
        * @constructor
        */
        Code: function(name, pub) {
            this.private_code('');
            this.pub = pub;
            this.independent = true;
            this._name = name;
        },

        getName: function() {
            return '';
        },

        exist: function() {
            return false;
        },

        parse: function(cb) {
            var _this = this;
            var prev = null;
            var names = this._name.split(',');
            var md5 = [];

            function handler(result) {

                if (result)
                    md5.push(result);

                if (!names.length)
                    return _this.write(cb.cb(cb, null, md5.join(',')));

                var name = names.shift();
                var code =
                    prev = new private_code(name, _this, prev);
                _this.includesChildren.push(code);
                code.parse(handler.cb(cb));
            }
            handler();
        }
    });

});