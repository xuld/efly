
//#include panel.js

/**
 * 表示一个集成开发环境。
 */
var ide = {

    /**
	 * 包含全部内容的跟节点。
	 */
    elem: null,

    /**
	 * 当前 IDE 的配置对象。
	 */
    configs: Configs,

    init: function (containerNode, options) {

        // 初始化对象。
        this.elem = containerNode;

    },

    /**
	 * 在当前 IDE 注册一个命令。
	 */
    registerCommand: function (commandName, commandAction, language, defaultShortcut) {

    },

    /**
	 * 在当前 IDE 注销一个命令。
	 */
    unregisterCommand: function (commandName) {

    },

    /**
	 * 获取指定名字的命令对象。
	 */
    getCommand: function (commandName) {

    },

    commands: {},

    /**
	 * 在当前 IDE 执行一个命令。
	 */
    execCommand: function (commandName, args, showUI) {
        if (commandName = ide.commands[commandName]) {
            return commandName.exec(args, showUI);
        }
    },

    /**
	 * 查询命令的状态。
	 */
    queryCommandState: function (commandName) {
        if (commandName = ide.commands[commandName]) {
            return commandName.state ? commandName.state() : true;
        }
    },

    /**
	 * 查询命令的值。
	 */
    queryCommandValue: function (commandName) {
        if (commandName = ide.commands[commandName]) {
            return commandName.value ? commandName.value() : null;
        }
    },

    /**
	 * 获取指定名字的菜单。
	 */
    getMenu: function (menuName) {

    },

    /**
	 * 在当前 IDE 注册一个面板。
	 */
    registerPanel: function (panelName, panelClass) {

    },

    /**
	 * 在当前 IDE 注销一个面板。
	 */
    unregisterPanel: function (panelName, panelClass) {

    },

    getPanelName: function (panelId) {
    	return panelId;
    },

    /**
	 * 获取指定名字的面板。
	 */
    getPanel: function (panelName, createIfNotExisit) {
    	return new Panel(Dom.parseNode('<div>内容</div>'));
    },

    /**
	 * 注册一个键盘事件。
	 */
    registerKey: function (keyName, language, command) {

    },

    /**
	 * 注销一个键盘事件。
	 */
    unregisterKey: function (keyName) {

    },

    /**
	 * 注册一个插件。
	 */
    registerPlugin: function (pluginObject) {

    },

    /**
	 * 注销一个插件。
	 */
    unregisterPlugin: function (pluginObject) {

    },

    langs: {
    	"close": "关闭"
    }

};
