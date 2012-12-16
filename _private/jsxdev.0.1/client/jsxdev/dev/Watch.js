/**
 * @class jsxdev.dev.Watch
 * extends Ext.Panel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');
include('extjs/ext.js');
include('extjs/ux/treegrid/TreeGridSorter.js');
include('extjs/ux/treegrid/TreeGridColumnResizer.js');
include('extjs/ux/treegrid/TreeGridNodeUI.js');
include('extjs/ux/treegrid/TreeGridLoader.js');
include('extjs/ux/treegrid/TreeGridColumns.js');
include('extjs/ux/treegrid/TreeGrid.js');
include('jsxdev/dev/WatchView.js');

define(function() {
    includeCss('extjs/ux/treegrid/treegrid.css');

    var LOCAL_STORAGE = localStorage;
    var WATCHS_STORAGE_KEY = 'WATCHS_STORAGE_KEY';
    var WATCHS_WIDTH_KEY = 'WATCHS_WIDTH_KEY';

    //private:
    function editorNode(_this, node) {
        var editor = _this._treeEditor;
        var dom = node.ui.textNode
        var text = dom.innerHTML;
        _this._startEdit = true;

        editor.editNode = node;
        editor.startEdit(dom, text == '&nbsp;' ? '' : text);
        clearTimeout(editor.autoEditTimer);
        _this._startEdit = false;
    }

    function escapeHtml(html){
        return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function init(_this) {

        var loader = _this.loader = new Ext.ux.tree.TreeGridLoader();
        loader.load = function(node) {
            var root = _this.root;
            if (node !== root)
                return _this.onload.emit(node);
            node.loadComplete();

            var items = _this.allWatch();
            if (items.length)
                _this.onadds.emit(items);

            items.forEach(function(item) {
                var n = loader.createNode({ iconCls: 'icon-error', name: item });
                root.appendChild(n);
                n.reload();
            });

            var createNode =
            _this._createNode = loader.createNode({ leaf: true, name: '', iconCls: 'icon-empty_img' });

            root.appendChild(createNode);
            createNode.on('beforeclick', function() {
                nextTick(function() {
                    editorNode(_this, createNode);
                });
            });
        };

        _this.on('beforeclick', function(node) {
            if (!node.text)
                node.text = node.attributes.name;
        });

        _this.on('beforedblclick', function(node, e) {

            if (node.parentNode === _this.root &&
                Ext.get(e.target.parentNode).select('span').item(0)) {

                editorNode(_this, node);
                return false;
            }
        });

        _this.on('render', function() {
            _this._disable ?
                _this.onDisable() : _this.onEnable();
            _this.on('show', function() {
                _this._disable ?
                _this.onDisable() : _this.onEnable();
            });
        });
    }

    function initEditor(_this) {

        var editor = _this._treeEditor = new Ext.tree.TreeEditor(_this, {
            allowBlank: true,
            cancelOnEsc: true
        }, {
            shadow: 0
        });

        editor.on('beforestartedit', function() {
            var node = editor.editNode;
            return (
                _this._startEdit &&
                node.parentNode === _this.root &&
                (_this._createNode === node || !node.isLoading())
            );
        });

        editor.on('startedit', function() {
            var node = editor.editNode;
            var columnWidth = node.ui.elNode.childNodes[0].clientWidth;
            var w = columnWidth;
            var offsetLeft = Math.max(0, node.ui.textNode.offsetLeft - _this.getTreeEl().dom.scrollLeft);

            if (node === _this._createNode) {
                var style = editor.el.dom.style;
                style.left = parseInt(style.left.match(/\d+/)[0]) - offsetLeft + 'px';
            }
            else
                w -= offsetLeft;

            editor.setSize(w, '');
            editor.el.select('input').item(0).dom.select();
        });

        editor.on('beforecomplete', function(e) {
            var node = editor.editNode;
            var createNode = _this._createNode;
            var root = _this.root;
            var exp = editor.getValue().trim();
            var items = _this.allWatch();
            var loader = _this.loader;

            if (exp) {

                if (createNode === node) { //add
                    var newNode = _this.loader.createNode({ iconCls: 'icon-empty', name: exp });
                    root.insertBefore(newNode, createNode);
                    items.push(exp);
                    _this.onadds.emit([exp]);
                    editor.setValue('');
                    newNode.reload();
                }
                else { //update

                    var old = node.attributes.name;
                    if (old != exp) {
                        var index = items.indexOf(old);
                        items.splice(index, 1, exp)
                        node.attributes.name = exp;
                        _this.onupdates.emit({ old: [old], value: [exp] });
                        node.reload(node);
                    }
                }
            }
            else if (node !== createNode) {
                var exp = node.attributes.name;
                items.removeVal(exp);
                _this.onremoves.emit([exp]);
                node.remove();
            }

            setWatch(_this, items);
        });
    }

    function initMenu(_this) {
        //menu
        var menu = _this.contextMenu = new Ext.menu.Menu({
            items: [
                {
                    id: 'watch-view',
                    text: 'View',
                    iconCls: 'icon-watch',
                    handler: function() {
                        view(_this, menu.contextNode);
                    }
                }, '-', {
                    id: 'watch-edit',
                    text: 'Edit',
                    iconCls: 'icon-edit',
                    handler: function() {
                        editorNode(_this, menu.contextNode);
                    }
                }, {
                    id: 'watch-copy',
                    text: 'Copy',
                    iconCls: 'icon-copy',
                    handler: function() {
                        var attributes = menu.contextNode.attributes;
                        //clipboardData.setData('Text', '{0} {1} {2}'.format(attributes.name, attributes.intactValue, attributes.type));
                    }
                }, {
                    id: 'watch-remove',
                    text: 'Delete',
                    iconCls: 'icon-delete-file',
                    handler: function() {
                        var node = menu.contextNode;
                        var items = _this.allWatch();
                        var exp = node.attributes.name;
                        items.removeVal(exp);
                        _this.onremoves.emit([exp]);
                        node.remove();
                        setWatch(_this, items);
                    }
                }, '-', {
                    id: 'watch-refresh',
                    text: 'Refresh',
                    iconCls: 'icon-refresh',
                    handler: function() {
                        menu.contextNode.reload();
                    }
                }
            ]
        });

        _this.on('contextmenu', function(node, e) {
            if (node === _this._createNode || node.isLoading())
                return;

            var menu = node.getOwnerTree().contextMenu;
            var attributes = node.attributes;
            var type = attributes.type;
            var isRoot = (node.parentNode === _this.root);
            var items = menu.items.items;
            var where = [
                /String|Function|RegExp/i.test(type),
                true, //
                isRoot,
                true,
                isRoot,
                true, //
                true
            ];

            items.forEach(function(item, index) {
                if (where[index])
                    item.enable();
                else
                    item.disable();
            });

            node.select();
            menu.contextNode = node;
            node.select();
            menu.showAt(e.getXY());
        });
    }

    function view(_this, node) {
        new jsxdev.dev.WatchView(_this.getNodeExpression(node), node.attributes.intactValue).show();
    }

    function setWatch(_this, items) {
        LOCAL_STORAGE.setItem(WATCHS_STORAGE_KEY, JSON.stringify(items));
    }

    function getWidth() {
        return JSON.parse(LOCAL_STORAGE.getItem(WATCHS_WIDTH_KEY) || '[200,300,100]');
    }

    function setWidth(value) {
        LOCAL_STORAGE.setItem(WATCHS_WIDTH_KEY, JSON.stringify(value));
    }

    Class('jsxdev.dev.Watch', Ext.ux.tree.TreeGrid, {

        //private:
        title: 'Watch',
        iconCls: 'icon-watch',
        closable: false,
        useArrows: false,
        animate: false,
        enableDD: false,
        lines: true,
        //forceFit: true,
        enableColumnHide: false,
        enableSort: false,
        enableHdMenu: false,

        _disable: true,
        _disable_timeout: 0,
        _createNode: null,
        _treeEditor: null,
        _startEdit: false,

        //public:
        /**
        * @event onadds
        */
        onadds: null,

        /**
        * @event onremoves
        */
        onremoves: null,

        /**
        * @event onremoves
        */
        onupdates: null,

        /**
        * @event onload
        */
        onload: null,

        /**
        * constructor function
        * @constructor
        */
        Watch: function() {
            Ext.Panel.call(this);
            Jsx.Delegate.def(this, 'adds', 'removes', 'updates', 'load');
        },

        initComponent: function() {

            var width = getWidth();

            this.columns = [
                {
                    header: 'Name',
                    dataIndex: 'name',
                    width: width[0]
                }, {
                    header: 'Vlaue',
                    dataIndex: 'value',
                    width: width[1]
                }, {
                    header: 'Type',
                    dataIndex: 'type',
                    width: width[2]
                }
            ];

            init(this);
            initEditor(this);
            initMenu(this);
            Ext.ux.tree.TreeGrid.prototype.initComponent.call(this);
        },

        updateColumnWidths: function() {
            var cls = this.columns;
            Ext.ux.tree.TreeGrid.prototype.updateColumnWidths.call(this);
            setWidth([cls[0].width, cls[1].width, cls[2].width]);
        },

        disable: function() {
            if (this.rendered)
                this._disable_timeout = this.onDisable.delay(this, 100);
            this._disable = true;
        },

        enable: function() {
            clearTimeout(this._disable_timeout);
            if (this.rendered)
                this.onEnable();
            this._disable = false;
        },

        allWatch: function() {
            return JSON.parse(LOCAL_STORAGE.getItem(WATCHS_STORAGE_KEY) || '[]');
        },

        getNodeExpression: function(node) {
            var root = this.root;
            var exp = '';
            if (node === root)
                return exp;

            while (true) {

                var parent = node.parentNode;
                var top = (parent === root);
                var name = node.attributes.name;

                exp = name + exp;
                if (top)
                    return exp;

                if (!/^\[.+\]$/.test(name))
                    exp = '.' + exp;
                node = parent;

            }
        },

        setAll: function(watchs) {

            var _this = this;
            var nodes = this.root.childNodes;
            nodes.forEach(function(node) {
                var index = watchs.propertyIndexOf('expression', node.attributes.name);
                if (index > -1)
                    _this.setNode(node, watchs[index]);
            });
        },

        setNode: function(node, data) {

            var parent = node.parentNode;
            var loader = this.loader;
            var value = escapeHtml(data.value);
            var newNode = loader.createNode({
                name: node.attributes.name,
                type: data.type,
                value: '{0}{1}{0}'.format(data.type == 'String' ? '"' : '', value.substr(0, 80)),
                intactValue: value,
                iconCls: data.type == 'Function' ? 'icon-function' : data.type == 'Error' ? 'icon-error' : 'icon-variable'
            });

            parent.insertBefore(newNode, node);

            (data.properties || []).forEach(function(item) {

                var value = escapeHtml(item.value);
                var n = loader.createNode({
                    name: item.name,
                    type: item.type,
                    value: '{0}{1}{0}'.format(item.type == 'String' ? '"' : '', value.substr(0, 80)),
                    intactValue: value,
                    iconCls: item.type == 'Function' ? 'icon-function' : 'icon-variable',
                    expanded: !item.isProperties
                });

                newNode.appendChild(n);
                if (!item.isProperties) {
                    n.loading = false;
                    n.loaded = true;
                }
            });

            newNode.loading = false;
            newNode.loaded = true;

            if (!data.isProperties ||
                (node.expanded && node.childNodes.length) ||
                this.root !== node.parentNode)
                newNode.expand();

            //if (this.getSelectionModel().getSelectedNode() === node)
            //    newNode.select();
            node.remove();
        }

    });
});
