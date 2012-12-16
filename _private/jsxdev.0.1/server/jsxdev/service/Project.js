/**
 * @class jsxdev.service.Project
 * @extends Jsx.web.service.HttpService
 * @createTime 2012-01-25
 * @updateTime 2012-01-25
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/db/SqlMap.js');
include('Jsx/web/service/HttpService.js');
include('jsxdev/service/User.js');
include('jsxdev/Util.js');
include('node/fsx.js');
include('jsxdev/TreeNode.js');
include('node/crypto.js');

define(function() {
    var crypto = node.crypto;
    var dao = Jsx.db.SqlMap.get();
    var fsx = node.fsx;
    var TreeNode = jsxdev.TreeNode;
    var User = jsxdev.service.User;

    var PUBLIC_USER_NAME = 'everyone';
    var PUBLIC_USER_ID = -1;
    var OPEN_NODE_SESSION_NAME = 'OPEN_NODE_INFO';
    var PASSWD = 'passwd^&*$#'; //不能改动

    dao.get('jsxdev.dao.User.get', { name: PUBLIC_USER_NAME }, function(err, data) {
        if (data){
            Project.PUBLIC_USER_ID = PUBLIC_USER_ID = data.id;
        }
        else {
            console.error('no everyone user');
            //process.exit();
        }
    });

    function getRootdir(workspace, basedir) {
        return workspace + crypto.createHash('md5').update(PASSWD + basedir).digest('hex') + '/';
    }

    function createNode(_this, top, parent, tag, name, info, company, email, msn, cb) {
        var transaction = dao.transaction();
        var basedir = crypto.createHash('md5').update('' + new Date() + Jsx.guid()).digest('hex');

        transaction.post('jsxdev.dao.Project.new', {
            basedir: basedir,
            top: top,
            parent: parent,
            tag: tag,
            name: name,
            info: info,
            company: company,
            email: email,
            msn: msn,
            time: new Date()
        },
        function(err, data) {

            if (err){
                return transaction.rollback(), cb(err);
            }

            data.basedir = basedir;

            transaction.post('jsxdev.dao.ProjectRelation.new', {
                pid: data.insertId,
                uid: _this.user.id,
                weight: 0
            },
            function(err) {
                err ? transaction.rollback() : transaction.commit();
                cb(err, data);
            });
        });
    }

    function createNodeVerification(_this, top, parent, tag, name, info, company, email, msn, cb) {

        var args = Array.toArray(arguments);

        _this.getTree(parent, function(tree) {

            if (tree.find(parent).weight == 3){
                return cb('Error creating a branch, the operating authority is not enough');
            }

            args.splice(args.length - 1, 1, function(data) {
                data.tree = tree;
                data.rootdir = getRootdir(_this.server.workspace, tree.basedir);
                cb(null, data);
            }.cb(cb));
            createNode.apply(null, args);
        }.cb(cb));
    }

    function rmoveNode(_this, id, cb) {

        _this.getNode(id, function(err, node) {
            if (err){
                return cb(err);
            }

            if (node.weight){ //Remove insufficient permissions
                return cb('Can not be deleted, the operating authority is not enough');
            }
            dao.post('jsxdev.dao.Project.set', { ids: node.getIds(), del: true }, cb);
        });
    }

    var Project =

    Class('jsxdev.service.Project', Jsx.web.service.HttpService, {

        /**
         * user object    
         * @type {Object}
         */
        user: null,

        //overlay
        auth: function(cb) {
            var _this = this;

            User.getLoginUser(this.session.get(User.SESSION_TOKEN_NAEM), function(err, data) {
                if (!data){
                    _this.returnError('not logged in');
                }
                _this.user = data;
                cb(null, !!data);
            });
        },

        /**
         * get current project list
         * @param {Function} cb
         */
        gets: function(cb) {
            dao.gets('jsxdev.dao.Project.getProjectByUserID', 
            { uids: [this.user.id, PUBLIC_USER_ID] }, cb);
        },

        /**
         * get public project list
         * @param {String}   key
         * @param {Number}   index
         * @param {Number}   count
         * @param {Function} cb
         */
        getPublics: function(key, index, count, cb) {

            var map = { username: PUBLIC_USER_NAME };
            if (typeof key == 'string'){
                map.key = key;
            }

            dao.get('jsxdev.dao.Project.getProjectTotalByUserName', map,
            function(err, data) {
                if (err){
                    return cb(err);
                }

                var total = data.total;
                if (!total){
                    return cb(err, []);
                }

                if (typeof index == 'number' && typeof count == 'number') {
                    map.index = index;
                    map.count = count;
                }

                dao.gets('jsxdev.dao.Project.getProjectByUserName', map, function(err, data) {
                    if (err){
                        return cb(err);
                    }

                    data[0].dataTotalResult = total;
                    cb(err, data);
                });
            });
        },

        /**
         * create new project
         * @param {String}   name
         * @param {String}   info
         * @param {String}   company
         * @param {String}   email
         * @param {String}   msn
         * @param {Function} cb
         */
        createNew: function(name, info, company, email, msn, cb) {
            var _this = this;

            createNode(this, null, null, false, name, info, company, email, msn, function(err, data) {

                if (err){
                    return cb(err);
                }
                var rootdir = getRootdir(_this.server.workspace, data.basedir);

                //create project file root dir
                fsx.mkdir(rootdir, function() {
                    fsx.mkdir(rootdir + 'wiki');
                    fsx.mkdir(rootdir + 'backs');
                    fsx.mkdir(rootdir + 'tags');
                    fsx.mkdir(rootdir + 'branchs');
                    fsx.mkdir(rootdir + 'trunk', 
                        fsx.cp.cb(cb, _this.server.framework, rootdir + 'trunk/' + data.basedir, 
                            fsx.chown.cb(cb, rootdir, 0, data.insertId, 
                                fsx.chmod.cb(cb, rootdir, '771', 
                                    cb.cb(cb, null, data)
                                )
                            )
                        )
                    );
                });
            });
        },

        /**
         * create branch
         * @param {Number}   top    topId
         * @param {Number}   parent parentId
         * @param {String}   name
         * @param {String}   info
         * @param {Function} cb
         */
        createBranch: function(top, parent, name, info, cb) {
            var _this = this;

            createNodeVerification(_this, top, parent, false, name, info, null, null, null, function(data) {

                var id = data.insertId;
                var rootdir = data.rootdir;
                var trunk = 'trunk/' + data.tree.basedir;
                var branchs = 'branchs/' + data.tree.find(parent).basedir;
                var target = rootdir + 'branchs/' + data.basedir;

                fsx.cp(rootdir + (top === parent ? trunk: branchs), target, 
                    fsx.chown.cb(cb, target, 0, id, 
                        fsx.chmod.cb(cb, target, '770', 
                            cb.cb(cb, null, {insertId:id})
                        )
                    )
                );
            }.cb(cb));
        },

        /**
         * create tag
         * @param {Number}   top    topId
         * @param {String}   name
         * @param {String}   info
         * @param {Function} cb
         */
        createTag: function(top, name, info, cb) {
            var _this = this;

            createNodeVerification(_this, top, top, true, name, info, null, null, null, function(data) {
                
                var id = data.insertId;
                var rootdir = data.rootdir;
                var target = rootdir + 'tags/' + data.basedir;

                fsx.cp(rootdir + 'trunk/' + data.tree.basedir, target,
                    fsx.chown.cb(cb, target, 0, id, 
                        fsx.chmod.cb(cb, target, '770', 
                            cb.cb(cb, null, {insertId:id})
                        )
                    )
                );
            }.cb(cb));
        },

        /**
         * remove project 
         * @param {Number}    id
         * @param {Boolean}   enforce
         * @param {Function}  cb
         */
        remove: function(id, enforce, cb) {
            var _this = this;

            dao.gets('jsxdev.dao.ProjectRelation.get', { pid: id, weight: 0 }, function(err, data) {
                if (err){
                    return cb(err);
                }

                var uid = _this.user.id;
                if (data.length !== 1 || data[0].uid !== uid){ //Administrator only themselves
                    return dao.post('jsxdev.dao.ProjectRelation.rmAll', { pid: id, uid: uid }, cb);
                }

                if (!enforce){ //enforce del
                    return cb(new Error('001'));
                }

                rmoveNode(_this, id, function(err, data) {
                    if (err){
                        return cb(err);
                    }
                    dao.post('jsxdev.dao.ProjectRelation.rmAll', { pid: id }, cb);
                });
            });
        },

        /**
         * remove project node
         * @param {Number}   id
         * @param {Function} cb
         */
        removeNode: function(id, cb) {
            rmoveNode(this, id, cb);
        },

        /**
         * set project
         * @param {Number}   id
         * @param {String}   name
         * @param {String}   info
         * @param {String}   company
         * @param {String}   email
         * @param {String}   msn
         * @param {Function} cb
         */
        setProject: function(id, name, info, company, email, msn, cb) {
            this.getTree(id, function(err, tree) {
                if (err){
                    return cb(err);
                }
                if (tree.find(id).weight){
                    return cb('Can not be set, insufficient permissions');
                }
                dao.post('jsxdev.dao.Project.set', {
                    id: id,
                    name: name,
                    info: info,
                    company: company,
                    email: email,
                    msn: msn
                }, cb);
            });
        },

        /**
         * set node
         * @param {Number}   id
         * @param {String}   name
         * @param {String}   info
         * @param {Function} cb
         */
        setNode: function(id, name, info, cb) {
            this.getTree(id, function(tree) {
                if (tree.find(id).weight){
                    return cb('Can not be set, insufficient permissions');
                }
                dao.post('jsxdev.dao.Project.set', { id: id, name: name, info: info }, cb);
            }.cb(cb));
        },

        /**
         * set node weight table
         * @param {Number}   id    node id
         * @param {Array}    add
         * @param {Array}    set
         * @param {Array}    del
         * @param {Function} cb
         */
        setNodeWeights: function(id, add, set, del, cb) {
            var _this = this;

            this.getTree(id, function(tree) {
                
                if (tree.find(id).weight){
                    return cb('Can not be set, insufficient permissions');
                }

                var transaction = dao.transaction();
                var j = 0;

                function handler(err, data) {
                    if (err) {
                        transaction.rollback();
                        return cb(err);
                    }
                    if (!--j) {
                        transaction.commit();
                        cb();
                    }
                }

                var items = {
                    'newByUserName': add,
                    'set': set,
                    'rm': del
                }

                for (var cmd in items) {

                    var item = items[cmd];
                    for (var i = 0, l = item.length; i < l; i++, j++){
                        transaction.post('jsxdev.dao.ProjectRelation.' + cmd, item[i], handler);
                    }
                }
            }.cb(cb));

        },

        /**
         * get node weight table
         * @param {Number}   id
         * @param {Function} cb
         */
        getNodeWeights: function(id, cb) {
            var _this = this;
            var map = { id: id };

            dao.gets('jsxdev.dao.Project.getProjectNodes', map, function(data) {

                var tree = new TreeNode(null, data);

                dao.gets('jsxdev.dao.Project.getProjectWeights', map, function(data) {
                    var users = {};
                    var weights = [];

                    for (var i = 0, l = data.length; i < l; i++) {
                        var item = data[i];
                        var uid = item.uid;
                        var user = users[uid];
                        if (!user){
                            users[uid] = user = { name: item.name, id: item.uid, weight: {} };
                        }
                        user.weight[item.pid] = item.weight;
                    }

                    for (var i in users) {
                        var user = users[i];
                        var tr = tree.getNewTree(user.weight)
                        var node = tr.find(id);

                        if (node.weight < 3) {
                            weights.push({ name: user.name, uid: user.id, weight: node.weight, inherit: node.inherit });
                            var weight = user.weight[id];

                            if (node.inherit && typeof weight == 'number'){ //Add their own records
                                weights.push({ name: user.name, uid: user.id, weight: weight, inherit: false });
                            }
                        }
                    }

                    cb(null, weights);
                }.cb(cb));
            }.cb(cb));
        },

        /**
         * get project node tree info
         * @param {Number}   id
         * @param {Function} cb
         */
        getTree: function(id, cb) {
            var _this = this;

            dao.gets('jsxdev.dao.Project.getProjectNodes', {
                id: id,
                uids: [this.user.id, PUBLIC_USER_ID]
            },
            function(data) {
                if (!data.length){
                    return cb('Not find project or node information');
                }
                
                var tree = new TreeNode(null, data);
                //if (tree.find(id).weight == 3){
                //    return cb('No permission to view');
                //}

                cb(null, tree);
            }.cb(cb));
        },

        /**
         * get node tree 
         * @param {Number} id node id
         * @param {Function} cb
         */
        getNode: function(id, cb) {

            this.getTree(id, function(tree) {
                cb(null, tree.find(id));
            }.cb(cb));
        },

        /**
         * @param {Number}   id node id
         * @param {Function} cb  
         */
        openNode: function(id, cb) {
            var _this = this;

            this.getTree(id, function(tree) {
                _this.session.set(OPEN_NODE_SESSION_NAME, {id: id, tree: tree});
                jsxdev.Util.closeConnect(_this.user.alias);
                cb();
            }.cb(cb));
        }

    },
    {
        OPEN_NODE_SESSION_NAME: OPEN_NODE_SESSION_NAME,
        PUBLIC_USER_NAME: PUBLIC_USER_NAME,
        PUBLIC_USER_ID: PUBLIC_USER_ID,
        getRootdir: getRootdir
    });
});