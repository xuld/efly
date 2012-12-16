/**
 * @class Jsx.io.DataSource data source base abstract class
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');

define(function () {

    var AUTO_SYNC_TIME = 200;

    function autoSync(_this) {

        if (!_this.autoSync)
            return;
        clearTimeout(_this._syncTime);
        _this._syncTime = _this.load.delay(_this, AUTO_SYNC_TIME);
    }

    function parseData(_this, data) {
        var fields = _this.fields;
        if (!fields)
            return data;
        var newData = [];

        data.forEach(function (item) {
            if (!Array.isArray(item))
                return newData.push(Jsx.filter(item, fields));

            var newItem = {};
            fields.forEach(function (field, index) {
                newItem[field] = item[index];
            });
            newData.push(newItem);
        });
        return newData;
    }

    Class('Jsx.io.DataSource', null, {

        //private:
        _syncTime: 0,

        //public:
        /**
         * @event onbeforeload
         */
        onbeforeload: null,

        /**
         * @event onload
         */
        onload: null,

        /**
         * @event onbeforesync
         */
        onbeforesync: null,

        /**
         * @event onsync
         */
        onsync: null,

        /**
         * @event onbeforeinserte
         */
        onbeforeinsert: null,

        /**
         * @event oninserte
         */
        oninsert: null,

        /**
         * @event onbeforeupdate
         */
        onbeforeupdate: null,

        /**
         * @event onupdate
         */
        onupdate: null,

        /**
         * @event onbeforedelete
         */
        onbeforedelete: null,

        /**
         * @event ondelete
         */
        ondelete: null,

        /**
         * @event onerror
         */
        onerror: null,

        /**
         * An inline data object readable by the reader. 
         * Typically this option, or the url option will be specified.
         * @type {Array}
         */
        data: null,
        
        /**
         * full data
         * @type {Object}
         */
        fullData: null,

        /**
         * Need to synchronize data
         * @type {Object}
         */
        syncData: null,

        /**
         * data total
         * @type {Number}
         */
        total: 0,

        /**
         * data fields
         * @type {String[]}
         */
        fields: null,

        /**
         * data total field
         * @type {String}
         */
        totalField: 'total',

        /**
         * data field
         * @type {String}
         */
        dataField: 'data',

        /**
         * Identifier
         * @type {String}
         */
        identifier: 'id',

        /**
         * auto sync
         * @type {Boolran}
         */
        autoSync: true,

        /**
         * load param
         * @type {Object}
         */
        param: null,

        /**
         * constructor function
         * @constructor
         */
        DataSource: function () {
            Jsx.Delegate.def(this,
                'beforeload',
                'load',
                'beforesync',
                'sync',
                'beforeinsert',
                'insert',
                'beforeupdate',
                'update',
                'beforedelete',
                'delete',
                'error'
            );

            this.syncData = { deleted: [], update: [], insert: [] };
            this.param = {};
            this.data = [];
        },

        /**
         * data result
         * @param  {Object} data
         * @return {Object} 
         */
        dataResult: function (data) {
            this.fullData = data;
            if (!data){
                this.total = 0;
                return this.data = [];
            }

            this.total = Jsx.get(this.totalField, data) || 0;
            this.data = parseData(this, Jsx.get(this.dataField, data) || []);
            return this.data;
        },

        /**
         * insert records
         * @param {Object} record
         */
        insert: function (record) {
            if (!this.onbeforeinsert.emit(record))
                return;

            var identifier = this.identifier;
            var id = record[identifier];

            if (this.data.propertyIndexOf(identifier, id))
                return this.onerror.emit(new Error('Primary key conflict'));

            this.syncData.insert.push(record);
            this.oninsert.emit(record);
            autoSync(this);
        },

        /**
         * update records
         * @param {Object} record
         */
        update: function (record) {
            if (!this.onbeforeupdate.emit(record))
                return;

            var identifier = this.identifier;
            var id = record[identifier];
            if (!id)
                return this.onerror.emit(new Error('Update records no primary key'));
            var update = this.syncData.update;

            update.splice(update.propertyIndexOf(identifier, id), 1);
            update.push(record);

            this.onupdate.emit(record);
            autoSync(this);
        },

        /**
         * delete records
         * @param {Object} record
         */
        deleted: function (record) {
            if (!this.onbeforedelete.emit(record))
                return;

            var identifier = this.identifier;
            var id = record[identifier];
            if (!id)
                return this.onerror.emit(new Error('Delete records no primary key'));

            var deleted = this.syncData.deleted;
            deleted.splice(deleted.propertyIndexOf(identifier, id), 1);
            deleted.push(record);

            this.ondelete.emit(record);
            autoSync(this);
        },

        /**
         * load static data and trigger event
         * @param {Object} data
         * @param {Object} total (Optional)
         */
        loadData: function (data, total) {
            if (!this.onbeforeload.emit())
                return;

            total = (typeof total == 'number' ? total : data && typeof data.length == 'number' ? data.length : 0);
            var o = {};
            Jsx.set(this.totalField, total, o);
            Jsx.set(this.dataField, data, o);

            this.onload.emit(this.dataResult(o));
        },

        /**
         * load data and trigger event, virtual function
         * @method load
         * @param {Object} param    load param
         */
        load: virtual,

        /**
         * sync server data and trigger event, virtual function
         * @method sync
         */
        sync: virtual

    });

});