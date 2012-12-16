/**
 * @class Jsx.xml.Document
 * @extends Jsx.xml.Node
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/Node.js');
include('Jsx/xml/Attr.js');
include('Jsx/xml/CDATASection.js');
include('Jsx/xml/Comment.js');
include('Jsx/xml/DocumentFragment.js');
include('Jsx/xml/DocumentType.js');
include('Jsx/xml/EntityReference.js');
include('Jsx/xml/ProcessingInstruction.js');
include('Jsx/xml/Text.js');
include('Jsx/xml/Element.js');
include('Jsx/xml/NamedNodeMap.js');
include('Jsx/xml/NodeList.js');
include('Jsx/xml/DOMParser.js');
include('node/fsx.js');

define(function() {
    var xml = Jsx.xml;
    var Node = xml.Node;
    var Attr = xml.Attr;
    var CDATASection = xml.CDATASection;
    var Comment = xml.Comment;
    var DocumentFragment = xml.DocumentFragment;
    var EntityReference = xml.EntityReference;
    var ProcessingInstruction = xml.ProcessingInstruction;
    var Text = xml.Text;
    var Element = xml.Element;
    var NamedNodeMap = xml.NamedNodeMap;
    var NodeList = xml.NodeList;
    var fsx = node.fsx;


    function visitNode(node, callback) {
        if (!callback(node))
            return false;

        var next = node.firstChild;
        if (next) {
            if (!visitNode(next, callback))
                return false;
        }
        if (next = node.nextSibling)
            return visitNode(next, callback);
        return true;
    }

    function importNode(doc, node, deep) {
        var node2;
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                node2 = node.cloneNode(false);
                node2.ownerDocument = doc;
                var attrs = node2.attributes;
                var len = attrs.length;
                for (var i = 0; i < len; i++) {
                    node2.setAttributeNodeNS(importNode(doc, attrs.item(i), deep));
                }
            case Node.DOCUMENT_FRAGMENT_NODE:
                break;
            case Node.ATTRIBUTE_NODE:
                deep = true;
                break;
        }
        if (!node2) {
            node2 = node.cloneNode(false); //false
        }
        node2.ownerDocument = doc;
        node2.parentNode = null;
        if (deep) {
            var child = node.firstChild;
            while (child) {
                node2.appendChild(importNode(doc, child, deep));
                child = child.nextSibling;
            }
        }
        return node2;
    }


    Class('Jsx.xml.Document', Node, {

        nodeName: '#document',
        nodeType: Node.DOCUMENT_NODE,
        doctype: null,
        documentElement: null,
        _inc: 1,

        // Introduced in DOM Level 2:
        /**
         * constructor function
         * @constructor
         * @param {String}              namespaceURI
         * @param {String}              qualifiedName
         * @param {Jsx.xml.DocumentType} doctype
         */
        Document: function(namespaceURI, qualifiedName, doctype) {// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
            this.childNodes = new NodeList();
            this.doctype = doctype;
            if (doctype) {
                this.appendChild(doctype);
            }

            if (qualifiedName) {
                var root = this.createElementNS(namespaceURI, qualifiedName);
                this.appendChild(root);
            }
        },

        load: function(xml) {
            new Jsx.xml.DOMParser().fragment(this, null, xml);
        },

        loadFile: function(filename) {
            var xml = fsx.readFileSync(filename) + '';
            this.load(xml);
        },

        insertBefore: function(newChild, refChild) {//raises 

            if (newChild.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
                var child = newChild.firstChild;
                while (child) {
                    this.insertBefore(newChild, refChild);
                    child = child.nextSibling;
                }
                return newChild;
            }
            if (this.documentElement == null && newChild.nodeType == 1)
                this.documentElement = newChild;

            this.Jsx_xml_Node_insertBefore(newChild, refChild);
            newChild.ownerDocument = this;
            return newChild;
        },

        removeChild: function(oldChild) {
            if (this.documentElement == oldChild) {
                this.documentElement = null;
            }
            return this.Jsx_xml_Node_removeChild(oldChild);
        },

        // Introduced in DOM Level 2:
        importNode: function(importedNode, deep) {
            return importNode(this, importedNode, deep);
        },
        // Introduced in DOM Level 2:
        getElementById: function(id) {
            var rtv = null;
            visitNode(this.documentElement, function(node) {
                if (node.nodeType == 1) {
                    if (node.getAttribute('id') == id) {
                        rtv = node;
                        return false;
                    }
                    return true;
                }
            })
            return rtv;
        },

        getElementsByTagName: function(name) {
            var el = this.documentElement;
            return el ? el.getElementsByTagName(name) : [];
        },

        getElementsByTagNameNS: function(namespaceURI, localName) {
            var el = this.documentElement;
            return el ? el.getElementsByTagNameNS(namespaceURI, localName) : [];
        },

        //document factory method:
        createElement: function(tagName) {
            var node = new Element();
            node.ownerDocument = this;
            node.nodeName = tagName;
            node.tagName = tagName;
            node.childNodes = new NodeList();
            var attrs = node.attributes = new NamedNodeMap();
            attrs._ownerElement = node;
            return node;
        },

        createDocumentFragment: function() {
            var node = new DocumentFragment();
            node.ownerDocument = this;
            node.childNodes = new NodeList();
            return node;
        },

        createTextNode: function(data) {
            var node = new Text();
            node.ownerDocument = this;
            node.appendData(data)
            return node;
        },

        createComment: function(data) {
            var node = new Comment();
            node.ownerDocument = this;
            node.appendData(data)
            return node;
        },

        createCDATASection: function(data) {
            var node = new CDATASection();
            node.ownerDocument = this;
            node.appendData(data)
            return node;
        },

        createProcessingInstruction: function(target, data) {
            var node = new ProcessingInstruction();
            node.ownerDocument = this;
            node.target = target;
            node.data = data;
            return node;
        },

        createAttribute: function(name) {
            var node = new Attr();
            node.ownerDocument = this;
            node.name = name;
            node.nodeName = name;
            node.specified = true;
            return node;
        },

        createEntityReference: function(name) {
            var node = new EntityReference();
            node.ownerDocument = this;
            node.nodeName = name;
            return node;
        },

        // Introduced in DOM Level 2:
        createElementNS: function(namespaceURI, qualifiedName) {
            var node = new Element();
            var pl = qualifiedName.split(':');
            var attrs = node.attributes = new NamedNodeMap();
            node.childNodes = new NodeList();
            node.ownerDocument = this;
            node.nodeName = qualifiedName;
            node.tagName = qualifiedName;
            node.namespaceURI = namespaceURI;
            if (node.length == 2) {
                node.prefix = pl[0];
                node.localName = pl[1];
            } else {
                //el.prefix = null;
                node.localName = qualifiedName;
            }
            attrs._ownerElement = node;
            return node;
        },

        // Introduced in DOM Level 2:
        createAttributeNS: function(namespaceURI, qualifiedName) {
            var node = new Attr();
            var pl = qualifiedName.split(':');
            node.ownerDocument = this;
            node.nodeName = qualifiedName;
            node.name = qualifiedName;
            node.namespaceURI = namespaceURI;
            node.specified = true;
            if (pl.length == 2) {
                node.prefix = pl[0];
                node.localName = pl[1];
            } else {
                //el.prefix = null;
                node.localName = qualifiedName;
            }
            return node;
        }

    }, {

        /**
         * @method visitNode    
         * @static
         */
        visitNode: visitNode

    });

});