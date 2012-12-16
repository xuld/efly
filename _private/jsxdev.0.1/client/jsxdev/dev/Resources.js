/**
 * @class jsxdev.dev.Resources
 * extends Ext.tree.TreePanel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('extjs/ext.js');
include('Jsx/Delegate.js');
include('Jsx/io/HttpService.js');
include('jsxdev/Upload.js');

define(function() {
    var service = Jsx.io.HttpService.get('jsxdev.service.IDE');

    function initTbar(_this) {
        Ext.QuickTips.init();

        _this.tbar = [
            '-',
            {
                iconCls: 'icon-new',
                tooltip: 'New Item',
                handler: _this.newItem,
                scope: _this
            },
            {
                iconCls: 'icon-new-dir',
                tooltip: 'New Directory',
                handler: _this.newDirectory,
                scope: _this
            },
            {
                iconCls: 'icon-delete-file',
                tooltip: 'Delete Item',
                handler: function() {
                    _this.removeItem();
                }
            },
            {
                iconCls: 'icon-upload',
                tooltip: 'Upload files',
                handler: function() {
                    _this.upload();
                }
            },
            '-',
            {
                iconCls: 'icon-refresh',
                tooltip: 'Refresh',
                handler: function() {
                    _this.refresh();
                }
            }
        /*,
        {
        iconCls: 'icon-cog',
        tooltip: 'Config App',
        handler: function() {
        Ext.Msg.info('', 'Functions are being developed, so stay tuned');
        },
        scope: _this
        }*/
            ,
            {
                iconCls: 'icon-world_go',
                tooltip: 'Published App',
                handler: function() {
                    Ext.Msg.info('', 'Functional are being development, so stay tuned');
                }
            },
            '-',
            {
                iconCls: 'icon-collapse-all',
                tooltip: 'Collapse All',
                handler: function() {
                    _this.root.collapseChildNodes(true);
                }
            },
            '-'
        ];
    }

    function initDrag(_this) {

        var source;
        _this.on('startdrag', function(tree, node) {
            source = node.parentNode;
        });

        _this.on('dragdrop', function(tree, node, data) {

            var target = data.dragOverData.target;
            if (source === target)
                return;

            var name = node.attributes.text;
            var oldFilename = _this.getNodePath(source) + '/' + name;
            var filename = _this.getNodePath(target) + '/' + name;

            service.call('renameFile', [oldFilename, filename], function(err) {
                if (err)
                    return Ext.Msg.error('', err.message);
                _this.onmovefile.emit({ oldFilename: oldFilename, filename: filename });
            });
        });
    }

    function getSelectNode(_this) {
        return _this.getSelectionModel().getSelectedNode();
    }

    function initMenu(_this) {
        //menu
        _this.contextMenu = new Ext.menu.Menu({
            items: [
                {
                    id: 'open',
                    text: 'Open',
                    iconCls: 'icon-open-file',
                    handler: function() {
                        var node = getSelectNode(_this);
                        if (node.leaf)
                            _this.onopenfile.emit(_this.getNodePath(node));
                    }
                },
                {
                    id: 'start-browse',
                    text: 'View in browser',
                    iconCls: 'icon-browse',
                    handler: function() {
                        var node = getSelectNode(_this);
                        var filename = _this.getNodePath(node);
                        _this.onbrowsefile.emit(filename);
                    }
                },
                '-', {
                    id: 'new-item',
                    text: 'New item',
                    iconCls: 'icon-new',
                    handler: _this.newItem,
                    scope: _this
                }, {
                    id: 'new-directory',
                    text: 'New directory',
                    iconCls: 'icon-new-dir',
                    handler: _this.newDirectory,
                    scope: _this
                },
                {
                    id: 'upload',
                    text: 'Upload files',
                    iconCls: 'icon-upload',
                    handler: function() {
                        _this.upload();
                    }
                },
                '-',
                {
                    id: 'copy',
                    text: 'Copy',
                    iconCls: 'icon-copy',
                    handler: function() {
                        _this.copy();
                    }
                },
                {
                    id: 're-name',
                    text: 'Rename',
                    handler: function() {
                        _this.rename();
                    }
                }, {
                    id: 'delete-node',
                    text: 'Delete',
                    iconCls: 'icon-delete-file',
                    handler: function() {
                        _this.removeItem();
                    }
                },
                {
                    id: 'refresh-node',
                    text: 'Refresh',
                    iconCls: 'icon-refresh',
                    handler: function() {
                        _this.refresh();
                    }
                },
                '-',
                {
                    id: 'set-startup',
                    text: 'Setting as startup',
                    iconCls: 'icon-server-go',
                    handler: function() {
                        _this.setStartup();
                    }
                }
            //multiple
            ]
        });

        _this.on('contextmenu', function(node, e) {

            var menu = node.getOwnerTree().contextMenu;
            var path = _this.getNodePath(node);
            var isFile = node.leaf;
            var isRoot = (path == '');
            var isTwoNode = /^(server|client)$/i.test(path);
            var isServer = /^server/i.test(path);
            var isClient = /^client/i.test(path);
            var isJS = /\.js$/i.test(path);
            var isHtml = /\.html?$/i.test(path);

            var items = menu.items.items;
            var where = [
                isFile,                 //Open
                isHtml && isClient,     //
                true,
                true, //!isRoot,        //New item
                true, //!isRoot,        //New Dir
                !(isFile ? node.parentNode: node).uploader,                   //上传文件
                true,
                !(isRoot || isTwoNode), //拷贝
                !(isRoot || isTwoNode), //重命名
                !(isRoot || isTwoNode), //删除
                true,                   //刷新
                true,
                isJS && isServer        //Setting as startup
            ];

            items.forEach(function(item, index) {
                if (where[index])
                    item.enable();
                else
                    item.disable();
            });

            node.select();
            menu.contextNode = node;
            menu.showAt(e.getXY());
        });
    }

    function initEditor(_this) {

        var editor =
            _this.treeEditor = new Ext.tree.TreeEditor(_this, {
                allowBlank: true,
                cancelOnEsc: true
            });

        editor.on('startedit', function(event) {
            editor.el.select('input').item(0).dom.select();
        });

        editor.on('beforestartedit', function(event) {
            var node = editor.editNode;
            var root = _this.root;
            var filename = _this.getNodePath(node);

            if (node === root || /^(server|client)$/i.test(filename))
                return false;
        });

        editor.on('beforecomplete', function(event) {

            var name = editor.getValue();
            if (!name || name.match(/[\s"'\/\\\:\|]/)) {
                Ext.Msg.error('', 'Illegal file name');
                return false;
            }

            var node = editor.editNode;
            var attr = node.attributes;
            var oldFilename = _this.getNodePath(node);
            var filename = oldFilename.replace(/[^\/]+$/, name);

            try {

                //new file or directory
                if (attr.New) {
                    service.call(attr.leaf ? 'createFile' : 'createDirectory', [filename]);
                    if (attr.leaf)
                        _this.onopenfile.emit(filename);
                }
                else {  //rename
                    if (oldFilename == filename)
                        return;
                    service.call('renameFile', [oldFilename, filename]);
                    _this.onrenamefile.emit({ oldFilename: oldFilename, filename: filename });
                }

                _this.refresh(node.parentNode);
            }
            catch (err) {
                Ext.Msg.error('', err.message);
                return false;
            }
        });

        editor.on('canceledit', function(event) {
            var node = editor.editNode;
            var attr = node.attributes;
            if (attr.New)
                node.remove();
        });
    }

    Class('jsxdev.dev.Resources', Ext.tree.TreePanel, {

        title: 'Resource', //'&#160;', //
        iconCls: 'icon-res',
        autoScroll: true,
        useArrows: false,
        animate: false,
        enableDD: true,
        containerScroll: true,
        ddAppendOnly: true,

        /**
         * @event onopenfile
         */
        onopenfile: null,

        /**
         * @event onremovefile
         */
        onremovefile: null,

        /**
         * @event onrenamefile
         */
        onrenamefile: null,

        /**
         * @event onmovefile
         */
        onmovefile: null,

        /**
         * @event onbrowse
         */
        onbrowsefile: null,

        /**
         * tree editor
         * @type {Ext.tree.TreeEditor}
         */
        treeEditor: null,

        /**
         * constructor function
         * @constructor
         */
        Resources: function() {
            Ext.tree.TreePanel.call(this);
            Jsx.Delegate.def(this, 'openfile', 'removefile', 'renamefile', 'movefile', 'browsefile');
        },

        initComponent: function() {
            initTbar(this);
            initDrag(this);
            initMenu(this);
            initEditor(this);

            var _this = this;
            var sourct;
            this.root = {};
            this.loader = new Ext.tree.TreeLoader({ url: Jsx.format('?method=jsxdev.service.IDE.getResources') });

            this.loader.on('beforeload', function(treeLoader, node) {
                this.baseParams.args = JSON.stringify([_this.getNodePath(node)]);
            });

            Ext.tree.TreePanel.prototype.initComponent.call(this);

            this.on('dblclick', function(node) {
                if (node.leaf)
                    _this.onopenfile.emit(_this.getNodePath(node));
            });

            service.call('getRootResources', function(err, data) {
                if (err)
                    return Ext.Msg.error('', err.message);
                _this.setRootNode(data);
                delete _this.root.attributes.children;
            });
        },

        /**
         * @param {Ext.tree.AsyncTreeNode} node
         * @return {String}
         */
        getNodePath: function(node) {
            var ls = [];
            var parent;

            while (parent = node.parentNode) {
                ls.unshift(node.attributes.text);
                node = parent;
            }
            return ls.join('/');
        },

        /**
         * select node by path
         * @param {String} path
         */
        selectNode: function(path) {

        },

        /**
         * refresh tree node
         * @param {Ext.tree.AsyncTreeNode} node default root node
         */
        refresh: function(node) {
            node = node || getSelectNode(this) || this.root;

            if (node.leaf) {
                var parentNode = node.parentNode;
                parentNode.select();
                return this.refresh(parentNode);
            }
            this.loader.load(node, node.expand, node);
        },

        /**
         * create new item
         */
        newItem: function(file) {

            var selectedNode = getSelectNode(this);

            if (!selectedNode)
                return Ext.Msg.error('', 'Not select directory');

            if (selectedNode.leaf) {
                selectedNode.parentNode.select();
                return this.newItem(file);
            }

            var _this = this;
            var treeEditor = this.treeEditor;
            var newNode =
                new Ext.tree.AsyncTreeNode(file ?
                    { text: 'new item', leaf: true, New: true, iconCls: 'icon-new-item'} :
                    { text: 'new directory', leaf: false, New: true }
                );

            selectedNode.expand(false, false, function() {
                selectedNode.appendChild(newNode);
                newNode.select();
                treeEditor.editNode = newNode;
                treeEditor.startEdit(newNode.ui.textNode);
            });
        },

        /**
         * create new directory
         */
        newDirectory: function() {
            this.newItem();
        },

        /**
         * remove item
         */
        removeItem: function(node) {
            var _this = this;
            var root = this.root;

            node = node || getSelectNode(this);

            if (!node) {
                return Ext.Msg.error('', 'Not select directory');
            }

            var filename = _this.getNodePath(node);

            if (node === root || /^(server|client)$/i.test(filename))
                return Ext.Msg.error('', 'Node can not be deleted');

            Ext.Msg.question(
            '', 'Really want to delete? Deleted can not be restored',
            { ok: 'Ok', cancel: 'Cancel' },

            function(e) {
                if (e != 'ok')
                    return;

                service.call('removeFile', [filename], function(err) {
                    if (err)
                        return Ext.Msg.error('', err.message);
                    node.remove();
                    _this.onremovefile.emit(filename);
                });
            });
        },

        /**
         * copy item
         */
        copy: function(node) {
            var _this = this;
            var root = this.root;
            node = node || getSelectNode(this);

            if (!node) {
                return Ext.Msg.error('', 'Not select copy directory');
            }

            var filename = this.getNodePath(node);

            if (node === root || /^(server|client)$/i.test(filename))
                return Ext.Msg.error('', 'The node can not create a copy of');

            service.call('cloneFile', [filename], function(err) {
                if (err)
                    return Ext.Msg.error('', err.message);
                _this.refresh(node.parentNode);
            });
        },

        /**
         * rename item
         */
        rename: function(node) {
            var treeEditor = this.treeEditor;
            node = node || getSelectNode(this);

            if (!node) {
                return Ext.Msg.error('', 'Not select item');
            }

            var filename = this.getNodePath(node);

            if (node === root || /^(server|client)$/i.test(filename))
                return Ext.Msg.error('', 'The node can not rename of');

            node.select();
            treeEditor.editNode = node;
            treeEditor.startEdit(node.ui.textNode);
        },

        /**
         * Setting as startup
         */
        setStartup: function(node) {
            node = node || getSelectNode(this);

            var path = this.getNodePath(node);
            var isServer = /^server\//i.test(path);
            var isJS = /\.js$/i.test(path);

            if (!isServer || !isJS)
                return Ext.Msg.error('', 'Cannot set does startup');

            service.call('setStartup', [path], function(err) {
                if (err)
                    Ext.Msg.error('', err.message);
            });

        },

        /**
         * upload files
         */
        upload: function(node) {
            node = node || getSelectNode(this);

            if (!node)
                return Ext.Msg.error('', 'Not select directory');

            if (node.leaf)
                node = node.parentNode;
            if(node.uploader)
                return Ext.Msg.error('', 'Uploading in');
                
            var _this = this;
            var upload = jsxdev.Upload.get();

            upload.setService('jsxdev.service.IDE', 'uploadFile', this.getNodePath(node));

            upload.onstart.on(function() {
                node.uploader = true;
                node.setIconCls('icon-loading');
            });
            upload.oncomplete.on(function() {
                node.setIconCls('');
                delete node.uploader;
                _this.refresh(node);
            });
            upload.onerror.on(function() {
                node.setIconCls('');
                delete node.uploader;
                _this.refresh(node);
            });
            upload.start();
            
        }

    });
});