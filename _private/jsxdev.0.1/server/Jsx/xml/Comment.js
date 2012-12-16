/**
 * @class Jsx.xml.Comment 
 * @extends Jsx.xml.CharacterData
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/CharacterData.js');

define(function() {


    Class('Jsx.xml.Comment', Jsx.xml.CharacterData, {

        nodeName: "#comment",
        nodeType: Jsx.xml.Node.COMMENT_NODE

    });

});