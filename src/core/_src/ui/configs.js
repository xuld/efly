
ide.configs = {
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
		//"width": 1000,
		//"height": 600,
		"showSystemMenu": true,
		"showStatusbar": true,
		"systemMenu": {
			"file": {
				"type": "menubutton",
				"text": "文件(F)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"edit": {
				"type": "menubutton",
				"text": "编辑(F)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"view": {
				"type": "menubutton",
				"text": "视图(V)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"format": {
				"type": "menubutton",
				"text": "格式(F)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"search": {
				"type": "menubutton",
				"text": "搜索(S)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"tools": {
				"type": "menubutton",
				"text": "工具(T)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					}
				}
			},
			"help": {
				"type": "menubutton",
				"text": "帮助(H)",
				"subMenu": {
					"New": {
						"text": "新建文件(N)...",
						"command": "IDE.NewFile"
					},
					"Sep1": "-"
				}
			}
		},
		"regions": {
			"borderWidth": 10,
			"left": {
				"panels": ["项目浏览器"],
				"width": 124,
				"currentPanel": "工具栏",
				"collspaned": true
			},
			"right": {
				"panels": ["代码片段", "常用工具"],
				"width": 124,
				"collspaned": true
			},
			"bottom": {
				"panels": ["查找和替换", "控制台"],
				"height": 124,
				"collspaned": true
			}
		}
	},

	"plugins": {
		"": true
	}

};
