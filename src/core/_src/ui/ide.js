
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
    options: null,

    /**
	 * 根据 options 更新编辑器状态。
	 */
    update: function (options) {

        this.options = options;

        if (options.toolbar === false) {
            this.toolbar.hide();
        } else {
            this.toolbar.update(options.menu);
        }

        if (options.statusbar === false) {
            this.statusbar.hide();
        }

        this.onResize();

        for (var panel in options.panels) {

            // 如果这个面板没有创建过，则创建一个。
            if (!this.panels[panel]) {
                this.panels[panel] = this.createPanel(panel);
            }

            // 更新面板的配置。
            this.panels[panel].update(options.panels[panel]);
        }


    },

    /**
	 * 创建一个面板。
	 */
    createPanel: function (name) {

    },

    /**
	 * 改变编辑器容器大小后执行。
	 */
    onResize: function () {
        this.main.resizeTo(this.elem.offsetWidth, this.elem.offsetHeight - this.toolbar.elem.offsetHeight - this.statusbar.elem.offsetHeight);
    },

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

    /**
	 * 获取指定名字的面板。
	 */
    getPanel: function (panelName, createIfNotExisit) {

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

    }

};
