/**
 * @class jsxpub.Parser
 * @createTime 2012-05-18
 * @updateTime 2012-05-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('uglify/Uglify.js');


define(function() {

    //****************js****************
    /*
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     * because the buffer-to-string conversion in `fs.readFileSync()`
     * translates it to FEFF, the UTF-16 BOM.
     */
    function stripBOM(content) {
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    }
    
    function format(text) {
        return text.replace(/[^\x00-\x7f]/g, function(a) {
            var code = a.charCodeAt(0);
            var x = code < 0xff ? '\\u00' : '\\u';
            return x + code.toString(16);
        });
    }

    //****************vx****************
    function tag(node, tag) {
        return node.getElementsByTagName(tag);
    }

    function child(node, tag) {
        var res = [];
        if (!node)
            return res;

        var ls = node.childNodes;
        for (var i = 0, l = ls.length; i < l; i++) {
            var n = ls.item(i);
            if (n.nodeType == 1 && (!tag || n.tagName == tag))
                res.push(n);
        }
        return res;
    }

    //是否有子节点 
    function isChild(node) {
        var ls = node.childNodes;
        for (var i = 0, l = ls.length; i < l; i++) {
            var n = ls.item(i);
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
        var ls = el.attributes;
        for (var i = 0, l = ls.length; i < l; i++) {
            var e = ls.item(i);
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

        for (var i = 0, len = nodes.length; i < len; i++) {
            var e = nodes.item(i);
            if (e.tagName == 'line') {
                line = e;
                break;
            }
        }
        if (line) {
            var frames = line.childNodes, j = [];
            for (var i = 0, l = frames.length; i < l; i++) {
                var e = frames.item(i);
                if (e.nodeType == 1)
                    j.push(extend({ frameType: e.tagName }, e));
            }
            j[0] && (obj.__line = j);
        }

        var child = obj.__child;
        for (var i = 0, l = nodes.length; i < l; i++) {
            var e = nodes.item(i);
            if (e.nodeType == 1) {
                if (e.tagName != 'line')
                    child.push(parseJSON01(vx, e));
            }
            else if (e.nodeType == 3 || e.nodeType == 5)//文本节点
                child.push((e.nodeValue || e.text).replace(/\r\n/g, '\n'));
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
            var l = nodes.length;
            if (l) {
                var child = obj.__child = [];
                for (var i = 0; i < l; i++) {
                    var e = nodes.item(i);
                    if (e.nodeType == 1)
                        child.push(parseJSON01(vx, e));
                    else if (e.nodeType == 3 || e.nodeType == 5)//文本节点
                        child.push((e.nodeValue || e.text).replace(/\r\n/g, '\n'));
                }
            }
        }
        return obj;
    }

    //<head>
    //   <style>
    //	 	.kl{width: 200px;height: 300px;color: #f00;font-size: 12px;}
    //	 	.kl1{width: 200px;height: 300px;color: #f00;font-size: 12px;}
    //	</style>
    //</head>

    //<body>
    //    <MainScene classApp="Jsx.Scene" fsp="12">
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

    Class('jsxpub.Parser', null, {
        
        //public:
        /**
         * 压缩javascript代码
         * @param {String}   source
         */
        js: function(source) {
            source = stripBOM(source);
            return uglify.Uglify.parse(source, { gen_options: { ascii_only: true } });
        },

        /**
         * 解析vx
         * @param {xml} Jsx.xml.Document
         * @return {Object}
         */
        vx: function(xml) {
            var jsx = tag(xml, 'Jsx').item(0);
            var head = child(jsx, 'head')[0];
            var vx = { dir: jsx.getAttribute('dir'), head: { res: {} }, body: {} };
            var _head = vx.head;

            child(head).forEach(function(n) {
                var type = n.tagName;
                if (type == 'res')
                    return;
                var out =
                _head['_' + Jsx.guid()] = extend({ type: type }, n);

                var val = '';
                var items = n.childNodes;
                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items.item(i);
                    if (item.nodeType == Jsx.xml.Node.TEXT_NODE)
                        val += item.nodeValue;
                }

                out.textContent =
                    (type.toLowerCase() == 'style' ?
                        val.replace(/(\s+)|(\/\*([^\*]*\**(?!\/))*(\*\/)?)/g, ' ') : val);
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

            return 'Jsx._vx(' + format(JSON.stringify(vx)) + ');';
        }
    });

});