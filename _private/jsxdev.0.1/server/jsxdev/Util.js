/**
 * @class jsxdev.Util
 * @extends Object
 * @createTime 2012-03-03
 * @updateTime 2012-03-03
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('node/child_process.js');
include('Jsx/web/service/conversation/Conversation.js');
//include('jsxdev/Debug.js');

define(function() {
    
    var child_process = node.child_process;
    var Conversation = Jsx.web.service.conversation.Conversation;
    var TCP = process.binding('tcp_wrap').TCP;

    try{
        var UserNetAuth = process.binding('user_net_auth');
    }
    catch(e){ }
    
    var PORT_LIST = {};
    var MAX_LEASE = 3 * 24 * 60 * 60 * 1e3; //259200000 3d
    var SH_FILE_PATH = $f('jsxdev/Util.sh');

    function exec(cmd, args, cb){
        var ps = child_process.spawn(cmd, args);
        var out = [];
        var err = [];
        
        ps.stdout.on('data', function(data){
            out.push(data + '');
        });
        
        ps.stderr.on('data', function(data){
            err.push(data + '');
        });

        ps.on('exit', function(){
            (function(){
                var _err = err.join('\n') || null;
                var _out = out.join('\n') || null;
                if(_err)
                    console.error(_err);
                cb && cb(_err, _out);
            }.delay(1));
        });
    }
    
    function ports(name){
    
        var item = PORT_LIST[name];
        var time = new Date().valueOf();
        var verifyPort = Util.verifyPort;

        if (item) {
            var value = item.value;

            if (verifyPort(value[0]) && verifyPort(value[1])) {
                item.time = time;
                return item.value;
            }
        }

        var maxPort = 1025;
        var exclude = {};

        for (var i in PORT_LIST) {
            var item = PORT_LIST[i];
            var value = item.value;

            if (time - item.time > MAX_LEASE) { //expired

                item.time = time;
                if (verifyPort(value[0]) && verifyPort(value[1])) {

                    delete PORT_LIST[i];
                    PORT_LIST[name] = item;
                    return item.value;
                }
            }

            exclude[value[0]] = true;
            exclude[value[1]] = true;
        }

        for (; ; ) {
            if (maxPort >= 65530)
                return null;

            if(exclude[maxPort] || exclude[maxPort + 1]){
                maxPort += 2;
                continue;
            }

            var value = [maxPort++, maxPort++];
            var item = { value: value, time: time };

            if (!verifyPort(value[0]) || !verifyPort(value[1])) {
                PORT_LIST['' + Jsx.guid() + time] = item;
                continue;
            }
            PORT_LIST[name] = item;
            return value;
        }
    }

    var Util =

    Class('jsxdev.Util', null, null, {

        /**
         * verify port
         * @param  {Number}
         * @return {Boolean}
         * @static
         */
        verifyPort: function(port) {
            var handle = new TCP();

            handle.bind('0.0.0.0', port);
            var result = (handle.listen(128) == 0);
            handle.close();
            return result;
        },

        /**
         * get port list by username
         * @param  {String} name
         * @return {Number[]}
         * @static
         */
        ports: function(name) {
            var ls = ports(name);

            if(UserNetAuth) {
                UserNetAuth.add(name, ls[0], ls[1]); //添加用户端口
            }

            return ls;
        },

        /**
         * 创建用户组
         * @param {Number}   gid  组id
         * @param {Function} cb (Optional) 
         */
        groupadd: function (gid, cb){
            exec('sh', [SH_FILE_PATH, 0, gid], cb);
        },

        //删除用户组
        groupdel: function(gid, cb) {
            exec('sh', [SH_FILE_PATH, 1, gid], cb);
        },

        //添加用户
        useradd: function(name, gid, cb){
            exec('sh', [SH_FILE_PATH, 2, name, gid], cb);
        },

        //删除用户
        userdel: function(name, cb){
            exec('sh', [SH_FILE_PATH, 3, name], cb);
        },

        //清理本机用户状态、杀死进程、删除用户、删除用户端口
        clearUser: function(name, cb){
            // 1.断开用户socket
            // 2.杀死用户进程
            // 3.删除用户
            // 4.删除用户端口
            
            Util.closeConnect(name);
            
            if(UserNetAuth) {
                UserNetAuth.del(name);
            }
            exec('sh', [SH_FILE_PATH, 4, name], cb);
        },
        
        //关闭连接
        //_service 排除
        closeConnect:function(name){
            var all = Conversation.all();
            var Debug = Jsx.get('jsxdev.Debug');

            for(var token in all){
                var con = all[token];
                var service = con.service;
                if(service instanceof Debug && service.user.alias == name){
                    con.close();
                }
            }
        },

        //杀死用户的所有进程
        //登陆
        //启动项目
        kill: function(name, cb){
            exec('sh', [SH_FILE_PATH, 5, name], cb);
        },
        
        //自动清理死进程与会话
        autoClear: function(cb){
            //TODO?
            cb && cb();
        }
        
    });
});
