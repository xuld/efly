

/**
 * 表示一个选项卡控件。
 */
var TabControl = Control.extend({

	tabbable: null,

	currentPanel: null,

	create: function () {
		return document.createElement('div');
	},

	init: function (container) {

		this.elem.innerHTML = '<a class="right icon icon-bottom tab-list"></a><div class="tabbable"><div class="tab panel-header"></div><div class="tab"><a class="icon icon-plus tab-add" href="#"></a></div></div><div></div>';

		this.tabbable = this.elem.firstChild.nextSibling.firstChild;

		this.tabs = {};

		// <div class="tab panel-header tab-actived"><a class="icon right icon-cancel tab-close" href="#"></a>theme.html</div>
		
	},

	add: function (name, panel) {
		
	},

	resizeTo: function (width, height) {
		this.elem.style.width = width + 'px';

		if (this.currentPanel) {
			this.currentPanel.resizeTo(width, height);
		}
	}

});
