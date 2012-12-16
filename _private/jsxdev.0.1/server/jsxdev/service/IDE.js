/**
 * @class jsxdev.service.IDE
 * @extends Jsx.web.service.HttpService
 * @createTime 2012-01-23
 * @updateTime 2012-01-23
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('node/fsx.js');
include('Jsx/Util.js');
include('Jsx/db/SqlMap.js');
include('Jsx/web/service/HttpService.js');
include('jsxdev/service/User.js');
include('jsxdev/service/Project.js');
include('jsxdev/Settings.js');
include('jsxdev/FileMap.js');

define(function() {
    var Project = jsxdev.service.Project;
    var Settings = jsxdev.Settings;
    var User = jsxdev.service.User;
    var FileMap = jsxdev.FileMap;
    var dao = Jsx.db.SqlMap.get();
    var fsx = node.fsx;

    function file_sort(a, b){
        a = a.text;
        b = b.text;
        var l = Math.max(a.length, b.length);
        for(var i = 0; i < l; i++) {
            var codea = (a.substr(i,1) || 'a').charCodeAt(0);
            var codeb = (b.substr(i,1) || 'a').charCodeAt(0);
            if(codea != codeb)
                return codea - codeb;
        }
        return 0;
    }

    function append_name(name, name1) {
        return name.replace(/(\.[^\.]+$|$)/, name1 + '$1');
    }

    function getAbsolutePath(_this, path) {

        var node = _this.node;
        var rootbasedir = _this.tree.basedir;
        var basedir = node.basedir;
        
        var rootdor = Project.getRootdir(_this.server.workspace, rootbasedir);
        var trunk = 'trunk/' + rootbasedir;
        var branchs = 'branchs/' + basedir;
        var tags = 'tags/' + basedir;
        
        var target = rootdor +
            (node.tag ? tags : node.top === null ? trunk : branchs) + '/' + (path || '');
        return target;
    }

    Class('jsxdev.service.IDE', Jsx.web.service.HttpService, {

        /**
         * current login user object
         * @type {Object}
         */
        user: null,

        /**
         * current open of project tree
         * @type {jsxdev.TreeNode}
         */
        tree: null,

        /**
         * current open of project node
         * @type {jsxdev.TreeNode}
         */
        node: null,

        /**
         * current open node
         * @type {Number}
         */
        id: 0,

        /**
         * @type {String}
         */
        rootPath: '',

        //overlay
        auth: function(cb, action) {
            var _this = this;

            User.getLoginUser(this.session.get(User.SESSION_TOKEN_NAEM), function(err, user) {

                if (!user) {
                    _this.returnError('Not logged in');
                    return cb(null, false);
                }

                var info = _this.session.get(Project.OPEN_NODE_SESSION_NAME);
                if (!info) {
                    _this.returnError('Not open the project node');
                    return cb(null, false);
                }

                _this.user = user;
                _this.id = info.id;
                _this.tree = info.tree;
                _this.node = info.tree.find(info.id);
                _this.rootPath = getAbsolutePath(_this);
                var form = _this.form;
                if(form){
                    form.isUpload = (action == 'uploadFile');
                }

                cb(null, true);
            });
        },

        /**
         * get project root resources list 
         * @param {String}   path
         * @param {Function} cb
         */
        getRootResources: function(cb) {

            var nodes = this.tree.finds(this.id);
            var node = nodes.desc(0);
            var weight = node.weight;
            nodes.shift();

            var path =
                this.tree.name + ' / ' +
                (node.tag ? 'tags' : node.top === null ? 'trunk' : 'branchs') +
                ' / ' + nodes.join(' / ');

            this.getResources('', function(data) {

                cb(null, {
                    allowDrop: true,
                    text: path,
                    draggable: false,
                    children: data,
                    expanded: true,
                    iconCls: 'icon-application'
                });
            } .cb(cb));
        },

        /**
         * get project resources list by path
         * @param {String}   path
         * @param {Function} cb
         */
        getResources: function(path, cb) {

            var isroot = !path;

            fsx.ls(this.rootPath + path, function(err, ls) {

                if (err)
                    return cb(err);
                var dir = [];
                var leaf = [];
                var rootdir = [];
                
                for (var i = 0, l = ls.length; i < l; i++) {
                    var item = ls[i];
                    var name = item.name;
                    var obj = { text: name };

                    if (/*name == FileMap.MAP_NAME || */name == Settings.SETTINGS_FILE_NAME || name.slice(0, 1) == '.')
                        continue;

                    if (!item.dir) {
                        obj.leaf = true;
                        var mat = name.match(/\.([^\.]+)$/);
                        if (mat)
                            obj.iconCls = 'icon-' + mat[1].replace(/\+/g, 'p').toLowerCase();
                        leaf.push(obj);
                    }
                    else {
                        if (isroot && /^(server|client)$/i.test(name)) {
                            obj.draggable = false;
                            server = obj;
                            rootdir.push(obj);
                        }
                        else
                            dir.push(obj);
                    }
                }

                cb(err, rootdir.sort(file_sort).concat(dir.sort(file_sort).concat(leaf.sort(file_sort))));
            });
        },

        /** 
         * read file as text
         * @param {String}   filename
         * @param {Function} cb
         */
        readFileAsText: function(filename, cb) {
            if(this.node.weight > 2)
                return cb('Insufficient permissions unable to read file');
        
            var _this = this;
            var root = this.rootPath;

            fsx.readFile(root + filename, function(err, buff) {
                if (err)
                    return cb(err);
                var value = Settings.get(root).getFileProperty(filename);

                cb(err, { code: buff + '', breakpoints: value.breakpoints, folds: value.folds });
            });
        },

        /** 
         * read file
         * @param {String}   filename
         * @param {Function} cb
         */
        readFile: function(filename, cb){
            if(this.node.weight > 2)
                return cb('Insufficient permissions unable to read file');

            this.returnFile(this.rootPath + filename);
        },

        /**
         * save text file
         * @param {String}    filename
         * @param {String}    code
         * @param {Number[]}  breakpoints
         * @param {Object}    folds
         * @param {Function}  cb
         */
        saveFileAsText: function(filename, code, breakpoints, folds, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions unable to write file');

            var root = this.rootPath;
            var abs = root + filename;

            fsx.stat(abs, function(err, stat) {
                if (err)
                    return cb(err);

                fsx.writeFile(abs, code, function(err) {
                    if (err)
                        return cb(err);

                    Settings.get(root).setFileProperty(filename, { breakpoints: breakpoints, folds: folds });
                    FileMap.get(root).set(filename, code, cb);
                });
            });
        },

        /**
         * @param {String}    filename
         * @param {Number}    row
         * @param {String}    action
         * @param {Function}  cb
         */
        setBreakpoints: function(filename, row, action, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');

            Settings.get(this.rootPath)[action + 'Breakpoints'](filename, row);
            cb();
        },

        /**
         * create directory
         * @param {String}    filename
         * @param {Function}  cb
         */
        createDirectory: function(filename, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');
                
            var path = this.rootPath + filename;
            
            fsx.mkdir(path, 
                fsx.chown.cb(cb, path, 0, this.id, 
                    fsx.chmod.cb(cb, path, '770', cb)
                )
            );
        },

        /**
         * create file
         * @param {String}    filename
         * @param {Function}  cb
         */
        createFile: function(filename, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');
                
            var _this = this;
            var abs = this.rootPath + filename;

            fsx.stat(abs, function(err, stat) {
                if (stat)
                    return cb('File already exists');
                fsx.writeFile(abs, '', 
                    fsx.chown.cb(cb, abs, 0, _this.id, 
                        fsx.chmod.cb(cb, abs, '770', cb)
                    )
                );
            });
        },

        /**
         * create directory or file
         * @param {String}    filename
         * @param {Function}  cb
         */
        removeFile: function(filename, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');

            var _this = this;
            var root = this.rootPath;

            fsx.rm(root + filename, function(err) {
                if (err)
                    return cb(err);
                Settings.get(root).removeFileProperty(filename);
                FileMap.get(root).remove(filename, cb);
            });
        },

        /**
         * rename directory or file
         * @param {String}    oldFilename
         * @param {String}    newFilename
         * @param {Function}  cb
         */
        renameFile: function(oldFilename, newFilename, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');

            var _this = this;
            var root = this.rootPath + '';

            fsx.rename(root + oldFilename, root + newFilename, function(err) {
                if (err)
                    return cb(err);
                Settings.get(root).renameFileProperty(oldFilename, newFilename);
                FileMap.get(root).rename(oldFilename, newFilename, cb);
            });
        },

        /**
         * clone directory or file
         * @param {String}    filename
         * @param {Function}  cb
         */
        cloneFile: function(filename, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');

            var _this = this;
            var root = this.rootPath + '';
            var newFilename = append_name(filename, '_' + Jsx.guid());
            var target = root + newFilename;

            fsx.cp(root + filename, target, function(err) {
                if (err)
                    return cb(err);
                FileMap.get(root).sets(newFilename, 
                    fsx.chown.cb(cb, target, 0, _this.id, 
                        fsx.chmod.cb(cb, target, '770', cb)
                    )
                );
            });
        },

        /**
         * @param {String}
         */
        uploadFile: function(dir) {
            if(this.node.weight > 1)
                return throwError('Insufficient permissions', returnErr);

            dir = dir.replace(/(.\/?$)/, '$1/');

            var _this = this;
            var root = this.rootPath;
            var fullDir = root + dir;
            var files = this.data.file;
            var map = FileMap.get(root);
            
            function returnErr(err) {
                _this.returnString('text/html', 'error'/*err.message*/);
            }

            function h() {

                if (!files.length)
                    return _this.returnString('text/html', 'ok');

                var file = files.shift();
                var filename = file.filename;
                var fullFilename = root + dir + filename;

                fsx.stat(fullFilename, function(err, stat) {
                    //if (stat)
                    //    filename = append_name(filename, '_' + Jsx.guid()); //重新命名
                    
                    fsx.rename(file.path, fullFilename, 
                        map.set.cb(map, returnErr, dir + filename, Jsx.guid() + '', 
                            fsx.chown.cb(returnErr, fullFilename, 0, _this.id, 
                                fsx.chmod.cb(returnErr, fullFilename, '770', h)
                            )
                        )
                    );
                });
            }
            h();
        },

        /**
         * Setting as startup
         * @param {String}   path
         * @param {Function} cb
         */
        setStartup: function(path, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');

            Settings.get(this.rootPath).set('startup', path);
            cb();
        },

        /**
         * get current info
         * @param {Function} cb
         */
        info: function(cb) {
            var user = Jsx.extend({}, this.user);
            delete user.alias;
            cb(null, { user: user, id: this.id, tree: this.tree, rootPath: this.rootPath });
        }

    });
});