/**
 * @class Jsx.xml.LiveNodeList
 * @extends Jsx.xml.NodeList
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/NodeList.js');

define(function() {

    function update(_this) {
        var inc = _this._node.ownerDocument._inc;
        if (_this._inc != inc) {
            var ls = _this._refresh(_this._node);
            var l = ls.length;
            
            _this._length = l;
            for(var i = 0; i < l; i++)
                _this[i] = ls[i];

            _this._inc = inc;
        }
    }


    Class('Jsx.xml.LiveNodeList', Jsx.xml.NodeList, {
    
        _length: 0,

        get length() {
            update(this);
            return this._length;
        },

        LiveNodeList: function(node, refresh) {
            this._node = node;
            this._refresh = refresh
        },

        item: function(index) {
            update(this);
            return this[index] || null;
        }
    });

});