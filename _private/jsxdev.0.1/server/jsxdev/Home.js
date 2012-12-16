/**
 * @class jsxdev.Home
 * @extends Jsx.web.Controller
 * @createTime 2012-01-23
 * @updateTime 2012-01-23
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/service/HttpService.js');
include('Jsx/web/service/conversation/Conversation.js');
include('Jsx/db/SqlMap.js');
include('node/crypto.js');
include('jsxdev/service/Project.js');
include('jsxdev/TreeNode.js');
include('jsxdev/Debug.js');

define(function() {
    var Conversation = Jsx.web.service.conversation.Conversation;
    var Debug = jsxdev.Debug;
    var dao = Jsx.db.SqlMap.get();
    var crypto = node.crypto;

    function auth(_this, token, cb) {
        var service;
        var cnv = Jsx.web.service.conversation.Conversation.get(token);

        if (!cnv || !(service = cnv.service))
            return cb('Can not find the source of target');

        var res = _this.response;
        var name = _this.data.name.toLowerCase();
        var md5 = crypto.createHash('md5').update(_this.data.passwd).digest('hex');

        dao.get('jsxdev.dao.User.get', { name: name, password: md5 }, function(err, data) {

            var uid;
            var id = service.id;
            if (data) {
                if (data.disable)
                    return cb('user is disabled');
                else
                    uid = data.id;
            }
            else return cb('user name or password is incorrect');

            //****
            dao.gets('jsxdev.dao.Project.getProjectNodes', {
                id: id,
                uids: [uid, jsxdev.service.Project.PUBLIC_USER_ID]
            },
            function(err, data) {
                if (err)
                    return err.message;
                if (!data.length)
                    return cb('Not find project or node information');

                var tree = new jsxdev.TreeNode(null, data);
                if (tree.find(id).weight === 3)
                    return cb('No permission to view');

                cb(null, service.globalAuthId);
            });
        });
    }

    Class('jsxdev.Home', Jsx.web.service.HttpService, {

        debugAuth: function(token, setUrl, gotoUrl) {

            var filename = '../client/auth.htm';

            if (this.request.method != 'POST')
                return this.returnFile($f(filename));
            var _this = this;

            auth(this, token, function(err, id) {
                if (err)
                    return _this.returnString(_this.server.getMIME('htm'),
                            '<script type="text/javascript">alert("' + err + '");history.back();</script>');

                var url = decodeURIComponent(setUrl) + '{0}/{1}'.format(id, gotoUrl);
                _this.redirect(url);
            });
        },
        
        router: function(name) {
            if(name.match(/^(develop|start|register|login)$/)){
                return this.returnFile($f('../client/' + name + '.htm'));
            }
            else{
                var all = Conversation.all();
                var user = name.toLowerCase();
    
                for(var token in all){
                    var con = all[token];
                    var service = con.service;
                    if(service instanceof Debug && user == service.user.name.toLowerCase()){
                        if(service.startup){
                            var go = 'http://' + this.request.headers.host + ':' + service.port[1] + '/';
                            return this.redirect(go);
                        }
                    }
                }
            }
            this.Jsx_web_service_StaticService_action();
        }

    });
});
