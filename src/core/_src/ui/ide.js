
//#include panel.js

/**
 * 表示一个集成开发环境。
 */
var ide = {

	//#region 公共字段

    /**
	 * 视图对象。
	 */
	view: null,

    /**
	 * 配置对象。
	 */
	configs: null,

	/**
	 * 语言包。
	 */
	lang: null,

	//#endregion 命令
	
	//#region 命令

	commands: {},

    /**
	 * 在当前 IDE 注册一个命令。
	 */
	registerCommand: function (commandName, command) {
		this.commands[commandName] = command;
    },

    /**
	 * 在当前 IDE 注销一个命令。
	 */
    unregisterCommand: function (commandName) {
    	delete this.commands[commandName];
    },

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

	//#endregion

	//#region 菜单

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

	//#endregion

	//#region 

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

	//#endregion

	//#region 

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

	//#endregion

	//#region TAB

    openTab: function (id, name, title, panel) {
    	return this.view.regions.center.addTab(id, name, title, panel);
    },

    closeTab: function () {

    },

	//#endregion

    init: function () {
    	// 初始化对象。
    	this.view = new Viewport(document.body);
    	this.view.set(this.configs.view);
    }

};
