/**
 * @class Jsx.xml.CDATASection 
 * @extends Jsx.xml.CharacterData
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/xml/CharacterData.js');

define(function() {

    Class('Jsx.xml.CDATASection', Jsx.xml.CharacterData, {

        nodeName: "#cdata-section",
        nodeType: Jsx.xml.Node.CDATA_SECTION_NODE

    });

});