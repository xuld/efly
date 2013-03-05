


/**
 * 表示一个面板。
 */
var Panel = Control.extend({

	/**
	 * 当前面板的所在 IDE。
	 */
	owner: null,

	/**
	 * 当前面板的标题。
	 */
	header: null,

	/**
	 * 当前面板的主体。
	 */
	body: null,

	create: function () {
		return document.createElement('div');
	},

	/**
	 * 根据 options 更新面板状态。
	 */
	update: function (options) {

	},

	/**
	 * 更改当前面板的大小。
	 */
	resizeTo: function (width, height) {

	}




});
