
include('Jsx/Util.js');
include('Jsx/io/HttpService.js');
include('Jsx/Cookie.js');
include('extjs/ext.js');

define(function() {
    includeCss('jsxdev/res/css/style.css');
    var project = Jsx.io.HttpService.get('jsxdev.service.Project');
    var user = Jsx.io.HttpService.get('jsxdev.service.User');
    var INSTANCE;

    /**
     * @class jsxdev.Start.private$tree
     * @extends Object
     * @createTime 2012-01-25
     * @updateTime 2012-01-25
     * @author www.mooogame.com, simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     */

    function getNodes(_this, tag) {
        var children = _this.children;
        var result = [];

        for (var i = 0, l = children.length; i < l; i++) {
            var item = children[i];
            if (item.tag === tag)
                result.push(item);
        }
        return result;
    }

    var private$tree =

    Class('private$tree', null, {

        /**
         * @type {Number}
         */
        id: 0,

        /**
         * @type {Number}
         */
        weight: 0,

        /**
         * @type {Boolean}
         */
        leaf: false,

        /**
         * @type {String}
         */
        text: '',

        /**
         * children node
         * @type {Array}
         */
        children: null,

        /**
         * is disabled
         * @type {Boolean}
         */
        disabled: false,

        iconCls: 'icon-application',

        /**
         * constructor
         * @param {Object}   opt
         * @param {Function} nodeHandler
         * @constructor
         */
        private$tree: function(opt, nodeHandler) {
            Jsx.extend(this, opt);

            this.text = this.name;
            var children = this.children = [];
            var id = this.id;
            var items = opt.children;

            for (var i = 0, l = items.length; i < l; i++)
                children.push(new private$tree(items[i], nodeHandler));

            this.leaf = (children.length == 0);
            this.listeners = { click: nodeHandler };
            //this.hidden = 
            this.disabled = opt.weight > 2;
        },

        /**
         * query node by id
         * @param  {Number} id
         * @return {jsxdev.service.Project.private$tree}
         */
        find: function(id) {
            if (this.id === id)
                return this;

            var children = this.children;
            for (var i = 0, l = children.length; i < l; i++) {
                var node = children[i].find(id);
                if (node)
                    return node;
            }
            return null;
        },

        /**
         * @return {Array}
         */
        getTags: function() {
            return getNodes(this, 1);
        },

        /**
         * @return {Array}
         */
        getBranchs: function() {
            return getNodes(this, 0);
        }
    });

    /**
     * @class jsxdev.view.Default
     * @extends Object
     * @createTime 2012-01-28
     * @updateTime 2012-01-28
     * @author www.mooogame.com, Simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     */

    //*******left tree start
    //show info project
    function loadProjectTree(_this, item, initBranchId) {

        if (item) {
            var sp = _this.selectedProject;
            if (sp && sp.id === item.id)
                return;
        }
        else
            item = _this.selectedProject;

        project.call('getTree', [item.id], function(err, data) {

            if (err)
                return Ext.Msg.error('', err.message);

            var treeData = new private$tree(data, nodeHandler);
            var initBranch = initBranchId && treeData.find(initBranchId);

            var root = {
                text: treeData.name,
                draggable: false,
                expanded: true,
                children: [
                    { text: 'tags', children: treeData.getTags() },
                    { text: 'branchs', children: treeData.getBranchs() },
                    Jsx.extend(Jsx.extend({}, treeData), { children: [], leaf: true, text: 'trunk' }),
                    { text: 'wiki', leaf: true, listeners: { click: wikiNodeHandler }, iconCls: 'icon-wiki' }
                ]
            };

            var items = _this.left.items.items;
            var tree = items[0].items.items[0];
            tree.setRootNode(root);
            tree.expandAll();
            tree.collapseAll();

            items[0].show();
            _this.left.syncSize();
            _this.selectedProject = treeData;

            selectNode(_this, initBranch || treeData);
        });
    }

    function selectNode(_this, data) {

        var sb = _this.selectedNode;
        if (sb && sb.id === data.id)
            return;

        var panel = _this.left.items.items[0].items.items[1].items.items[0];
        var tree = _this.left.items.items[0].items.items[0];
        if (data.weight > 2) {
            panel.hide();
            _this.selectedNode = null;
            tree.root.expand();
            return;
        }

        panel.show();
        _this.selectedNode = data;

        var node = tree.root.findChild('id', data.id, true);
        //select tree node
        if (node) {
            node.select();
            tree.expandPath(node.parentNode.getPath());
        }

        var branch = _this.selectedNode;
        var name = _this.selectedProject.name;
        var branchName = branch.name;

        if (name == branchName)
            name += ' / Trunk';
        else
            name += ' / ' + (branch.tag ? 'Tag' : 'Branch') + ' / ' + branchName;

        Ext.get('project-title').dom.innerHTML = name;
        Ext.get('project-info').dom.innerHTML = branch.info;

        //setting Set user permissions show
        var items = _this.left.items.items[0].items.items[1].items.items[0].items.items[0].items.items;
        for (var i = 0, l = items.length; i < l; i++)
            items[i].enable();

        var menu = items[2].menu.items.items;
        for (var i = 0, l = menu.length; i < l; i++)
            menu[i].enable();

        if (data.weight) {
            items[1].disable();
            menu[0].disable();
            menu[3].disable();
            menu[5].disable();
            menu[7].disable();
        }

        var trunk = _this.selectedProject;
        menu[trunk.id === data.id ? 5 : 3].disable();

        if (data.tag) {
            menu[2].disable();
            menu[5].disable();
        }

        if ((node.parentNode.attributes.data || trunk).weight)
            menu[5].disable();
    }

    function nodeHandler(e) {
        selectNode(INSTANCE, e.attributes);
    }

    function wikiNodeHandler() {
        Ext.Msg.info('', 'Functional are being development, so stay tuned');
    }
    //*******left tree end


    //*******project action end
    //post project
    function postProject(_this, node) {

        var title = 'Setting Project';
        var btn = 'Save';
        var callName = 'setProject';
        if (!node) {
            node = {};
            title = 'Create New Project';
            btn = 'Create';
            callName = 'createNew';
        }

        Ext.QuickTips.init();

        var loading;
        var w = new Ext.Window({
            title: title,
            resizable: false,
            width: 750,
            height: 420,
            modal: true,
            border: false,
            items: {
                xtype: 'form',
                labelAlign: 'top',
                frame: true,
                bodyStyle: 'padding:15px 0 0 18px',
                defaults: { anchor: '96%', msgTarget: 'side' },
                items: [
                    {
                        anchor: '100%',
                        layout: 'column',
                        items: [
                            {
                                columnWidth: .6,
                                layout: 'form',
                                items: [
                                    {
                                        xtype: 'textfield',
                                        fieldLabel: 'Project Name',
                                        value: node.name,
                                        name: 'name',
                                        allowBlank: false,
                                        anchor: '95%'
                                    }, {
                                        xtype: 'textfield',
                                        fieldLabel: 'Company',
                                        value: node.company,
                                        name: 'company',
                                        allowBlank: false,
                                        anchor: '95%'
                                    }
                                ]
                            }, {
                                columnWidth: .4,
                                layout: 'form',
                                items: [
                                    {
                                        xtype: 'textfield',
                                        fieldLabel: 'Email',
                                        value: node.email,
                                        name: 'email',
                                        vtype: 'email',
                                        allowBlank: false,
                                        anchor: '95%'
                                    }, {
                                        xtype: 'textfield',
                                        fieldLabel: 'MSN',
                                        value: node.msn,
                                        name: 'msn',
                                        vtype: 'email',
                                        allowBlank: false,
                                        anchor: '95%'
                                    }
                                ]
                            }
                        ]
                    }, {
                        xtype: 'textarea',
                        name: 'info',
                        value: node.info,
                        fieldLabel: 'Info',
                        height: 200,
                        allowBlank: false,
                        anchor: '98%'
                    }
                ],
                buttons: [
                    {
                        text: btn,
                        handler: function() {
                            var form = w.items.items[0].getForm();
                            var values = form.getValues();

                            if (!form.isValid())
                                return;

                            loading.show();
                            var param = [values.name, values.info, values.company, values.email, values.msn];
                            if (node.id)
                                param.unshift(node.id);

                            project.call(callName, param, function(err, data) {
                                loading.hide();

                                if (err)
                                    return Ext.Msg.error('', err.message);

                                loadPaojectList(_this, data.insertId || node.id);
                                w.close();
                            });
                        }
                    }, {
                        text: 'Cancel',
                        handler: function() {
                            w.close();
                        }
                    }
                ]
            }
        });

        w.show();
        loading = new Ext.LoadMask(w.items.items[0].el);
    }

    //create new project
    function createNewProject(_this) {
        postProject(_this);
    }

    //setting
    function settingsProject(_this) {

        var node = _this.selectedNode;
        if (node.id === _this.selectedProject.id)
            return postProject(_this, node);

        postNode(_this, 'Setting', 'Save', 'setNode', null, node);
    }

    function postNode(_this, title, btn, callName, firstParam, node) {
        Ext.QuickTips.init();

        var items = [
            {
                xtype: 'textfield',
                fieldLabel: 'Name',
                name: 'name',
                allowBlank: false
            }, {
                xtype: 'textarea',
                name: 'info',
                fieldLabel: 'Info',
                height: 200,
                allowBlank: false
            }
        ];
        if (callName == 'setNode') {
            items[0].value = node.name;
            items[1].value = node.info;
        }
        var loading;
        var w = new Ext.Window({
            title: title,
            resizable: false,
            width: 600,
            height: 321,
            modal: true,
            border: false,
            items: {
                xtype: 'form',
                frame: true,
                labelWidth: 50,
                bodyStyle: 'padding:15px 0 0 18px',
                defaults: { anchor: '96%', msgTarget: 'side' },
                items: items,
                buttons: [
                    {
                        text: btn,
                        handler: function() {
                            var form = w.items.items[0].getForm();
                            var values = form.getValues();

                            if (!form.isValid())
                                return;
                            loading.show();

                            //top, parent, name, info, cb
                            var param = [node.id, values.name, values.info];
                            if (firstParam)
                                param.unshift(firstParam);

                            project.call(callName, param, function(err, data) {

                                loading.hide();
                                if (err)
                                    return Ext.Msg.error('Error', err.message);

                                _this.selectedNode = null;
                                loadProjectTree(_this, null, data.insertId || node.id);
                                w.close();
                            });
                        }
                    }, {
                        text: 'Cancel',
                        handler: function() {
                            w.close();
                        }
                    }
                ]
            }
        });

        w.show();
        loading = new Ext.LoadMask(w.items.items[0].el);
    }

    //create branch
    function createBranch(_this) {
        var branch = _this.selectedNode;
        postNode(_this, 'Create Branch', 'Create', 'createBranch', branch.top || branch.id, branch);
    }

    //create tag
    function createTag(_this) {

        var branch = _this.selectedNode;
        if (_this.selectedProject.id !== branch.id)
            return Ext.Msg.error('Error', 'The tag must be created in the trunk');
        postNode(_this, 'Create Tag', 'Create', 'createTag', null, branch);
    }

    //merged node
    function mergedNode(_this) {

        Ext.Msg.info('', 'Functional are being development, so stay tuned');
    }

    //remove project
    function removeProject(_this) {
        if (!_this.selectedProject)
            return Ext.Msg.error(' ', 'Select an item to delete in the right!');

        Ext.Msg.warning('Warning',
        'Deleted can not restore itself.<br/>' +
        'If you want to restore the project, please contact the project administrator.<br/>' +
        'Really want to delete?', { ok: 'Ok', cancel: 'Cancel' },
        function(e) {
            if (e != 'ok')
                return;
            var id = _this.selectedProject.id;

            project.call('remove', [id, false], function(err, data) {

                if (err) {
                    if (err.message != '001')
                        return Ext.Msg.error('', err.message);
                }
                else
                    return loadPaojectList(_this);

                Ext.Msg.warning('Warning',
                'You are the sole administrator of the project.<br/>' +
                'Once deleted all users will not be allowed to the use of the project<br/>' +
                'and can not be recovered.<br/>' +
                'Really want to delete?', { ok: 'Ok', cancel: 'Cancel' },
                function(e) {
                    if (e != 'ok')
                        return;
                    project.call('remove', [id, true], function(err) {
                        if (err)
                            return Ext.Msg.error('', err.message);
                        loadPaojectList(_this);
                    });
                });
            });
        });
    }

    //remove project node
    function removeNode(_this) {
        var selectedProject = _this.selectedProject;
        var node = _this.selectedNode;

        if (!node)
            return Ext.Msg.error('', 'Select an node to delete in the left!');

        var msg =
                'Once deleted all users will not be allowed to the use of the branch or tag<br/>' +
                'and can not be recovered.<br/>' +
                'Really want to delete?';

        var rmTrunk = node.id === selectedProject.id;
        if (rmTrunk) { //delete trunk
            msg =
                'Once deleted all users will not be allowed to the use of the project<br/>' +
                'and can not be recovered.<br/>' +
                'Really want to delete trunk?';
        }

        Ext.Msg.warning('Warning', msg, { ok: 'Ok', cancel: 'Cancel' }, function(e) {
            if (e != 'ok')
                return;
            project.call('removeNode', [node.id], function(err) {
                if (err)
                    return Ext.Msg.error('', err.message);

                //select tree node
                var tree = _this.left.items.items[0].items.items[0];
                var _node = tree.root.findChild('id', node.id, true);
                var att = (_node.nextSibling || _node.previousSibling || _node.parentNode).attributes;

                rmTrunk ? loadPaojectList(_this) : loadProjectTree(_this, null, att.id);
            });
        });
    }

    function setUserPermissions(_this) {
        Ext.QuickTips.init();

        var node = _this.selectedNode;
        var weights = [
            { weight: 0, info: 'read,write,all' },
            { weight: 1, info: 'read,write' },
            { weight: 2, info: 'read' }
        ];

        var w = new Ext.Window({
            title: 'Setting User Permissions',
            resizable: false,
            width: 400,
            height: 500,
            modal: true,
            border: false
        });

        var grid = new Ext.grid.EditorGridPanel({
            frame: true,
            height: 470,
            enableColumnResize: false,
            store: {
                xtype: 'jsonstore',
                fields: ['uid', 'name', 'weight', 'inherit'],
                writer: {
                    xtype: 'jsonwriter',
                    encode: true,
                    writeAllFields: true
                },
                autoSave: false
            },
            autoExpandColumn: 'name',
            tbar: [{
                text: 'Add',
                iconCls: 'icon-drop-add',
                handler: function(btn, ev) {
                    var u = new grid.store.recordType({
                        name: '(NULL)',
                        weight: 2,
                        inherit: false
                    });

                    grid.stopEditing();
                    grid.store.insert(0, u);
                    grid.startEditing(0, 0);
                }
            }, '-', {
                text: 'Delete',
                iconCls: 'icon-delete',
                handler: function() {
                    var index = grid.getSelectionModel().getSelectedCell();
                    if (!index)
                        return;

                    var rec = grid.store.getAt(index[0]);
                    if (!rec.data.inherit)
                        grid.store.remove(rec);
                }
            }, '-'],
            columns: [
                { id: 'name', sortable: true, header: 'UserNmae', dataIndex: 'name',
                    editor: {
                        xtype: 'combo',
                        typeAhead: true,
                        triggerAction: 'all',
                        minChars: 1,
                        submitValue: true,
                        queryParam: 'args',
                        hiddenName: 'name',
                        valueField: 'name',
                        displayField: 'name',
                        selectOnFocus: true,
                        hideTrigger: true,
                        store: {
                            xtype: 'jsonstore',
                            fields: ['id', 'name'],
                            url: Jsx.format('?method=jsxdev.service.User.search'),
                            listeners: {
                                beforeload: function(e) {
                                    e.baseParams.args = JSON.stringify([e.baseParams.args]);
                                }
                            }
                        }
                    },
                    renderer: function(e, b, c) {
                        if (c.data.inherit)
                            b.style += 'background:#ddd;color:#666';
                        return e;
                    }
                }, {
                    header: 'Weight', sortable: true, dataIndex: 'weight', width: 110,
                    editor: {
                        xtype: 'combo',
                        typeAhead: true,
                        triggerAction: 'all',
                        mode: 'local',
                        store: {
                            xtype: 'jsonstore',
                            fields: ['weight', 'info'],
                            data: weights
                        },
                        valueField: 'weight',
                        displayField: 'info',
                        selectOnFocus: true
                    },
                    renderer: function(e, b, c) {
                        if (c.data.inherit)
                            b.style += 'background:#ddd;color:#666';
                        return weights[weights.propertyIndexOf('weight', e)].info;
                    }
                },
                { 
                    header: 'Inherit', sortable: true, dataIndex: 'inherit', width: 60,
                    renderer: function(e, b, c) {
                        if (c.data.inherit)
                            b.style += 'background:#ddd;color:#666';
                        return e;
                    }
                }
            ],

            listeners: {
                beforeedit: function(e) {
                    if (!e.column && e.record.json)
                        return false;
                    return !e.record.data.inherit;
                }
            },
            stripeRows: true,
            buttons: [
                { text: 'Save', handler: save },
                { text: 'Cancel', scope: w, handler: w.close }
            ]
        });

        w.add(grid);
        w.show();
        var loading = new Ext.LoadMask(w.items.items[0].el);
        var odata = [];

        project.call('getNodeWeights', [node.id], function(err, e) {
            if (err)
                return Ext.Msg.error('', err.message);

            grid.store.loadData(e);
            for (var i = 0, l = e.length; i < l; i++) {
                var item = e[i];
                if (!item.inherit)
                    odata.push(item);
            }
        });

        function save() {

            var items = grid.store.data.items;
            var data = [];
            var update = [];
            var del = [];
            var add = [];

            for (var i = 0, l = items.length; i < l; i++) {

                var item = items[i].data;
                if (item.inherit)
                    continue;

                var uid = item.uid;
                var oitem = odata[odata.propertyIndexOf('uid', uid)];

                if (oitem) { //is update data
                    if (oitem.weight !== item.weight)
                        update.push({ pid: node.id, uid: uid, weight: item.weight });
                    data.push(item);
                }
                else { //new data

                    if (item.name &&
                        item.name != '(NULL)' &&
                        odata.propertyIndexOf('name', item.name) === -1 &&
                        add.propertyIndexOf('name', item.name) === -1) {
                        add.push({ pid: node.id, name: item.name, weight: item.weight });
                    }
                    else
                        return Ext.Msg.error('', 'Duplicate records and invalid records');
                    //else //authentication is not passed ,discard
                }
            }

            for (var i = odata.length - 1; i > -1; i--) {
                var oitem = odata[i];
                var uid = oitem.uid;
                if (data.propertyIndexOf('uid', uid) === -1)
                    del.push({ pid: node.id, uid: uid });
            }

            if (add.length || update.length || del.length) {

                if (typeof node.top != 'number' && data.propertyIndexOf('weight', 0) === -1)
                    return Ext.Msg.error('', 'Can not be changed or deleted, this is the only project administrator');

                loading.show();
                project.call('setNodeWeights', [node.id, add, update, del], function(err) {
                    loading.hide();

                    if (err)
                        return Ext.Msg.error('', err.message);
                    w.close();
                    loadProjectTree(_this, _this.selectedProject, node.id);
                });
            }
            else
                w.close();
        }
    }

    function loadPaojectList(_this, initProjectId) {

        project.call('gets', function(err, data) {
            if (err)
                return Ext.Msg.error('', err.message);

            data.forEach(function(item){
                item._time = Date.parseDateTime(item.time).toString('yyyy/MM/dd');
            });

            //_this.right.items.items[0].store.loadData(data);
            _this._grid.store.loadData(data);
            _this.left.items.items[0].hide();
            _this.selectedProject = null;
            _this.selectedNode = null;

            if (typeof initProjectId != 'number')
                return;

            var index = data.propertyIndexOf('id', initProjectId);
            if (index !== -1)
                loadProjectTree(_this, data[index]);
        });
    }
    //project action end

    // init
    function init(_this) {

        Ext.state.Manager.setProvider(new Ext.state.CookieProvider());
        Ext.QuickTips.init();

        _this.left = new Ext.Panel({
            region: 'center',
            layout: 'border',
            margins: '0 0 5 5',
            tbar: [
                {
                    iconCls: 'icon-expand-all',
                    tooltip: 'Expand All',
                    handler: function() {
                        _this.left.items.items[0].items.items[0].expandAll();
                    }
                },
                '-',
                {
                    iconCls: 'icon-collapse-all',
                    tooltip: 'Collapse All',
                    handler: function() {
                        _this.left.items.items[0].items.items[0].collapseAll();
                    }
                },
                '->',
                { iconCls: 'icon-drop-add', text: 'Add Project', handler: createNewProject.bind(null, _this) }
            ],
            items: {
                hidden: true,
                layout: 'border',
                region: 'center',
                border: false,
                items: [
                    {
                        xtype: 'treepanel',
                        id: 'defaultTreePanel',
                        region: 'west',
                        width: 225,
                        split: true,
                        minSize: 0,
                        maxSize: 1500,

                        useArrows: false,
                        autoScroll: true,
                        animate: false,
                        enableDD: false,
                        containerScroll: true,
                        border: false,
                        //tbar: [],
                        root: {}
                    }, {
                        region: 'center',
                        border: false,
                        items: {
                            border: false,
                            items: [
                                {
                                    width: 150,
                                    border: false,
                                    style: 'float:left;margin-top:35px;',
                                    items: [
                                        {
                                            xtype: 'button', text: 'Start Project', style: 'margin:15px', width: 120,
                                            handler: function() {
                                                try {
                                                    project.call('openNode', [_this.selectedNode.id]);
                                                    global.open('/develop', 'id', 'fullscreen=yes,status=no,menubar=no,scrollbars=no,resizable=yes,toolbar=no,location=no');
                                                } catch (err) {
                                                    Ext.Msg.error('', err.message);
                                                }
                                            }
                                        },
                                        { xtype: 'button', text: 'Settings', style: 'margin:15px', width: 120, handler: settingsProject.bind(null, _this) },
                                        { xtype: 'button', text: 'More..', style: 'margin:15px', width: 120,
                                            menu: [
                                                { text: 'Setting user permissions', handler: setUserPermissions.bind(null, _this) },
                                                '-',
                                                { text: 'Create a new branch', handler: createBranch.bind(null, _this) },
                                                { text: 'Create a new tag', handler: createTag.bind(null, _this) },
                                                '-',
                                                { text: 'Merged into the parent node', handler: mergedNode.bind(null, _this) },
                                                '-',
                                                { text: 'Permanently delete the node', handler: removeNode.bind(null, _this) },
                                                { text: 'Exclude from my project', handler: removeProject.bind(null, _this) }
                                            ]
                                        }
                                    ]
                                },
                                { xtype: 'component', contentEl: 'content-div' }
                            ]
                        }
                    }
                ],
                listeners: {
                    hide: function() {
                        _this.left.items.items[0].items.items[1].items.items[0].hide();
                    }
                }
            }
        });

        _this.right = new Ext.TabPanel({
            id: 'defaultTools',
            activeTab: 0,
            region: 'east',
            width: 225,
            margins: '0 0 5 0',
            split: true,
            minSize: 0,
            maxSize: 1500,
            animCollapse: true,
            collapseMode: 'mini',

            items: {
                title: 'MyProjects',
                xtype: 'grid',
                store: { xtype: 'jsonstore', fields: ['name', '_time'/*, { name: 'time', type: 'date'}*/] },
                autoExpandColumn: 'name',
                columns: [
                    { id: 'name', sortable: true, header: 'Nmae', dataIndex: 'name' },
                    { id: 'time', sortable: true, header: 'Time', dataIndex: '_time'/*, renderer: Ext.util.Format.dateRenderer('Y/m/d')*/, width: 82 }
                ],
                stripeRows: true,
                listeners: {
                    rowclick: function(e, index) {
                        
                        loadProjectTree(_this, this.store.data.items[index].json);
                    }
                }
            }
        });
        
        _this._grid = _this.right.items.items[0];

        _this.viewport = new Ext.Viewport({
            layout: 'border',
            items: [
                {
                    xtype: 'toolbar',
                    region: 'north',
                    height: 26,
                    margins: '0 0 2 0',
                    items: [
                        '<b>JsxDEV</b>',
                        '->',
                        {
                            text: 'Logout',
                            handler: function() {
                                user.call('logout');
                                location.href = '/login';
                            }
                        }
                    ]
                },
                _this.left,
                _this.right
            ]
        });

        _this.loading = new Ext.LoadMask(_this.viewport.el);
        loadPaojectList(_this);
    }


    Class('jsxdev.Start', null, {

        _grid: null,

        /**
         * current select of project branch
         * @type {Object}
         */
        selectedNode: null,

        /**
         * current select of project
         * @type {Object}
         */
        selectedProject: null,

        /**
         * current user data
         * @type {Object}
         */
        user: null,

        /**
         * loading
         * @type {Ext.LoadMask}
         */
        loading: null,

        /**
         * viewport
         * @type {Ext.Viewport}
         */
        viewport: null,

        /**
         * left tab panel
         * @type {Ext.TabPanel}
         */
        left: null,

        /**
         * right tab panel
         * @type {Ext.TabPanel}
         */
        right: null,

        /**
         * constructor function
         * @constructor
         */
        Start: function() {

            var _this = this;

            user.call('getCurrentUser', function(err, data) {
                if (data)
                    return init(_this);
                location.href = '/login';
            })
        }

    });

    INSTANCE = new jsxdev.Start();
});