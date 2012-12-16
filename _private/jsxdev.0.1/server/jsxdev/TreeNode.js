/**
 * @class jsxdev.TreeNode
 * @extends Object
 * @createTime 2012-01-25
 * @updateTime 2012-01-25
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

define(function() {

    function notFunction(key, value) {
        return typeof value != 'function';
    }

    var TreeNode =

    Class('jsxdev.TreeNode', null, {

        /**
         * @type {Number}
         */
        id: 0,

        /**
         * 0 read,write,all
         * 1 read,write
         * 2 read
         * 3 none
         * @type {Number}
         */
        weight: 3,

        /**
         * is inherit
         * @type {Boolean}
         */
        inherit: false,

        /**
         * children node
         * @type {Array}
         */
        children: null,

        /**
         * constructor
         * @param {Object}    opt
         * @param {Object[]}  items (Optional)
         * @constructor
         */
        TreeNode: function(opt, items) {

            if (!opt) {
                var opt = items.splice(items.propertyIndexOf('top', null), 1)[0];
                opt.weight = (typeof opt.weight == 'number' ? opt.weight : 3);
                items.reverse();
            }
            Jsx.extend(this, opt);

            this.inherit = false;
            this.multi = false;
            var children = this.children = [];
            var id = this.id;
            var weight = this.weight;
            if (!items)
                return;

            for (var i = items.length - 1; i > -1; i--) {
                var item = items[i];
                if (!item || item.parent !== id)
                    continue;

                item.weight = (typeof item.weight == 'number' ? item.weight : 3);
                if (item.weight > weight) {
                    item.inherit = true;
                    item.weight = weight;
                }

                items.splice(i, 1);
                children.push(new TreeNode(item, items));
            }
        },

        /**
         * query node by id
         * @param  {Number} id
         * @return {jsxdev.TreeNode}
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
         * query node list by id
         * @param  {Number} id
         * @return {jsxdev.TreeNode[]}
         */
        finds: function(id) {

            if (this.id === id)
                return [this];

            var children = this.children;
            for (var i = 0, l = children.length; i < l; i++) {
                var nodes = children[i].finds(id);

                if (nodes) {
                    nodes.unshift(this);
                    return nodes;
                }
            }
            return null;
        },

        /**
         * get join id value
         * @return {Number[]}
         */
        getIds: function() {
            var ls = [this.id];
            var children = this.children;

            for (var i = 0, l = children.length; i < l; i++)
                ls = ls.concat(children[i].getIds());
            return ls;
        },

        /**
         * @parem  {Object[]}             weights
         * @parem  {jsxdev.TreeNode}  newNode    (Optional)
         * @return {jsxdev.TreeNode}
         */
        getNewTree: function(weights, newNode) {

            if (!newNode) { //root node

                var w = weights[this.id];
                newNode = new TreeNode(Jsx.filter(this, notFunction));
                newNode.weight = (typeof w == 'number' ? w : 3);
            }

            var weight = newNode.weight;
            var children = this.children;
            var newChildren = newNode.children;

            for (var i = 0, l = children.length; i < l; i++) {
                var item = children[i];
                var node = new TreeNode(Jsx.filter(item, notFunction));
                var w = weights[item.id];

                node.weight = (typeof w == 'number' ? w : 3);
                if (node.weight > weight) {
                    node.inherit = true;
                    node.weight = weight;
                }

                newChildren.push(node);
                item.getNewTree(weights, node);
            }
            return newNode;
        },

        /**
         * to string 
         * @return {String}
         */
        toString: function() {
            return this.name;
        }

    });

});