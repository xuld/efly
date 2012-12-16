/**
 * @class Jsx.xml.NodeList 
 * @createTime 2012-01-18
 * @updateTime 2013-01-18
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

define(function() {


    /**
     * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
     * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
     * The items in the NodeList are accessible via an integral index, starting from 0.
     */

    Class('Jsx.xml.NodeList', null, {
        /**
         * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
         * @standard level1
         */
        length: 0,
        /**
         * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
         * @standard level1
         * @param index  unsigned long 
         *   Index into the collection.
         * @return Node
         * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
         */
        item: function(index) {
            return this[index] || null;
        }
    });

});