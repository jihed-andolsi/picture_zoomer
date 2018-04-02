"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Andolsi on 02/04/2018.
 */
exports.scaleToWindow = (canvas_selector) => {
    var scaleX, scaleY, scale, center;
    let canvas = document.getElementById(canvas_selector);
    //1. Scale the canvas to the correct size
    //Figure out the scale amount on each axis
    scaleX = window.innerWidth / canvas.offsetWidth;
    scaleY = window.innerHeight / canvas.offsetHeight;
    //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
    scale = Math.min(scaleX, scaleY);
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = "scale(" + scale + ")";
    canvas = document.getElementById(canvas_selector);
    canvas.width = document.getElementById('container').offsetWidth;
    canvas.height = document.getElementById('container').offsetHeight;
    if (canvas.offsetWidth > canvas.offsetHeight) {
        if (canvas.offsetWidth * scale < window.innerWidth) {
            center = "horizontally";
        }
        else {
            center = "vertically";
        }
    }
    else {
        if (canvas.offsetHeight * scale < window.innerHeight) {
            center = "vertically";
        }
        else {
            center = "horizontally";
        }
    }
    /*var margin;
     if (center === "horizontally") {
     margin = (window.innerWidth - canvas.offsetWidth * scale) / 2;
     canvas.style.marginTop = 0 + "px";
     canvas.style.marginBottom = 0 + "px";
     canvas.style.marginLeft = margin + "px";
     canvas.style.marginRight = margin + "px";
     }

     //Center vertically (for wide canvases)
     if (center === "vertically") {
     margin = (window.innerHeight - canvas.offsetHeight * scale) / 2;
     canvas.style.marginTop = margin + "px";
     canvas.style.marginBottom = margin + "px";
     canvas.style.marginLeft = 0 + "px";
     canvas.style.marginRight = 0 + "px";
     }*/
    // 3. Remove any padding from the canvas  and body and set the canvas
    // display style to "block"
    canvas.style.paddingLeft = 0 + "px";
    canvas.style.paddingRight = 0 + "px";
    canvas.style.paddingTop = 0 + "px";
    canvas.style.paddingBottom = 0 + "px";
    canvas.style.display = "block";
    // 4. Set the color of the HTML body background
    // document.body.style.backgroundColor = backgroundColor;
    // Fix some quirkiness in scaling for Safari
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("safari") != -1) {
        if (ua.indexOf("chrome") > -1) {
            // Chrome
        }
        else {
            // Safari
            // canvas.style.maxHeight = "100%";
            // canvas.style.minHeight = "100%";
        }
    }
    // 5. Return the `scale` value. This is important, because you'll need this value
    // for correct hit testing between the pointer and sprites
    return { scale, scaleX, scaleY };
};
//# sourceMappingURL=Scale.js.map