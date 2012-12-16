/**
 * @class jsxdev.dev.TextEditor
 * extends ace.Editor
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('ace/mode/Text.js');
include('ace/mode/JavaScript.js');
include('ace/mode/Css.js');

include('ace/mode/MatchingBraceOutdent.js');
include('ace/mode/behaviour/CstyleBehaviour.js');
include('ace/mode/DocCommentHighlightRules.js');
include('ace/mode/TextHighlightRules.js');
include('ace/mode/XmlUtil.js');
include('ace/mode/folding/Cstyle.js');
include('ace/mode/folding/Xml.js');
include('ace/mode/behaviour/XmlBehaviour.js');
include('ace/worker/Mirror.js');
include('ace/Tokenizer.js');
include('ace/lib/Lang.js');
include('ace/lib/Dom.js');
include('ace/Range.js');
include('ace/VirtualRenderer.js');
include('ace/UndoManager.js');
include('ace/EditSession.js');
include('ace/Editor.js');
include('Jsx/Thread.js');

define(function() {
    var Lang = ace.lib.Lang;

    var THEME_CHEAE_NAME = 'EDITOR_THEME';
    var MODE_VALUE = {};

    var MODE = [
        ['Html', /^(html|htm|vx)$/i, function(cb) { include('ace/mode/Html.js', cb); } ],
        ['JavaScript', /^(js)$/i, function(cb) { include('ace/mode/JavaScript.js', cb); } ],
        ['Css', /^(css)$/i, function(cb) { include('ace/mode/Css.js', cb); } ],
        ['Scss', /^(scss)$/i, function(cb) { include('ace/mode/Scss.js', cb); } ],
        ['Xml', /^(xml)$/i, function(cb) { include('ace/mode/Xml.js', cb); } ],
        ['Ccpp', /^(cc|c|h|cpp)$/i, function(cb) { include('ace/mode/Ccpp.js', cb); } ],
        ['Coffee', /^(coffee)$/i, function(cb) { include('ace/mode/Coffee.js', cb); } ],
        ['Clojure', /^(clj)$/i, function(cb) { include('ace/mode/Clojure.js', cb); } ],
        ['Coldfusion', /^(cfm)$/i, function(cb) { include('ace/mode/Coldfusion.js', cb); } ],
        ['CSharp', /^(cs)$/i, function(cb) { include('ace/mode/CSharp.js', cb); } ],
        ['Groovy', /^(groovy)$/i, function(cb) { include('ace/mode/Groovy.js', cb); } ],
        ['Haxe', /^(hx)$/i, function(cb) { include('ace/mode/Haxe.js', cb); } ],
        ['Java', /^(java)$/i, function(cb) { include('ace/mode/Java.js', cb); } ],
        ['Json', /^(json|conf)$/i, function(cb) { include('ace/mode/Json.js', cb); } ],
        ['Latex', /^(tex)$/i, function(cb) { include('ace/mode/Latex.js', cb); } ],
        ['Lua', /^(lua)$/i, function(cb) { include('ace/mode/Lua.js', cb); } ],
        ['Markdown', /^(markdown|md|mkd)$/i, function(cb) { include('ace/mode/Markdown.js', cb); } ],
        ['Ocaml', /^(mli|ml)$/i, function(cb) { include('ace/mode/Ocaml.js', cb); } ],
        ['Perl', /^(pl)$/i, function(cb) { include('ace/mode/Perl.js', cb); } ],
        ['Php', /^(php)$/i, function(cb) { include('ace/mode/Php.js', cb); } ],
        ['Powershell', /^(psl)$/i, function(cb) { include('ace/mode/Powershell.js', cb); } ],
        ['Python', /^(py)$/i, function(cb) { include('ace/mode/Python.js', cb); } ],
        ['Ruby', /^(rb)$/i, function(cb) { include('ace/mode/Ruby.js', cb); } ],
        ['Scad', /^(undefined)$/i, function(cb) { include('ace/mode/Scad.js', cb); } ],
        ['Scala', /^(scala)$/i, function(cb) { include('ace/mode/Scala.js', cb); } ],
        ['Sql', /^(sql)$/i, function(cb) { include('ace/mode/Sql.js', cb); } ],
        ['Svg', /^(svg)$/, function(cb) { include('ace/mode/Svg.js', cb); } ],
        ['Text', /^(txt|.+)$/i, function(cb) { include('ace/mode/Text.js', cb); } ]
    ];

    var THEME = {
        Clouds: function(cb) { include('ace/theme/Clouds.js', cb); },
        CloudsMidnight: function(cb) { include('ace/theme/CloudsMidnight.js', cb); },
        Cobalt: function(cb) { include('ace/theme/Cobalt.js', cb); },
        CrimsonEditor: function(cb) { include('ace/theme/CrimsonEditor.js', cb); },
        Dawn: function(cb) { include('ace/theme/Dawn.js', cb); },
        Eclipse: function(cb) { include('ace/theme/Eclipse.js', cb); },
        IdleFingers: function(cb) { include('ace/theme/IdleFingers.js', cb); },
        KrTheme: function(cb) { include('ace/theme/KrTheme.js', cb); },
        Merbivore: function(cb) { include('ace/theme/Merbivore.js', cb); },
        MerbivoreSoft: function(cb) { include('ace/theme/MerbivoreSoft.js', cb); },
        MonoIndustrial: function(cb) { include('ace/theme/MonoIndustrial.js', cb); },
        Monokai: function(cb) { include('ace/theme/Monokai.js', cb); },
        PastelOnDark: function(cb) { include('ace/theme/PastelOnDark.js', cb); },
        SolarizedDark: function(cb) { include('ace/theme/SolarizedDark.js', cb); },
        SolarizedLight: function(cb) { include('ace/theme/SolarizedLight.js', cb); },
        Textmate: function(cb) { include('ace/theme/Textmate.js', cb); },
        Tomorrow: function(cb) { include('ace/theme/Tomorrow.js', cb); },
        TomorrowNight: function(cb) { include('ace/theme/TomorrowNight.js', cb); },
        TomorrowNightBlue: function(cb) { include('ace/theme/TomorrowNightBlue.js', cb); },
        TomorrowNightBright: function(cb) { include('ace/theme/TomorrowNightBright.js', cb); },
        TomorrowNightEighties: function(cb) { include('ace/theme/TomorrowNightEighties.js', cb); },
        Twilight: function(cb) { include('ace/theme/Twilight.js', cb); },
        VibrantInk: function(cb) { include('ace/theme/VibrantInk.js', cb); },
        VisualStudio: function(cb) { include('ace/theme/VisualStudio.js', cb); }
    };

    function initCommand(_this) {
        var commands = _this.commands;
        jsxdev.Commands.get().commands.forEach(commands.addCommand, commands);
    }   


    Class('jsxdev.dev.TextEditor', ace.Editor, {

        /**
         * constructor function
         * @param {ace.VirtualRenderer} renderer
         * @param {ace.EditSession}     session    (Optional)
         * @constructor
         */
        TextEditor: function(renderer, session) {
            this.Editor(renderer, session);
            initCommand(this);
            this.setTheme();
        },

        /**
         * set theme 
         * @method setTheme
         * @param {String} name
         */
        setTheme: function(themename) {
            /*
            Clouds
            CloudsMidnight
            Cobalt
            CrimsonEditor
            Dawn
            Eclipse
            IdleFingers
            KrTheme
            Merbivore
            MerbivoreSoft
            MonoIndustrial
            Monokai
            PastelOnDark
            SolarizedDark
            SolarizedLight
            Textmate
            Tomorrow
            TomorrowNight
            TomorrowNightBlue
            TomorrowNightBright
            TomorrowNightEighties
            Twilight
            VibrantInk
            VisualStudio
            */
            themename = themename || localStorage.getItem(THEME_CHEAE_NAME) || 'VisualStudio';

            var _this = this;
            var fn = THEME[themename];
            if (!fn)
                return Ext.Msg.error('', 'Theme does not exist');

            fn(function(err) {
                if (err)
                    return Ext.Msg.error('', err.message);

                localStorage.setItem(THEME_CHEAE_NAME, themename);
                _this.ace_Editor_setTheme('ace/theme/' + themename);
            });
        }

    }, {

        /**
         * get mode by file name
         * @param {String}   filename
         * @param {Function} cb
         * @static
         */
        getMode: function(filename, cb) {
            var mat = filename.match(/.([^\.]+)$/);
            var extname = 'txt';

            if (mat)
                extname = mat[1];

            for (var i = 0, l = MODE.length; i < l; i++) {
                var item = MODE[i];

                if (!item[1].test(extname))
                    continue;

                var name = item[0];
                var mode = MODE_VALUE[name];
                if (mode)
                    return nextTick(cb, null, mode);

                item[2](function(err) {
                    if (err)
                        return cb(err);
                    var Type = Jsx.get('ace.mode.' + name);

                    MODE_VALUE[name] = mode = new Type();
                    cb(err, mode);
                });
                return;
            }
        }
    });

});