/**
 * @class Jsx.xml.Text 
 * @extends Jsx.xml.CharacterData
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/CharacterData.js');

define(function() {


    Class('Jsx.xml.Text', Jsx.xml.CharacterData, {
        nodeName: "#text",
        nodeType: Jsx.xml.Node.TEXT_NODE,
        splitText: function(offset) {
            var text = this.data;
            var newText = text.substring(offset);
            text = text.substring(0, offset);
            this.data = this.nodeValue = text;
            this.length = text.length;
            var newNode = this.ownerDocument.createTextNode(newText);
            if (this.parentNode) {
                this.parentNode.insertBefore(newNode, this.nextSibling);
            }
            return newNode;
        }
    });

});