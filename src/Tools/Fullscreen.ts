/**
 * Created by ANDOLSI on 05/04/2018.
 */
let $ = (window as any).$;
export let enableFullscreen = () => {
    if (
        (document as any).fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    ) {
        if ((document as any).exitFullscreen) {
            (document as any).exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
    } else {
        let element = $('#container').get(0);
        if ((element as any).requestFullscreen) {
            (element as any).requestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
        } else if ((element as any).webkitRequestFullscreen) {
            (element as any).webkitRequestFullscreen((Element as any).ALLOW_KEYBOARD_INPUT);
        } else if ((element as any).msRequestFullscreen) {
            (element as any).msRequestFullscreen();
        }
    }
}
