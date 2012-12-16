/**
 * @class Jsx.io.HttpDataSource   http data source
 * @extends Jsx.io.DataSource
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/io/DataSource.js');
include('Jsx/io/HttpService.js');

define(function() {

    Class('Jsx.io.HttpDataSource', Jsx.io.DataSource, {

        //public:
        /**
         * data souect name
         * @type {String}
         */
        get name() {
            return this.service.name;
        },

        /**
         * data souect name
         * @type {String}
         */
        set name(val) {
            this.service.name = val;
        },

        /**
         * query name
         * @type {String}
         */
        loadName: 'load',

        /**
         * query name
         * @type {String}
         */
        syncName: 'sync',

        /**
         * Jsx.io.HttpService
         * @type {Jsx.io.HttpService} 
         */
        service: null,

        /**
         * constructor function
         * @param {String} name (Optional) data souect name
         * @constructor
         */
        HttpDataSource: function(name) {
            this.DataSource();
            this.service = new Jsx.io.HttpService(name);
        },
        
        load: function(param) {
            param = Jsx.extend(this.param, param);
            if(!this.onbeforeload.emit(param)) 
                return;
            var _this = this;
            
            this.service.call(this.loadName, param, function(err, data) {
                data = _this.dataResult(data);
                _this.onload.emit(data);
            });
        },
        
        sync: function() {
            var _this = this;
            var identifier = this.identifier;
            var syncData = this.syncData;
            var insert = syncData.insert;
            var update = syncData.update;
            var deleted = syncData.deleted.map(function(item) { 
                return item[identifier];
            });
            
            if(!insert.length && !update.length && !deleted.length) 
                return;
                
            if(!this.onbeforesync.emit()) 
                return;

            var ls = this.data;
            var param = {
                insert: insert,
                update: update,
                'delete': deleted
            };
            
            this.service.call(this.syncName, param, function(err, data) {
                if(err)
                    return _this.onerror.emit(err);
                
                data.insert.forEach(function(id, index) { 
                    var item = insert[index];
                    item[identifier] = id;
                    ls.push(item);
                });
                
                data['delete'].forEach(function(id) { 
                    var index = ls.propertyIndexOf(identifier, id);
                    ls.splice(index, 1);
                });
                
                data.update.forEach(function(id, index) { 
                    var index = ls.propertyIndexOf(identifier, id);
                    ls.splice(index, 1, update[index]);
                });
                
                _this.onsync.emit();
            });
        }

    });

});