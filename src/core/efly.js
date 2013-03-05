

var EFly = {

	version: 1.0,

	options: {
		menu: null
	},

	init: function (containerNode, options) {
		
	}

};

/**
 * 表示一个命令。
 */
var Command = Class({

	name: null,

	exec: Function.empty,

	state: null,

	shortcut: null,

	constructor: function (name, action, state) {

	}

});