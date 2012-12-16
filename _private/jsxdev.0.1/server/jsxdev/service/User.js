/**
 * @class jsxdev.service.User
 * @extends Jsx.web.service.HttpService
 * @createTime 2012-01-23
 * @updateTime 2012-01-23
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/db/SqlMap.js');
include('Jsx/web/service/HttpService.js');
include('Jsx/Config.js');
include('node/fsx.js');
include('jsxdev/Util.js');

define(function() {
    var dao = Jsx.db.SqlMap.get();
    var crypto = require('crypto');
    var fsx = node.fsx;
    var Util = jsxdev.Util;
    var LOGIN = {};
    var SESSION_TOKEN_NAEM = 'SESSION_TOKEN_NAEM';
    var PASSWD = 'passwd^&*$#_09877';

    function coded_pd(pd) {
        return crypto.createHash('md5').update(pd).digest('hex');
    }
    
    function getUserAlias() {
        return workspace + crypto.createHash('md5').update(PASSWD + new Date() + Jsx.guid()).digest('hex') + '/';
    }


    function reg(name, passwd, email, cb) {

        if (!name){
            return cb('name not empty');
        }

        dao.get('jsxdev.dao.User.getUserByNameAndEmail', { name: name, email: email }, function(err, data) {

            if (data){
                return cb((data.name == name ? 'user name': 'email') + ' is already registered');
            }

            var map = {
                name: name,
                email: email,
                alias: getUserAlias(),
                password: coded_pd(passwd),
                disable: false,
                time: new Date(),
                code: Jsx.guid()
            };

            dao.post('jsxdev.dao.User.new', map, function(err, data) {
                cb(err, data);
                //create user dir
                if (!err) {
                    fsx.mkdir(jsxdev.MyServer.get().user + data.insertId);
                }
            });
        });
    }

    function login(name, passwd, cb) {

        var name = name.toLowerCase();

        dao.get('jsxdev.dao.User.get', { name: name, password: coded_pd(passwd) }, function(err, data) {

            if (data) {
                if (data.disable) {
                    err = 'user is disabled';
                }
                else {
                    delete LOGIN[LOGIN[name]];
                    var token = Jsx.guid();
                    data.token = token;
                    data.logTime = new Date();
                    delete data.password;
                    LOGIN[token] = data;
                    LOGIN[name] = token;
                }
            }
            else if (!err) {
                err = 'user name or password is incorrect';
            }

            cb(err, data);
        });
    }

    function logout(token, cb) {
        var user = LOGIN[token];
        if (user) {
            delete LOGIN[user.name];
            delete LOGIN[token];
        }
        cb();
    }

    function getLoginUser(token, cb) {
        cb(null, LOGIN[token] || null);
    }

    function getAllLoginUser(cb) {
        var ls = [];
        for(var i in LOGIN){
            var item = LOGIN[i];
            if(typeof item == 'object'){
                ls.push(item);
            }
        }
        cb(null, ls);
    }

    Class('jsxdev.service.User', Jsx.web.service.HttpService, {

        /**
         * get login user
         * @param {Function} cb     (Optional)
         */
        getCurrentUser: function(cb) {
            getLoginUser(this.session.get(SESSION_TOKEN_NAEM), cb);
        },

        /**
         * login
         * @param {String}   name
         * @param {String}   passwd
         * @param {String}   verification
         * @param {Function} cb    (Optional)
         */
        login: function(name, passwd, verification, cb) {
            var _this = this;
            login(name, passwd, function(err, user){
                if(user){
                    _this.session.set(SESSION_TOKEN_NAEM, user.token);
                    Util.closeConnect(user.alias);
                    user = Jsx.extend({}, user);
                    delete user.alias;
                }
                cb(err, user);
            });
        },

        /**
         * logout 
         * @param {Function} cb      (Optional)
         */
        logout: function(cb) {
            
            var _this = this;
            this.getCurrentUser(function(err, user){
                if(user)
                    Util.closeConnect(user.alias);
            });

            logout(this.session.get(SESSION_TOKEN_NAEM), function(err, data) {
                _this.session.removeAll();
                cb(err, data);
            });
        },

        /**
         * register
         * @param {String}   name
         * @param {String}   passwd
         * @param {String}   email
         * @param {String}   verification
         * @param {Function} cb    (Optional)
         */
        register: function(name, passwd, email, verification, cb) {
            reg(name, passwd, email, cb);
        },

        /**
         * search user
         * @param {Number}   name    user name
         * @param {Function} cb
         * @static
         */
        search: function(name, cb) {
            if (!name) {
                return throwError('param not empty', cb);
            }
            dao.gets('jsxdev.dao.User.search', {
                name: '%' + name + '%'
            },
            cb);
        }

    }, {
        
        SESSION_TOKEN_NAEM: SESSION_TOKEN_NAEM,

        /**
         * loing
         * @param {String}   name
         * @param {String}   passwd
         * @param {Function} cb (Optional)
         * @static
         */
        login: login,

        /**
         * logout
         * @param {Number}   token
         * @param {Function} cb (Optional)
         * @static
         */
        logout: logout,

        /**
         * get login user
         * @param {Number}   token  token
         * @param {Function} cb
         * @static
         */
        getLoginUser: getLoginUser,

        /**
         * get all login user
         * @param {Function} cb
         */
        getAllLoginUser: getAllLoginUser

    });
});