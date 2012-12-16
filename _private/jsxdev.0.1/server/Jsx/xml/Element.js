/**
 * @class Jsx.xml.Element
 * @extends Jsx.xml.Node
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/Node.js');
include('Jsx/xml/LiveNodeList.js');
include('Jsx/xml/Document.js');
include('Jsx/xml/DOMParser.js');

define(function() {
    var Node = Jsx.xml.Node;
    var LiveNodeList = Jsx.xml.LiveNodeList;

    Class('Jsx.xml.Element', Node, {

        nodeType: Node.ELEMENT_NODE,

        hasAttribute: function(name) {
            return this.getAttributeNode(name) != null;
        },

        getAttribute: function(name) {
            var attr = this.getAttributeNode(name);
            return attr && attr.value || '';
        },

        setAttribute: function(name, value) {
            var attr = this.ownerDocument.createAttribute(name);
            attr.value = attr.nodeValue = value;
            this.setAttributeNode(attr)
        },

        getAttributeNode: function(name) {
            return this.attributes.getNamedItem(name);
        },

        setAttributeNode: function(newAttr) {
            this.attributes.setNamedItem(newAttr);
        },

        removeAttributeNode: function(oldAttr) {
            this.atttributes._removeItem(oldAttr);
        },

        removeAttribute: function(name) {
            var attr = this.getAttributeNode(name)
            attr && this.removeAttributeNode(attr);
        },

        hasAttributeNS: function(namespaceURI, localName) {
            return this.getAttributeNodeNS(namespaceURI, localName) != null;
        },

        getAttributeNS: function(namespaceURI, localName) {
            var attr = this.getAttributeNodeNS(namespaceURI, localName);
            return attr && attr.value || '';
        },

        setAttributeNS: function(namespaceURI, qualifiedName, value) {
            var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
            attr.value = attr.nodeValue = value;
            this.setAttributeNode(attr)
        },

        getAttributeNodeNS: function(namespaceURI, localName) {
            return this.attributes.getNamedItemNS(namespaceURI, localName);
        },

        setAttributeNodeNS: function(newAttr) {
            this.attributes.setNamedItemNS(newAttr);
        },

        removeAttributeNS: function(namespaceURI, localName) {
            var attr = this.getAttributeNodeNS(namespaceURI, localName);
            attr && this.removeAttributeNode(attr);
        },

        getElementsByTagName: function(name) {
            var Document = Jsx.xml.Document;
            
            return new LiveNodeList(this, function(node) { 
                var ls = [];
                Document.visitNode(node, function(node) {
                    if (node.nodeType == Node.ELEMENT_NODE && node.tagName == name) 
                        ls.push(node);
                    return true;
                });
                return ls;
            });
        },

        getElementsByTagNameNS: function(namespaceURI, localName) {
            var Document = Jsx.xml.Document;
            return new LiveNodeList(this, function(node) {
                var ls = [];
                Document.visitNode(node, function(node) {
                    if (node.nodeType == Node.ELEMENT_NODE && node.namespaceURI == namespaceURI && node.localName == localName) 
                        ls.push(node);
                    return true;
                });
                return ls;
            });
        },

        get innerXml () {

            return Array.toArray(this.childNodes).join('');
        },
        
        set innerXml (xml) {
            
            this.removeAllChild();
            if(xml)
                new Jsx.xml.DOMParser().fragment(this.ownerDocument, this, xml);
        }

    });

});