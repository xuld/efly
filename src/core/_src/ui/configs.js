
var Configs = {
	"menus": {
		"js": {
			"Cut": {
				"text": "剪切(F)..."
			}
		}
	},

	"keys": {
		"Ctrl+A": "Editor.SelectAll",
		"Ctrl+N": "IDE.NewFile"
	},

	"view": {
		"width": 1000,
		"height": 600,
		"showSystemMenu": true,
		"showStatusbar": true,
		"systemMenu": {
			"file": {
				"type": "menubutton",
				"text": "文件(F)...",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"Sep1": "-"
		},
		"regions": {
			"borderWidth": 10,
			"left": {
				"panels": ["工具栏", "工具栏\n2"],
				"width": 124,
				"currentPanel": "工具栏",
				"collspaned": true
			},
			"right": {
				"panels": ["工具栏", "工具栏\n2"],
				"width": 124,
				"collspaned": true
			},
			"bottom": {
				"panels": ["查找和替换", "控制台"],
				"height": 124,
				"collspaned": true
			}
		}
	}

};
