/**
 * @class node.fsx
 * @extends Object
 * @createTime 2012-02-08
 * @updateTime 2012-02-08
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('node/fs.js');
include('node/path.js');

define(function() {
    var _path = node.path;
    var mkdir = node.fs.mkdir;
    var chmod = node.fs.chmod;
    var chown = node.fs.chown;

    //**
    //* copy all file sync
    //* @param {String}   path
    //* @param {String}   target  target file
    //* @param {Function} cb   (Optional) 
    //*/
    function cp(path, target, cb) {

        var read = fsx.createReadStream(path);
        var write = fsx.createWriteStream(target);

        function error(e) {
            read.destroy();
            write.destroy();
            console.error(e);
            throwError(e, cb);
        }

        read.on('data', function(buff) {
            write.write(buff);
        });
        read.on('end', function() {
            write.end();
            cb && cb();
        });
        read.on('error', error);
        write.on('error', error);
    }
    
    //
    var fsx =

    Class('node.fsx', null, null, Jsx.extend(Jsx.extend({}, node.fs), {

        /**
         * set user and file
         * @param {String}   path
         * @param {Number}   uid
         * @param {Number}   gid
         * @param {Function} cb    (Optional)
         * @param {Boolean}  depth (Optional) default true
         */
        chown: function(path, uid, gid, cb, depth) {

            if(depth === false){
                return chown(path, uid, gid, cb);
            }
            path = _path.resolve(path);
            
            chown(path, uid, gid, function(path, _cb){
                var callee = arguments.callee;
                
                fsx.stat(path, function(stat) {
                    
                    if (!stat.isDirectory()){
                        return _cb();
                    }
                    
                    var dir = $f(path.replace(/\/?$/, '/'));
                    
                    fsx.readdir(dir, function(ls){
                        
                        if(!ls.length){
                            return _cb();
                        }
                        path = dir + ls.shift();
                        chown(path, uid, gid, callee.cb(cb, path, arguments.callee.cb(cb, ls)));
                        
                    }.cb(cb));
                }.cb(cb));
            }.cb(cb, path, cb || Jsx.noop));
        },

        /**
         * set user file weight
         * @param {String}   path
         * @param {String}   mode
         * @param {Function} cb    (Optional)
         * @param {Boolean}  depth (Optional) default true
         */
        chmod: function(path, mode, cb, depth) {
            
            if(depth === false){
                return chmod(path, mode, cb);
            }
            path = _path.resolve(path);
            
            chmod(path, mode, function(path, _cb){
                var callee = arguments.callee;
                
                fsx.stat(path, function(stat) {
                    
                    if (!stat.isDirectory()){
                        return _cb();
                    }
                    
                    var dir = $f(path.replace(/\/?$/, '/'));
                    
                    fsx.readdir(dir, function(ls){
                        
                        if(!ls.length){
                            return _cb();
                        }
                        path = dir + ls.shift();
                        chmod(path, mode, callee.cb(cb, path, arguments.callee.cb(cb, ls)));
                        
                    }.cb(cb));
                }.cb(cb));
            }.cb(cb, path, cb || Jsx.noop));
        },

        /**
         * remove all file sync
         * @param {String}   path
         * @param {Function} cb   (Optional)
         */
        rm: function(path, cb) {

            fsx.stat(path, function(stat) {

                if (stat.isFile()){
                    return fsx.unlink(path, cb);
                }
                else if (!stat.isDirectory()){
                    return cb && cb();
                }

                //dir
                fsx.readdir(path, function(ls) {
                    if (!ls.length){
                        return fsx.rmdir(path, cb);
                    }
                    fsx.rm(path + '/' + ls.shift(), arguments.callee.cb(cb, ls));
                }.cb(cb));
            }.cb(cb));
        },

        /**
         * copy all file sync
         * @param {String}   path
         * @param {String}   target  target dir
         * @param {Function} cb   (Optional) 
         */
        cp: function(path, target, cb) {

            fsx.stat(path, function(stat) {

                var file = false;
                var dir = target = $f(_path.resolve(target));

                if (file = stat.isFile()){
                    dir = dir.match(/^(.+\/)([^\/]*)$/)[1];
                }
                else if (!stat.isDirectory()){
                    return cb && cb();
                }

                fsx.mkdir(dir, function() {
                    if (file){
                        return cp(path, target, cb);
                    }

                    target = target.replace(/\/?$/, '/');
                    path = path.replace(/\/?$/, '/');

                    fsx.readdir(path, function(ls) {

                        if (!ls.length){
                            return cb && cb();
                        }
                        var name = ls.shift();
                        fsx.cp(path + name, target + name, arguments.callee.cb(cb, ls));
                    }.cb(cb));
                }.cb(cb));
            }.cb(cb));
        },

        /**
         * create all file dir sync
         * @param {String}   path
         * @param {String}   mode  (Optional)
         * @param {Function} cb    (Optional) 
         */
        mkdir: function(path, mode, cb) {
            
            if(typeof mode == 'function'){
                cb = mode;
                mode = null;
            }

            path = $f(_path.resolve(path));
            _path.exists(path, function(exists) {
                if (exists){
                    return cb && cb();
                }

                var prefix = path.match(/^(\w+:)?\//)[0];
                var ls = path.substr(prefix.length).split('/');

                (function() {
                    var callee = arguments.callee;
                    if (!ls.length){
                        return cb && cb();
                    }

                    prefix += ls.shift() + '/';
                    _path.exists(prefix, function(exists) {
                        if (exists){
                            return callee();
                        }
                        mkdir(prefix, mode, callee.cb(cb));
                    });
                })();
            });
        },

        /**
         * get all dir or file info
         * @param {String}   path
         * @param {Function} cb
         * @param {Boolean}  depth (Optional) 
         */
        ls: function(path, cb, depth) {

            path = _path.resolve(path);
            
            fsx.stat(path, function(path, _depth, _cb, stat) {
                var callee = arguments.callee;
                stat.dir = stat.isDirectory();

                if (!stat.dir || !_depth){
                    return _cb(null, stat);
                }

                var cls = stat.children = [];
                var dir = $f(path.replace(/\/?$/, '/'));
                
                fsx.readdir(dir, function(ls) {
                    
                    if(!ls.length){
                        return _cb(null, stat);
                    }

                    var ls_callee = arguments.callee;
                    var name = ls.shift();
                    var i_path =  dir + name;
                    
                    fsx.stat(i_path, callee.cb(cb, i_path, depth, function(err, stat){
                        stat.name = name;
                        cls.push(stat);
                        ls_callee(ls);
                    }));
                }.cb(cb));
                
            }.cb(cb, path, true, function(err, stat){ cb(err, stat.children || null) }));
        }

    }));
});
