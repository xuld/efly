
/**
 * 表示一个面板。
 */
var Panel = Class({

	header: null,

	/**
	 * 当前面板的主体。
	 */
	content: null,

	constructor: function (header, content) {
		this.header = header;
		this.content = content;
	},

	onResize: Function.empty,

	resizeTo: function (width, height) {
		var style = this.content.style;
		style.width = width + 'px';

		height -= this.header.offsetHeight;
		style.height = height + 'px';

		this.onResize(width, height);
	}

});
