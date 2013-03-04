

var Plugin = {

	name: 'goto line',

	version: 1.0,

	author: 'xuld',

	website: './',

	update: '',

	email: 'xuld@vip.qq.com',

	install: function () {
		ide.setShortcut('Ctrl+G', 'GotoLine');
		ide.getMenu('system').addItemByPath('Edit/Replace', 'GotoLine', '转到(&G)...');
	},

	uninstall: function () {
		ide.unsetShortcut('Ctrl+G', 'GotoLine');
		ide.getMenu('system').removeItemByPath('Edit/GotoLine');
	},

	exec: function () {
		Editor.implement({

			gotoLine: function (row, col) {

			}

		});

		ide.registerCommand({
			name: 'GotoLine',
			state: function () {
				return !!ide.getCurrentEditor();
			},
			exec: function (editor) {
				editor.gotoLine(args.row, args.col);
			}
		});
	}

};
