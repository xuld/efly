/**
 * @class Jsx.xml.Entity 
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

    Class('Jsx.xml.Entity', Node, {
        nodeType: Node.ENTITY_NODE
    });

});