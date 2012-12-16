/**
 * @class Jsx.dom.ListTemplate 数据列表模板
 * @extends Jsx.dom.Control
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('Jsx/dom/Control.js');
include('Jsx/io/HttpDataSource.js');

define(function() {
    var REG_EXP = /^(Page|Load|Empty)Template$/;
    var Element = Jsx.dom.Element;
    var Control = Jsx.dom.Control;
    var DataSource = Jsx.io.DataSource;
    var HttpDataSource = Jsx.io.HttpDataSource;
    var body = Jsx.vx.body;

    //复制视图数据
    function cloneView(obj, data, out) {
        
        if (typeof obj == 'string') {
            
            var mat = obj.match(/^{([^\{\}]+)}$/);
            if (mat) {
                var name = mat[1];
                var val = Jsx.get(name, data);

                if (name == '$')
                    return val;
                if (val !== undefined)
                    return val;
            }
            else{
                return obj.replace(/{([^\{\}]+)}/gm, function(all, name) {
                    var r = Jsx.get(name, data);
                    return r === undefined ? all : r;
                });
            }
        }
        else if (obj) {
            if (Array.isArray(obj)) {
                var newObj = [];
                var len = obj.length;
                for (var i = 0; i < len; i++) {
                    newObj[i] = cloneView(obj[i], data, out);
                    if (typeof obj[i] == 'string')
                        newObj[i] += '';
                }
                return newObj;
            }
            else if (typeof obj == 'object') {
                newObj = {};
                for (var i in obj)
                    newObj[i] = cloneView(obj[i], data, out);
                if ('id' in obj)
                    out[obj.id] = true;
                return newObj;
            }
        }
        return obj;
    }

    //载入普通元素
    function loadDom(panel, view) {
        var dom = new Element(view.tagName);
        dom.id = view.id;
        panel.append(dom);
        return dom;
    }

    //载入控件
    function loadControl(_this, panel, view, ds) {
        var viewName = view.viewName;
        var view01 = body[viewName];

        //普通控件
        if (!view01 || !(view.classApp + '').match(/^(Group|Item)Template$/))
            return Control.create(view, panel);

        //以下为模板
        var templateChild = view01.__child;
        if (!templateChild)
            return;

        var isItemTemplate = (view.classApp == 'ItemTemplate');
        var count = view.count || 1e5;

        for (var i = 0; i < count && ds.length; i++) {
            var out = {};
            var data = isItemTemplate && ds.shift();

            for (var j = 0, v; (v = templateChild[j]); j++) {

                if (isItemTemplate)
                    v = Control.formatView(cloneView(v, data, out));

                if (typeof v == 'string') //模板下的字符串
                    panel.append(v);
                else if (v.Jsx)           //模板下的控件
                    loadControl(_this, panel, v, ds);
                else {                    //模板下的普通元素
                    var dom = loadDom(panel, v);
                    load(_this, dom, v, ds);
                }
            }

            var items = _this.items;
            if (isItemTemplate) {
                for (var id in out) {
                    out[id] = _this[id];
                    delete _this[id];
                }

                items.push(out);
                _this.onrenderitem.emit({ data: data, item: out, index: items.length - 1 });
            }
        }
    }

    //载入
    function load(_this, panel, view, ds) {
        Control.extend(panel, view);

        var child = view.__child;
        if (!child)
            return

        for (var i = 0, v; (v = child[i]); i++) {
            if (typeof v == 'string') {
                panel.append(v);
                continue;
            }
            if (v.Jsx)  //为自定义控件
                loadControl(_this, panel, v, ds);
            else       //为普通元素
                load(_this, loadDom(panel, v), v, ds);
        }
    }

    //数据源查询事件处理器
    function dataSourceSelectedHandler(_this, event) {
        var data = event.data;

        if (!_this.onbeforerender.emit(data))
            return;

        var emptyTemplate = _this.emptyTemplate;
        var pageTemplate = _this.pageTemplate;
        var width = _this.width();
        var height = _this.height();

        _this.empty();
        _this.items = [];

        if (data.length) {
            if (pageTemplate) {
                data = data.map(function(item, index){
                    return Jsx.extend({ $index: index, $: item }, item);
                });
                load(_this, _this, pageTemplate, data);
            }
        }
        else if (emptyTemplate) {
            var control = new Control();
            control.loadView(emptyTemplate);
            control.children().forEach(function(item) { _this.append(item) });
        }
        _this.onrender.emit();
    }
    
    function beforeloadHandler(_this){
        clearTimeout(_this._timeoutId);
        var loadTemplate = _this.loadTemplate;

        if (loadTemplate) {
            var control = new Control();
            control.loadView(loadTemplate);
            control.children().forEach(function(item) { _this.append(item) });
        }
    }
    
    //auto load data
    function autoLoadData(_this){
        if(_this.autoLoad)
            _this._ds.load();
    }
    
    function bind(_this, source){
        var oldSource = this._ds;
        if(oldSource/* instanceof DataSource*/){
            oldSource.onbeforeload.unon(beforeloadHandler, _this);
            oldSource.onload.unon(dataSourceSelectedHandler, _this);
        }
        source.onbeforeload.$on(beforeloadHandler, _this);
        source.onload.$on(dataSourceSelectedHandler, _this);
        _this._ds = source;
    }

    Class('Jsx.dom.ListTemplate', Control, {

        //pivate:
        _ds: null,
        _timeoutid: 0,

        //public:
        
        /**
         * 自动load数据
         * @type {Boolean}
         */
        autoLoad: true,
        
        /**
         * @type {Array} 
         */
        items: null,

        /**
         * 页模板
         * @type {Object}
         */
        pageTemplate: null,

        /**
         * loading模板
         * @type {Object}
         */
        loadTemplate: null,

        /**
         * 空数据模板
         * @type {Object}
         */
        emptyTemplate: null,

        /**
         * 数据源
         * @type {Jsx.io.DataSource}
         */
        //dataSource
        get dataSource(){
            return this._ds;
        },
        
        set dataSource(source){
            
            var top = this.top;
            if (typeof source == 'string' && top)
                source = top[source];

            if (source instanceof DataSource) {
                bind(this, source);
                this._timeoutid = autoLoadData.delay(1, this);
            }
            else //static data
                nextTick(this._ds, this._ds.loadData, source);
        },

        /**
         * @event onbeforerender
         */
        onbeforerender: null,

        /**
         * @event onrender
         */
        onrender: null,

        /**
         * @event onrenderitem
         */
        onrenderitem: null,

        /**
         * 构造函数
         * @constructor
         * @param {String} tagName (Optional) 元素名称,默认使用div
         */
        ListTemplate: function(tagName) {
            this.Control(tagName);
            Jsx.Delegate.def(this, 'beforerender', 'render', 'renderitem');
            bind(this, new HttpDataSource());
        },

        //重写,从视图数据中提取Template
        loadView: function(view) {
            view = Jsx.extend({}, Control.view(view));
            var child = view.__child;

            if (child) {
                var newChild =
                view.__child = [];

                for (var i = 0, len = child.length; i < len; i++) {

                    var item = child[i];
                    var view01 = body[item.viewName];
                    var classApp = item.classApp;

                    if (!view01 || !REG_EXP.test(classApp)) {
                        newChild.push(item);
                        continue;
                    }

                    view01.Jsx = 1;
                    if (classApp == 'PageTemplate')
                        this.pageTemplate = view01;
                    else if (classApp == 'LoadTemplate')
                        this.loadTemplate = view01;
                    else
                        this.emptyTemplate = view01;
                }
            }
            this.Jsx_dom_Control_loadView(view);
        }

    });
});