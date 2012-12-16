/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Ajax.org Code Editor (ACE).
*
* The Initial Developer of the Original Code is
* Ajax.org B.V.
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*      Fabian Jakobs <fabian AT ajax DOT org>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

include('ace/lib/Dom.js');

define(function() {


    var cssText = '\
.ace_dark .ace_fold {\
    color: #000;\
    outline-color: #00f;\
}\
\
.ace-vs .ace_editor {\
  border: 2px solid rgb(159, 159, 159);\
}\
\
.ace-vs .ace_editor.ace_focus {\
  border: 2px solid #327fbd;\
}\
\
.ace-vs .ace_gutter {\
  width: 60px;\
  color: #333;\
  overflow : hidden;\
}\
\
.ace-vs .ace_gutter-layer {\
  text-align: right;\
  background: #fff;\
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAACCAMAAAFEVX8LAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAJUExURf////Dw8CuRr7+6Wp0AAAAtSURBVHjaYmBkZAADgABigDIAAghIw4VAACCAwHx0MQQACDC4NAFl6IAJRAAACg0AI1PHNvsAAAAASUVORK5CYII=");\
}\
\
.ace_gutter-cell.ace_error,.ace_gutter-cell.ace_warning,.ace_gutter-cell.ace_debug {\
    background-position: 0px center;\
}\
\
.ace-vs .ace_gutter-layer .ace_gutter-cell {\
  padding-right: 6px;\
  color: #2B91AF;\
}\
\
.ace-vs .ace_print_margin {\
  width: 1px;\
  background: #e8e8e8;\
}\
\
.ace-vs .ace_text-layer {\
  cursor: text;\
}\
\
.ace-vs .ace_cursor {\
  border-left: 2px solid black;\
}\
\
.ace-vs .ace_cursor.ace_overwrite {\
  border-left: 0px;\
  border-bottom: 1px solid black;\
}\
\
.ace-vs .ace_line .ace_invisible {\
  color: rgb(191, 191, 191);\
}\
\
.ace-vs .ace_line .ace_identifier {\
  /*color: #f00;*/\
}\
\
.ace-vs .ace_line .ace_keyword, .ace-vs .ace_line .ace_region {\
  color: blue;\
}\
\
.ace-vs .ace_line .ace_constant.ace_buildin {\
  color: rgb(88, 72, 246);\
}\
\
.ace-vs .ace_line .ace_constant.ace_language {\
  color: rgb(88, 92, 246);\
}\
\
.ace-vs .ace_line .ace_constant.ace_library {\
  color: rgb(6, 150, 14);\
}\
\
.ace-vs .ace_line .ace_invalid {\
  background-color: rgb(153, 0, 0);\
  color: white;\
}\
\
.ace-vs .ace_line .ace_fold {\
    background-color: #E4E4E4;\
    border-radius: 3px;\
}\
\
.ace-vs .ace_line .ace_support.ace_function {\
  color: rgb(60, 76, 114);\
}\
\
.ace-vs .ace_line .ace_support.ace_constant {\
  color: rgb(6, 150, 14);\
}\
\
.ace-vs .ace_line .ace_support.ace_type,\
.ace-vs .ace_line .ace_support.ace_class {\
  color: rgb(109, 121, 222);\
}\
\
.ace-vs .ace_line .ace_keyword.ace_operator {\
  color: rgb(104, 118, 135);\
}\
\
.ace-vs .ace_line .ace_string {\
  color: #A31515;\
}\
\
\
.ace-vs .ace_line .ace_regexp {\
  color: #00f;\
}\
\
.ace-vs .ace_line .ace_comment {\
  color: #008000;\
}\
\
.ace-vs .ace_line .ace_comment.ace_doc {\
    color: #008000;\
}\
\
.ace-vs .ace_line .ace_comment.ace_doc.ace_tag {\
  color: #008000;\
}\
\
.ace-vs .ace_line .ace_constant.ace_numeric {\
  color: rgb(0, 0, 205);\
}\
\
.ace-vs .ace_line .ace_variable {\
  color: rgb(49, 132, 149);\
}\
\
.ace-vs .ace_line .ace_xml_pe {\
  color: rgb(104, 104, 91);\
}\
\
.ace-vs .ace_markup.ace_underline {\
    text-decoration:underline;\
}\
\
.ace-vs .ace_markup.ace_heading {\
  color: rgb(12, 7, 255);\
}\
\
.ace-vs .ace_markup.ace_list {\
  color:rgb(185, 6, 144);\
}\
\
.ace-vs .ace_marker-layer .ace_selection {\
  background: rgb(181, 213, 255);\
}\
\
.ace-vs .ace_marker-layer .ace_step {\
  background: rgb(252, 255, 0);\
}\
\
.ace-vs .ace_marker-layer .ace_stack {\
  background: rgb(164, 229, 101);\
}\
\
.ace-vs .ace_marker-layer .ace_bracket {\
  margin: -1px 0 0 -1px;\
  background: #B5D5FF;\
  border: 1px solid #00f;\
}\
\
.ace-vs .ace_marker-layer .ace_active_line {\
  background: rgba(0, 0, 0, 0.07);\
}\
\
.ace-vs .ace_marker-layer .ace_selected_word {\
  background: #B5D5FF;\
  border: 1px solid #00f;\
}\
\
.ace-vs .ace_marker-layer .ace_break {\
  background: #FFF04A;\
  border: 1px solid #FFA84A;\
}\
\
.ace-vs .ace_meta.ace_tag {\
  color:rgb(28, 2, 255);\
}\
\
.ace-vs .ace_string.ace_regex {\
  color: rgb(255, 0, 0)\
}\
\
';

    // import CSS once
    //ace.lib.Dom.importCssString(cssText);

    Class('ace.theme.VisualStudio', null, null, {

        cssText: cssText,

        isDark: true,

        cssClass: "ace-vs"

    });

});