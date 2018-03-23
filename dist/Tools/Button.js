"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("pixi.js");
class Button extends PIXI.Sprite {
    constructor(width, height, x, y, button_value, style) {
        if (!style) {
            style = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 22,
                //fontStyle: 'italic',// Font Style
                fontWeight: 'bold',
                fill: ['#ffffff' /*, '#F8A9F9'*/],
                //stroke: '#ffffff',
                //strokeThickness: 5,
                dropShadow: true,
            });
        }
        let b = new PIXI.Graphics();
        b.beginFill(0x0000ff, 1);
        b.drawRoundedRect(0, 0, width, height, height / 5);
        b.endFill();
        super(b.generateCanvasTexture());
        // set the x, y and anchor
        this.x = x;
        this.y = y;
        //sprite.anchor.x = 0.5;
        //sprite.anchor.y = 0.5;
        this.text = new PIXI.Text(button_value, 'arial');
        this.text['anchor'] = new PIXI.Point(0.5, 0.5);
        this.text['x'] = width / 2;
        this.text['y'] = height / 2;
        this.text['style'] = style;
        this.addChild(this.text);
        this['interactive'] = true;
    }
}
exports.Button = Button;
//# sourceMappingURL=Button.js.map