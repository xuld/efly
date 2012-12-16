/**
 * @class Jsx.xml.DocumentType 
 * @extends Jsx.xml.Node
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/Node.js');

define(function() {
    var Node = Jsx.xml.Node;

    Class('Jsx.xml.DocumentType', Node, {

        // Introduced in DOM Level 2:
        /**
         * constructor function
         * @constructor
         * @param {String}              qualifiedName
         * @param {String}              publicId
         * @param {String}              systemId
         */
        DocumentType: function(qualifiedName, publicId, systemId) {// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR

            this.name = qualifiedName;
            this.nodeName = qualifiedName;
            this.publicId = publicId;
            this.systemId = systemId;
            // Introduced in DOM Level 2:
            //readonly attribute DOMString        internalSubset;

            //TODO:..
            //  readonly attribute NamedNodeMap     entities;
            //  readonly attribute NamedNodeMap     notations;
        },

        nodeType: Node.DOCUMENT_TYPE_NODE

    });

});