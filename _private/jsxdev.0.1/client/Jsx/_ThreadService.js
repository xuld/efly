/**
 * @createTime 2011-11-11
 * @updateTime 2011-11-11
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

(function(global, EVAL) {

    if (global.include)
        throw 'Not include file "Jsx/_ThreadService.js"';
    var _INCLUDE_LOG = {};                                       //包含日志
    var _ASYN_INCLUDE_LIST = {};                                 //异步包含等待列表
    var _INSTANCE;                                               //线程实体
    var _CURRENT;

    //日志输出
    function log() {
        postMessage({ type: 'log', data: Array.prototype.slice.call(arguments) });
    }

    //包含文件
    function _i_nclude(name, callback) {
        var ls = name.split(',');
        var l = ls.length;
        if (l > 1) {
            if (callback) {
                var cb = function(err) {
                    if (err)
                        return callback(err);
                    l-- ? _i_nclude(ls.shift(), cb) : callback();
                };
                return cb();
            }
            for (var i = 0; i < l; i++)
                _i_nclude(ls[i]);
            return;
        }

        var name1 = name.replace(/\s+/g, '').split(':')[0]
        if (_INCLUDE_LOG[name1]) {               //not include
            if (callback)                        //not code include
                nextTick(callback);
            return;
        }

        var LOG = Jsx._INCLUDE_LOG[name1];
        if (LOG) {                            //source code

            var compile = function() {
                if (_INCLUDE_LOG[name1])
                    return
                _INCLUDE_LOG[name1] = 1;

                if (/\.vx($|\?|#)/i.test(name1))
                    return;

                var includes = LOG.includes;
                var codes = LOG.codes;

                //included file dependencies
                for (var i = 0, e; (e = includes[i]); i++)
                    _i_nclude(e);
                for (var i = 0, code; (code = codes[i]); i++)
                    EVAL(code);
            };

            if (!callback)
                return compile();
            nextTick(function() {
                compile();
                callback();
            });
        }

        else if (callback) {                  //No code needs to request the source code to the parent thread
            var id = '_' + Math.round(Math.random() * 1E7);

            _ASYN_INCLUDE_LIST[id] = {
                name: name,
                callback: callback
            };

            postMessage({
                type: 'include',
                data: {
                    id: id,
                    name: name
                }
            });
        }
        else
            throw name1 + 'child thread contains error, can not find the source code';
    }
    global.include = _i_nclude;

    //Rewrite the Thread constructor
    function _constructor(filename, name) {

        this.filename = filename
        this.name = name;
        this.close = function() {
            postMessage({ type: 'close', data: { type: 'unload'} });
            //global.close();
        }
    }

    function handler(e) {
        postMessage({ type: 'event', data: { type: e.type, data: e.data} });
    }

    global.addEventListener('message', function(e) {
        var data = e.data.data;
        var type = e.data.type;

        switch (type) {
            case 'call':       //call function
                var cb = data.callback;
                if (!cb)
                    return _INSTANCE[data.name].apply(_INSTANCE, data.args);
                var err;
                var value;

                try {
                    value = _INSTANCE[data.name].apply(_INSTANCE, data.args);
                } catch (er) {
                    err = er;
                }
                postMessage({ type: 'callback', data: { callback: cb, error: err, value: value} });
                break;

            case 'include': //Re-run including
                var obj = _ASYN_INCLUDE_LIST[data.id];
                delete _ASYN_INCLUDE_LIST[data.id];
                Jsx.extend(Jsx, data)
                _i_nclude(obj.name, obj.callback);
                break;

            case 'init':

                EVAL('(' + data._DEFINE_GLOBAL_CODE + ')')(global, EVAL);
                Jsx.extend(Jsx, data);
                Jsx._vx = Jsx.noop;
                console.log = log;

                if (Jsx.DEBUG)
                    _i_nclude('Jsx/_Debug.js');

                _i_nclude('Jsx/Thread.js');

                var filename = Jsx._FILE_NAME;
                var name = Jsx._NAME;
                _i_nclude(filename);

                Jsx.Thread.current =
                _CURRENT = new _constructor(filename, name);
                _CURRENT.constructor = Jsx.Thread;

                var klass = Jsx.get(name);
                if (!klass)
                    throw name + ' not defined';

                _CURRENT.instance = _INSTANCE = new klass(Jsx._ARGS);

                var all = Jsx.Delegate.all(_INSTANCE);
                for (var i = 0, l = all.length; i < l; i++)
                    all[i].on(handler);
                break;
        }
    }, false);

})(self, eval);
