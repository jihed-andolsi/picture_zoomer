"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("pixi.js");
class LoaderText extends PIXI.Text {
    constructor(width, height) {
        super("Loading 0%", {
            fill: "#555555",
            fontsize: "48px",
            fontfamily: "Arial",
            wordWrap: true,
            wordWrapWidth: 700,
        });
        this.anchor = new PIXI.Point(0.5, 0.5);
        this.x = width / 2;
        this.y = height / 2;
    }
}
exports.default = LoaderText;
//# sourceMappingURL=LoaderText.js.map