﻿/* ***** BEGIN LICENSE BLOCK *****
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

define(function() {


    var trimBeginRegexp = /^\s\s*/;
    var trimEndRegexp = /\s\s*$/;


    Class('ace.lib.Lang', null, null, {

        stringReverse: function(string) {
            return string.split("").reverse().join("");
        },

        stringRepeat: function(string, count) {
            return new Array(count + 1).join(string);
        },

        stringTrimLeft: function(string) {
            return string.replace(trimBeginRegexp, '');
        },

        stringTrimRight: function(string) {
            return string.replace(trimEndRegexp, '');
        },

        copyObject: function(obj) {
            var copy = {};
            for (var key in obj) {
                copy[key] = obj[key];
            }
            return copy;
        },

        copyArray: function(array) {
            var copy = [];
            for (var i = 0, l = array.length; i < l; i++) {
                if (array[i] && typeof array[i] == "object")
                    copy[i] = this.copyObject(array[i]);
                else
                    copy[i] = array[i];
            }
            return copy;
        },

        deepCopy: function(obj) {
            if (typeof obj != "object") {
                return obj;
            }

            var copy = obj.constructor();
            for (var key in obj) {
                if (typeof obj[key] == "object") {
                    copy[key] = this.deepCopy(obj[key]);
                } else {
                    copy[key] = obj[key];
                }
            }
            return copy;
        },

        arrayToMap: function(arr) {
            var map = {};
            for (var i = 0; i < arr.length; i++) {
                map[arr[i]] = 1;
            }
            return map;

        },

        /**
        * splice out of 'array' anything that === 'value'
        */
        arrayRemove: function(array, value) {
            for (var i = 0; i <= array.length; i++) {
                if (value === array[i]) {
                    array.splice(i, 1);
                }
            }
        },

        escapeRegExp: function(str) {
            return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
        },

        deferredCall: function(fcn) {

            var timer = null;
            var callback = function() {
                timer = null;
                fcn();
            };

            var deferred = function(timeout) {
                deferred.cancel();
                timer = setTimeout(callback, timeout || 0);
                return deferred;
            };

            deferred.schedule = deferred;

            deferred.call = function() {
                this.cancel();
                fcn();
                return deferred;
            };

            deferred.cancel = function() {
                clearTimeout(timer);
                timer = null;
                return deferred;
            };

            return deferred;
        }

    });

});
