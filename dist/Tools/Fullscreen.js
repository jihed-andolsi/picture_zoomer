"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by ANDOLSI on 05/04/2018.
 */
let $ = window.$;
exports.enableFullscreen = () => {
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    else {
        let element = $('#container').get(0);
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
        else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        }
        else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
};
//# sourceMappingURL=Fullscreen.js.map