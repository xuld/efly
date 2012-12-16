/*
 * @class Jsx._Debug 系统调试
 * @createTime 2012-05-01
 * @updateTime 2012-05-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('Jsx/io/HttpService.js');
include('Jsx/io/WSClient.js');

define(function(global) {
    var Path = Jsx.Path;

    if (!Jsx.DEBUG)
        throw 'Not include file "Jsx/_Debug.js"';

    function tag(node, tag) {
        return node.getElementsByTagName(tag);
    }

    function child(node, tag) {
        var result = [];
        if (!node)
            return result;

        var ls = node.childNodes;
        for (var i = 0, n; (n = ls[i]); i++) {
            if (n.nodeType == 1 && (!tag || n.tagName == tag))
                result.push(n);
        }
        return result;
    }

    //是否有子节点 
    function isChild(node) {
        var ls = node.childNodes;
        for (var i = 0, n; (n = ls[i]); i++) {
            if (n.nodeType == 1 || n.nodeType == 3 || n.nodeType == 5)
                return true;
        }
        return false;
    }

    /*
     * 从元素节点扩展属性
     * @param {Object}      obj  需要扩展的对像
     * @param {HTMLElement} element 扩展源
     * @static
     */
    function extend(obj, el) {
        var attrs = el.attributes;
        for (var i = 0, e; (e = attrs[i]); i++) {
            if (e.specified) {
                var name = e.name;
                var value = e.value;
                obj[name] = /^((-?\d+(\.\d+)?)|true|false)$/.test(value) ? eval(value) : value;
            }
        }
        return obj;
    }

    /*
     * 解析xml视图为vx
     * @param {Object}      vx     要put的vx对像
     * @param {HTMLElement} element  视节点
     * @param {String}      viewName 如果该视图为匿名的,应该传入该参数
     * @static
     */
    function parseJSON(vx, element, viewName) {
        var name = viewName || element.tagName;
        if (vx.body[name] && element.getAttribute('override') != 'yes')//声明了 override 表示可覆盖视图
            throw name + '视图重复定义,覆盖请声明override=yes';

        var obj = { viewName: name, __child: [] };
        vx.body[name] = obj;
        
        //非匿名视图
        if(!viewName)
            extend(obj, element);

        var nodes = element.childNodes;
        var line;

        for (var i = 0, e; (e = nodes[i]); i++) {
            if (e.tagName == 'line') {
                line = e;
                break;
            }
        }
        if (line) {
            var frames = line.childNodes, j = [];
            for (var i = 0, e; (e = frames[i]); i++) {
                if (e.nodeType == 1)
                    j.push(extend({ frameType: e.tagName }, e));
            }
            j[0] && (obj.__line = j);
        }

        var child = obj.__child;
        for (var i = 0, e; (e = nodes[i]); i++) {
            if (e.nodeType == 1) {
                if (e.tagName != 'line')
                    child.push(parseJSON01(vx, e));
            }
            else if (e.nodeType == 3 || e.nodeType == 5)//文本节点
                child.push(e.nodeValue || e.text);
        }
    }

    /*
     * 解析HTML节点为vx数据
     * @param  {Object}      vx       要put的对像
     * @param  {HTMLElement} element  HTML节点
     * @return {Object}               返回JSON数据
     * @static
     */
    function parseJSON01(vx, element) {
        var obj = extend({}, element);
        var tagName = element.tagName;
        if (tagName.match(/^Jsx:/)) { //为控件
            obj.Jsx = 1;
            var substr = tagName.substr(4);

            if (isChild(element)) {//有子节点创建匿名视图
                var viewName = '_' + Jsx.guid();
                parseJSON(vx, element, viewName);
                obj.viewName = viewName;
                obj.classApp = substr;
            }
            else
                obj.viewName = substr;
        }
        else {
            obj.tagName = tagName;
            var nodes = element.childNodes;
            if (nodes[0]) {
                var child = obj.__child = [];
                for (var i = 0, e; (e = nodes[i]); i++) {
                    if (e.nodeType == 1)
                        child.push(parseJSON01(vx, e));
                    else if (e.nodeType == 3 || e.nodeType == 5)//文本节点
                        child.push(e.nodeValue || e.text);
                }
            }
        }
        return obj;
    }

    //<head>
    //   <style>
    //     	.kl{width: 200px;height: 300px;color: #f00;font-size: 12px;}
    //	 	.kl1{width: 200px;height: 300px;color: #f00;font-size: 12px;}
    //	</style>
    //</head>
    
    //<body>
    //    <MainScene classApp="Jsx.dom.Scene">
    //        <line>
    //            <Frame x="0" y="0" />
    //            <Transition type="C" length="10" />
    //            <Frame x="100" y="100" />
    //        </line>
    //        <Js:test.Test id="test.Test" />
    //        <div class="div1">
    //            ABCD
    //            <div><Js:Image src="res:OK_A" /></div>
    //            <div id="bottom"></div>
    //        </div>
    //    </MainScene>
    //</body>

    //    //测试样例
    //    var MainScene = {
    //        viewName: 'MainScene',
    //        classApp: 'Jsx.dom.Scene',
    //        __line: [
    //            { frameType: 'Frame', x: 0, y: 0 },
    //            { frameType: 'Transition', type: 'C', length: 10 },
    //            { frameType: 'Frame', x: 100, y: 100 }
    //        ],
    //        __child: [
    //            '\n',
    //            { Jsx: 1, viewName: 'test.Test', id: 'test.Test', tagName: 'div' },
    //            {
    //                tagName: 'div',
    //                class: 'div1',
    //                __child: [
    //                    'ABCD\n',
    //                    {
    //                        tagName: 'div',
    //                        __child: [
    //                            { Jsx: 1, viewName: 'Image', src: 'res:OK_A' }
    //                        ]
    //                    },
    //                    { tagName: 'div', id: 'bottom' }
    //                ]
    //            },
    //            '\n'
    //        ]
    //    };

    Class('Jsx._Debug', null, null, {

        /**
         * 解析XML为vx数据
         * @param {XMLDocument} xml
         * @static
         */
        vx: function(xml) {

            var jsx = tag(xml, 'Jsx')[0];
            var head = child(jsx, 'head')[0];
            var vx = { dir: jsx.getAttribute('dir'), head: { res: {} }, body: {} };
            var _head = vx.head;

            child(head).forEach(function(n) {
                var type = n.tagName;
                if (type == 'res')
                    return;
                var out =
                _head['_' + Jsx.guid()] = extend({ type: type }, n);
                out.textContent = n.textContent || n.text || '';
            });

            child(child(head, 'res')[0]).forEach(function(n) {
                var name = n.getAttribute('name');
                var type = n.tagName;
                if (_head.res[name] && n.getAttribute('override') != 'yes')
                    throw name + '重复定义,覆盖请声明override=yes';
                extend(_head.res[name] = { type: type }, n);
            });

            child(child(jsx, 'body')[0]).forEach(function(n) {
                parseJSON(vx, n);
            });
            Jsx._vx(vx);
        }
    });


    if (!Jsx.JSX_DEBUG)
        return;

    var webService = Jsx.JSX_DEBUG_URL;

    //*
    //*
    //*
    //*
    //*
    //*
    //***************JSX-DEBUG***************
    var TIMEOUT = 2E4;    // error timeout default as 20s
    var exit = false;
    var isbreak = false;
    var noop = Jsx.noop;
    var watchsexp = [];
    var breakpoints = [];
    var stdout = [];
    var stderr = [];
    var toString = Object.prototype.toString;

    var threadId, ws;
    var http = new Jsx.io.HttpService('jsxdev.BrowserBreak', webService);
    http.jsonp = false;

    function error(msg) {
        //TODO?
        console.error('System Error:', msg);
        return true;
    }

    function ready() {
        try {
            var data = http.call('ready');
            threadId = data.threadId;
            return data;
        }
        catch (e) {
            exit = true;
            _console.error('无法连接远程调试服务,\n' + e.message);
        }
    }

    function Break(msg) {
        var date = new Date();

        /*
        //{
        //    type     : 'break',    // 'break'|'againbreak'|'commandComplete'
        //    body     : {},
        //    watchsExp: [],
        //    stdout   : [],
        //    stderr   : []
        //}
        */

        try {
            var data = http.call('break', [threadId, msg]);
            return data;
        }
        catch (e) {
            if (new date() - date < TIMEOUT) {  //错误
                exit = true;
                ws.conversation.close();

                _console.error('无法连接远程调试服务,\n' + e.message);
                return;
            }
        }

        return Break({ type: 'againbreak' });
    }

    //运行js
    function Eval(exp) {
        //TODO ?
        return eval.call(global, exp);
    }

    function format(o) {
        //TODO ?
        return o + '';
    }

    //监视变量,返回JSON
    function watch(exp) {

        try {
            var o = Eval(exp);
        }
        catch (e) {
            return { type: 'Error', value: e.message, expression: exp };
        }

        var properties = [];
        var result = watchInfo(o);
        var reg = [/^\d+$/, /\.|(^\d)/];
        result.properties = properties;
        result.expression = exp;

        o = (typeof o == 'string' ? String.prototype : o);

        if (result.isProperties) {

            if (result.isArray) {
                o.forEach(function(item, i) {
                    item = watchInfo(item);
                    item.name = '[' + i + ']';
                    properties.push(item);
                });
            }
            else {
                for (var i in o) {
                    var item = watchInfo(o[i]);
                    item.name = reg[0].test(i) ? '[' + i + ']' : reg[1].test(i) ? '["' + i + '"]' : i;
                    properties.push(item);
                }
            }
        }
        result;
    }

    function watchInfo(o) {

        var type = typeof o;
        var isObject = false;
        var isArray = false;
        var value = '[object Object]';
        var isProperties = false;
        type = type.substr(0, 1).toUpperCase() + type.substr(1);

        if (type == 'Object') {
            isObject = true;
            var t = toString.call(o).match(/\[.+ (.+)\]/)[1];
            if (t != 'Object' || (t = o.constructor && o.constructor.__name__))
                type += ',(' + t + ')';
        }

        try {
            isArray = o instanceof Array;
            if (isObject && isArray)
                value = '[' + (o.length < 10 ? o : '...') + ']';
            else
                value = o + '';
        }
        catch (e) { }

        if (isObject) {
            if (isArray)
                isProperties = (o.length !== 0);
            else {
                for (var i in o) {
                    isProperties = true;
                    break;
                }
            }
        }

        return { type: type, value: value, isProperties: isProperties, isArray: isArray };
    }

    function log(args) {
        return Array.toArray(args).map(function(item) {
            return format(item);
        }).join(' ');
    }

    var _console = global.console;

    global.console = {
        'assert': noop,
        'count': noop,
        'debug': noop,
        'dir': noop,
        'dirxml': noop,
        'error': function() {
            if (isbreak)
                stderr.push(log(arguments));
            else
                ws.call('stderr', [log(arguments)]);
        },
        'group': noop,
        'groupCollapsed': noop,
        'groupEnd': noop,
        'info': noop,
        'log': function() {
            if (isbreak)
                stdout.push(log(arguments));
            else
                ws.call('stdout', [log(arguments)]);
        },
        'markTimeline': noop,
        'profile': noop,
        'profileEnd': noop,
        'time': noop,
        'timeEnd': noop,
        'timeStamp': noop,
        'trace': noop,
        'warn': noop
    };

    function handleCommands(commands) {
        var receiptResult = [];
        commands.forEach(function(command) {
            var result = handle[command.command](command);
            if (result)
                receiptResult.push(result);
        });
        return receiptResult;
    }

    // handle command
    var handle = {

        //receipt false
        'setbreakpoints': function(command) {
            breakpoints = command.arguments.breakpoints;
            //TODO ?
        },

        //receipt false
        'setwatchsexp': function(command) {
            watchsexp = command.arguments.expressions;
            //TODO ?
        },

        //receipt false
        'continue': function(command) {
            var stepaction = command.arguments.stepaction;
            switch (stepaction) {
                case 'next':
                    break;
                case 'in':
                    break;
                case 'out':
                    break;
                default: //run
                    break;
            }
        },

        //receipt true
        'watchs': function(command) {
            var result = { command: command.command, result: [] };

            command.arguments.expressions.forEach(function(exp) {
                result.result.push(watch(exp));
            });
            return result;
        },

        //receipt true
        'evaluates': function(command) {
            try {
                var exp = command.arguments.expression;
                var value = Eval(exp);
                return {
                    command: command.command,
                    result: { expression: exp, type: 'Object', text: format(value), value: null }
                };
            }
            catch (e) {
                return { command: command.command, error: e.message };
            }
        },

        'exit': function(command) {
            _console.log('调试服务已关闭');
            exit = true;
            ws.conversation.close();
        }
    };
    //command end

    //start connect debug service
    var data = ready();
    if (!data)
        return;

    var date = new Date();
    ws = new Jsx.io.WSClient('jsxdev.BrowserService', Path.set('threadId', threadId, webService));
    ws.conversation.onclose.on(function() {
        if (!exit) {
            var _date = new Date();
            if (_date - date > TIMEOUT) {
                date = _date;
                this.connect();
            }
            else {
                exit = true;
                _console.error('与调试服务器连接已断开');
            }
        }
    });

    ws.on('command', function(evt) {
        var receipt = handleCommands(evt.data.commands);
        if (receipt.length)
            this.call('commandComplete', [receipt]);
    });

    //异常捕获
    if (global.attachEvent)
        global.attachEvent('onerror', error);
    else {
        Jsx.UA.GECKO && (global.onerror = error);

        Jsx.on(global, 'error', function(evt) {
            evt.returnValue = false;
            if (Jsx.UA.GECKO)
                global.onerror = error;
            else
                error(evt.message.replace(/^[^:]+:/, ''));
        });
    }

    handleCommands(data.commands);
});




