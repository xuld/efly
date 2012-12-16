/**
 * @class Jsx.xml.CharacterData 
 * @extends Jsx.xml.Node
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/Node.js');

define(function() {

    Class('Jsx.xml.CharacterData', Jsx.xml.Node, {
        data: '',
        substringData: function(offset, count) {
            return this.data.substring(offset, offset + count);
        },
        appendData: function(text) {
            text = this.data + text;
            this.nodeValue = this.data = text;
            this.length = text.length;
        },
        insertData: function(offset, text) {
            this.replaceData(offset, 0, text);

        },
        deleteData: function(offset, count) {
            this.replaceData(offset, count, "");
        },
        replaceData: function(offset, count, text) {
            var start = this.data.substring(0, offset);
            var end = this.data.substring(offset + count);
            text = start + text + end;
            this.nodeValue = this.data = text;
            this.length = text.length;
        }
    });

});