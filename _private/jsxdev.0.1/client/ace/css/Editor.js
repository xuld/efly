
include('ace/lib/Dom.js');

define(function() {

    //http://themes.googleusercontent.com/static/fonts/droidsansmono/v3/ns-m2xQYezAtqh7ai59hJYW_AySPyikQrZReizgrnuw.ttf
    /*@import url(http://fonts.googleapis.com/css?family=Droid+Sans+Mono);*/

    var css_dir = Jsx.format('ace/css/');

    var google = '\
@media screen {\
@font-face {\
  font-family: \'Droid Sans Mono\';\
  font-style: normal;\
  font-weight: normal;\
  src: local(\'Droid Sans Mono\'), local(\'DroidSansMono\'), url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJUYuTAAIFFn5GTWtryCmBQ4.woff\') format(\'woff\');\
}\
}';

    var firefox_opera = '\
@font-face {\
  font-family: \'Droid Sans Mono\';\
  font-style: normal;\
  font-weight: normal;\
  src: local(\'Droid Sans Mono\'), local(\'DroidSansMono\'), url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJUYuTAAIFFn5GTWtryCmBQ4.woff\') format(\'woff\');\
}';

    var safari = '\
@font-face {\
  font-family: \'Droid Sans Mono\';\
  font-style: normal;\
  font-weight: normal;\
  src: local(\'Droid Sans Mono\'), local(\'DroidSansMono\'), url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJYW_AySPyikQrZReizgrnuw.ttf\') format(\'truetype\');\
}';

    var ie = '\
@font-face {\
  font-family: \'Droid Sans Mono\';\
  font-style: normal;\
  font-weight: normal;\
  src: url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJTwtzT4qNq-faudv5qbO9-U.eot\');\
  src: local(\'Droid Sans Mono\'), local(\'DroidSansMono\'), url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJTwtzT4qNq-faudv5qbO9-U.eot\') format(\'embedded-opentype\'), url(\'' + css_dir + 'ns-m2xQYezAtqh7ai59hJUYuTAAIFFn5GTWtryCmBQ4.woff\') format(\'woff\');\
}';

//****

    var UA = Jsx.UA;
    var cssText = (
        navigator.userAgent.indexOf(' Chrome/') !== -1 ? google :
        UA.TRIDENT ? ie :
        UA.GECKO || UA.PRESTO ? firefox_opera :
        UA.WEBKIT ? safari : '') +
'\
\
.ace_editor {\
    position: absolute;\
    overflow: hidden;\
    font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', \'Droid Sans Mono\', \'Courier New\', monospace;\
    font-size: 11px;\
}\
\
.ace_scroller {\
    position: absolute;\
    overflow-x: scroll;\
    overflow-y: hidden;\
}\
\
.ace_content {\
    position: absolute;\
    box-sizing: border-box;\
    -moz-box-sizing: border-box;\
    -webkit-box-sizing: border-box;\
    cursor: text;\
}\
\
/* setting pointer-events: auto; on node under the mouse, which changes during scroll,\
  will break mouse wheel scrolling in Safari */\
.ace_content * {\
     pointer-events: none;\
}\
\
.ace_composition {\
    position: absolute;\
    background: #555;\
    color: #DDD;\
    z-index: 4;\
}\
\
.ace_gutter {\
    position: absolute;\
    overflow-x: hidden;\
    overflow-y: hidden;\
    height: 100%;\
    cursor: default;\
}\
\
.ace_gutter-cell.ace_error {\
    background-image: url("data:image/gif,GIF89a%10%00%10%00%D5%00%00%F5or%F5%87%88%F5nr%F4ns%EBmq%F5z%7F%DDJT%DEKS%DFOW%F1Yc%F2ah%CE(7%CE)8%D18E%DD%40M%F2KZ%EBU%60%F4%60m%DCir%C8%16(%C8%19*%CE%255%F1%3FR%F1%3FS%E6%AB%B5%CA%5DI%CEn%5E%F7%A2%9A%C9G%3E%E0a%5B%F7%89%85%F5yy%F6%82%80%ED%82%80%FF%BF%BF%E3%C4%C4%FF%FF%FF%FF%FF%FF%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00!%F9%04%01%00%00%25%00%2C%00%00%00%00%10%00%10%00%00%06p%C0%92pH%2C%1A%8F%C8%D2H%93%E1d4%23%E4%88%D3%09mB%1DN%B48%F5%90%40%60%92G%5B%94%20%3E%22%D2%87%24%FA%20%24%C5%06A%00%20%B1%07%02B%A38%89X.v%17%82%11%13q%10%0Fi%24%0F%8B%10%7BD%12%0Ei%09%92%09%0EpD%18%15%24%0A%9Ci%05%0C%18F%18%0B%07%04%01%04%06%A0H%18%12%0D%14%0D%12%A1I%B3%B4%B5IA%00%3B");\
    background-repeat: no-repeat;\
    background-position: 4px center;\
}\
\
.ace_gutter-cell.ace_warning {\
    background-image: url("data:image/gif,GIF89a%10%00%10%00%D5%00%00%FF%DBr%FF%DE%81%FF%E2%8D%FF%E2%8F%FF%E4%96%FF%E3%97%FF%E5%9D%FF%E6%9E%FF%EE%C1%FF%C8Z%FF%CDk%FF%D0s%FF%D4%81%FF%D5%82%FF%D5%83%FF%DC%97%FF%DE%9D%FF%E7%B8%FF%CCl%7BQ%13%80U%15%82W%16%81U%16%89%5B%18%87%5B%18%8C%5E%1A%94d%1D%C5%83-%C9%87%2F%C6%84.%C6%85.%CD%8B2%C9%871%CB%8A3%CD%8B5%DC%98%3F%DF%9BB%E0%9CC%E1%A5U%CB%871%CF%8B5%D1%8D6%DB%97%40%DF%9AB%DD%99B%E3%B0p%E7%CC%AE%FF%FF%FF%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00!%F9%04%01%00%00%2F%00%2C%00%00%00%00%10%00%10%00%00%06a%C0%97pH%2C%1A%8FH%A1%ABTr%25%87%2B%04%82%F4%7C%B9X%91%08%CB%99%1C!%26%13%84*iJ9(%15G%CA%84%14%01%1A%97%0C%03%80%3A%9A%3E%81%84%3E%11%08%B1%8B%20%02%12%0F%18%1A%0F%0A%03\'F%1C%04%0B%10%16%18%10%0B%05%1CF%1D-%06%07%9A%9A-%1EG%1B%A0%A1%A0U%A4%A5%A6BA%00%3B");\
    background-repeat: no-repeat;\
    background-position: 4px center;\
}\
\
/*UPDATE APPEND DEBUG*/\
.ace_gutter-cell.ace_breakpoint {\
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJOSURBVDjLpZI9T1RBFIaf3buAoBgJ8rl6QVBJVNDCShMLOhBj6T+wNUaDjY0WmpBIgYpAjL/AShJ+gVYYYRPIony5IETkQxZ2770zc2fGYpflQy2MJzk5J5M5z/vO5ESstfxPxA4erL4Zuh4pLnoaiUZdq7XAGKzRJVbIBZ3JPLJaD9c/eCj/CFgZfNl5qK5q8EhTXdxxLKgQjAFr0NK0ppOpt9n51D2gd2cmsvOElVcvOoprKvuPtriNzsY8rH+H0ECoQEg4WklY1czP8akZby51p6G3b6QAWBl43llSVTlUfuZE3NmYh9Vl0HkHSuVq4ENFNWFdC+uJ5JI/9/V2Y//rkShA1HF6yk/VxJ0f07CcgkCB7+fSC8Dzcy7mp4l9/khlUzwecaI9hT+wRrsOISylcsphCFLl1RXIvBMpYDZJrKYRjHELACNEgC/KCQQofWBQ5nuV64UAP8AEfrDrQEiLlJD18+p7BguwfAoBUmKEsLsAGZSiFWxtgWWP4gGAkuB5YDRWylKAKIDJZBa1H8Kx47C1Cdls7qLnQTZffQ+20lB7EiU1ent7sQBQ6+vdq2PJ5dC9ABW1sJnOQbL5Qc/HpNOYehf/4lW+jY4vh2tr3fsWafrWzRtlDW5f9aVzjUVj72FmCqzBypBQCKzbjLp8jZUPo7OZyYm7bYkvw/sAAFMd7V3lp5sGqs+fjRcZhVYKY0xupwysfpogk0jcb5ucffbbKu9Esv1Kl1N2+Ekk5rg2DIXRmog1Jdr3F/Tm5mO0edc6MSP/CvjX+AV0DoH1Z+D54gAAAABJRU5ErkJggg==");\
    background-repeat: no-repeat;\
    background-position: 0px center;\
}\
.ace_gutter-cell .ace_debug_arrow {\
    height: 100%;\
    width: 16px;\
    display: inline-block;\
    float: left;\
}\
.ace_debug_arrow.background {\
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAFfKj/FAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAABvUExURf//mf//Zv//M///AMzMzJmZmZlmZplmAMzJ4f/+Sfz1K/77WP36a/77df77gv76jPvwGP75k/zoBujkvNvEIvPZLODJMtnOdtbLfeLfyta5C+TOQNHFgcW6g7OfRN7Yv8ObAL2yirSnltfU1P///xgX6E4AAAAldFJOU////////////////////////////////////////////////wA/z0JPAAAAs0lEQVR42mJQUWFQ4QQIIAYgySMAEEBAkh/IUxFSAQggIAESVxFTYeDlZmIBsjhUAAIILCYFFufj5+NllAIyFBWVBIQ4VMBSIAAQQCgMcUkoQ4ZfGcgQF+TjY+RWVmGQ4eXh5uRSUGGQV1RkE1CAqFFSQNYOEGBwBrqABL+0JFRAWFxCQkZGDugUEWWwgAw/A5DDy8jNycklxQIUkBUFAS4mJi4hBQ6EGazMYC6SADsHDmsBjU0cpU6e5B0AAAAASUVORK5CYII=");\
}\
.ace_editor .ace_sb {\
    position: absolute;\
    overflow-x: hidden;\
    overflow-y: scroll;\
    right: 0;\
}\
\
.ace_editor .ace_sb div {\
    position: absolute;\
    width: 1px;\
    left: 0;\
}\
\
.ace_editor .ace_print_margin_layer {\
    z-index: 0;\
    position: absolute;\
    overflow: hidden;\
    margin: 0;\
    left: 0;\
    height: 100%;\
    width: 100%;\
}\
\
.ace_editor .ace_print_margin {\
    position: absolute;\
    height: 100%;\
}\
\
.ace_editor textarea {\
    position: fixed;\
    z-index: -1;\
    width: 10px;\
    height: 30px;\
    opacity: 0;\
    background: transparent;\
    appearance: none;\
    -moz-appearance: none;\
    border: none;\
    resize: none;\
    outline: none;\
    overflow: hidden;\
}\
\
.ace_layer {\
    z-index: 1;\
    position: absolute;\
    white-space: nowrap;\
    height: 100%;\
    width: 100%;\
    box-sizing: border-box;\
    -moz-box-sizing: border-box;\
    -webkit-box-sizing: border-box;\
}\
\
.ace_text-layer {\
    color: black;\
}\
\
.ace_cjk {\
    display: inline-block;\
    text-align: center;\
}\
\
.ace_cursor-layer {\
    z-index: 4;\
}\
\
.ace_cursor {\
    z-index: 4;\
    position: absolute;\
}\
\
.ace_cursor.ace_hidden {\
    opacity: 0.2;\
}\
\
.ace_line {\
    white-space: nowrap;\
}\
\
.ace_marker-layer .ace_step {\
    position: absolute;\
    z-index: 3;\
}\
\
.ace_marker-layer .ace_selection {\
    position: absolute;\
    z-index: 4;\
}\
\
.ace_marker-layer .ace_bracket {\
    position: absolute;\
    z-index: 5;\
}\
\
.ace_marker-layer .ace_active_line {\
    position: absolute;\
    z-index: 2;\
}\
\
.ace_marker-layer .ace_break, .ace_marker-layer .ace_selected_word {\
    position: absolute;\
    z-index: 6;\
    box-sizing: border-box;\
    -moz-box-sizing: border-box;\
    -webkit-box-sizing: border-box;\
}\
\
\.ace_marker-layer .ace_selected_word {\
    z-index: 7;\
}\
\
.ace_line .ace_fold {\
    cursor: pointer;\
    color: darkred;\
    -moz-outline-radius: 4px;\
    outline-radius: 4px;\
    border-radius: 4px;\
    outline: 1px solid #1C00FF;\
    outline-offset: -2px;\
    pointer-events: auto;\
}\
\
.ace_dark .ace_fold {\
    color: #E6E1DC;\
    outline-color: #FC6F09;\
}\
\
.ace_fold:hover{\
    background: gold!important;\
}\
\
.ace_dragging .ace_content {\
    cursor: move;\
}\
\
.ace_folding-enabled .ace_gutter-cell {\
    padding-right: 9px!important;\
}\
\
\
.ace_fold-widget {\
    margin-right: -9px;\
    display: inline-block;\
    height: 9px;\
    width: 9px;\
    /*UPDATE*/\
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAMAAAGgSMa0AAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAnUExURTFKY////5ytxtjh8efv9+vz/6W11pSlvbnK5Jylvb3GxsbW66m92hyJui4AAABjSURBVHjaYmDmYuDiAgggBk4GBoAAAmGAAGJgYmcAA4AAYmBiZGRhYGBnYeZgAAggBiYmTnYGRkZWDgZGBgYeBlZmbjawGoAAAykCAlagQiYwzcwD1AKiwSrYWbg5eNjY2BgANksBNUYOF/sAAAAASUVORK5CYII=") no-repeat;\
    background-origin: content-box;\
    padding: 1px 0;\
}\
\
.ace_fold-widget.end{\
    transform: scaleY(-1);\
    -moz-transform: scaleY(-1);\
    -webkit-transform: scaleY(-1);\
    background: none;\
    opacity:0.8;\
}\
\
.ace_fold-widget.closed{\
    -moz-transform: none;\
    -webkit-transform: none;\
    /*UPDATE*/\
    background-image: url("data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAMAAAGgSMa0AAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAnUExURTFKY////5ytxufv96W11pSlvdTe8cbS5+vz/5ylvb3Gxqm92rXI4y8fGK8AAABlSURBVHjaYmDjYuDiAgggBk4GBoAAAmGAAGJgYmUAA4AAYmBiZGBmYGBlZuBhAAggBiYmTlYGRkYOdgZGBgZuBg42dhawGoAAAyoCAQ6gQhCLgZmNG6gFxAerYGVm5+FmYWFhAAA0zwEf4M+jRAAAAABJRU5ErkJggg==");\
}\
\
.ace_fold-widget:hover {\
/*UPDATE*/\
}\
\
.ace_fold-widget.closed:hover {\
/*UPDATE*/\
}\
';

    // import CSS once
    ace.lib.Dom.importCssString(cssText, 'ace_editor');

});