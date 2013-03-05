

/**
 * 表示一个状态栏。
 */
var Statusbar = Control.extend({

	tpl: '<div class="statusbar">\
				<div class="right">\
					<span class="statusbar-label"></span>\
					<span class="statusbar-label"></span>\
					<span class="statusbar-label"></span>\
					<span class="statusbar-info"></span>\
				</div>\
				<span class="statusbar-text"></span>\
			</div>',

	updateStatusText: function (value) {

	},

	updateRowInfo: function (row, col, selectionLength) {

	}
});
