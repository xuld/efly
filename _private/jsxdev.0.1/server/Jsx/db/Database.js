/**
 * @class Jsx.db.Database Database abstract class
 * @extends Object
 * @createTime 2012-01-11
 * @updateTime 2011-01-11
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');

define(function() {
    var REG = /[\0\n\r\b\t\\\'\"\x1a]/g;
    var Database =

    Class('Jsx.db.Database', null, {

        //public:
        /**
         * host
         * @type {String}
         */
        host: 'localhost',

        /**
         * prot
         * @type {Number}
         */
        port: 0,

        /**
         * username
         * @type {String}
         */
        user: 'root',

        /**
         * password
         * @type {String}
         */
        password: 'root',

        /**
         * database name
         * @type {String}
         */
        database: '',

        /**
         * @event onerror
         */
        onerror: null,

        /**
         * constructor function
         * @constructor
         */
        Database: function() {
            Jsx.Delegate.def(this, 'error');
        },

        /**
         * database statistics
         * @method statistics
         * @param {Function} cb
         */
        statistics: virtual,

        /**
         * query database
         * @method query
         * @param  {String}   sql
         * @param  {Function} cb  (Optional)
         * @return {Jsx.db.Query}
         */
        query: virtual,

        /**
         * close database connection
         * @method close
         */
        close: virtual,

        /**
         * srart transaction
         * @method transaction
         */
        transaction: virtual,

        /**
         * commit transaction
         * @method commit
         */
        commit: virtual,

        /**
         * rollback transaction and clear sql command queue
         * @method rollback
         */
        rollback: virtual

    }, {

        /**
         * format sql 
         * @param  {String} sql
         * @param  {Object} args..
         * @return {String}
         * @static
         */
        sql: function(sql) {
            var args = arguments;
            for (var i = 1, l = args.length; i < l; i++)
                sql = sql.replace(new RegExp('\\{' + (i - 1) + '\\}', 'g'), Database.escape(args[i]));

            return sql;
        },

        /**
         * escape sql param
         * @param  {String} param
         * @return {String}
         * @static
         */
        escape: function(param) {
            if (param === undefined || param === null)
                return 'NULL';

            var type = typeof param;
            if (type == 'boolean' || type == 'number')
                return param + '';

            if (param instanceof Date)
                return param.toString("'yyyy-MM-dd hh:mm:ss'");

            return "'" + (param + '').replace(REG, function(s) {
                switch (s) {
                    case "\0": return "\\0";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\b": return "\\b";
                    case "\t": return "\\t";
                    case "\x1a": return "\\Z";
                    default: return "\\" + s;
                }
            }) + "'";
        }

    });
});
