import * as PIXI from 'pixi.js';
export class Button extends PIXI.Sprite{
    constructor(width, height, x, y, button_value, style:object | null){

        if(!style){
            style = new PIXI.TextStyle({
                fontFamily: 'Arial', // Font Family
                fontSize: 22, // Font Size
                //fontStyle: 'italic',// Font Style
                fontWeight: 'bold', // Font Weight
                fill: ['#ffffff'/*, '#F8A9F9'*/], // gradient
                //stroke: '#ffffff',
                //strokeThickness: 5,
                dropShadow: true,
                //dropShadowColor: '#000000',
                //dropShadowBlur: 4,
                //dropShadowAngle: Math.PI / 6,
                //dropShadowDistance: 6,
                //wordWrap: true,
                //wordWrapWidth: 440
            });
        }


        let b = new PIXI.Graphics();
        b.beginFill(0x0000ff, 1);
        b.drawRoundedRect(0, 0, width, height, height / 5);
        b.endFill();

        super(b.generateCanvasTexture());

        // set the x, y and anchor
        (<any>this).x = x;
        (<any>this).y = y;
        //sprite.anchor.x = 0.5;
        //sprite.anchor.y = 0.5;



        (<any>this).text = new PIXI.Text(button_value, 'arial');
        (<any>this).text['anchor'] = new PIXI.Point(0.5, 0.5);
        (<any>this).text['x'] = width/2;
        (<any>this).text['y'] = height/2;
        (<any>this).text['style'] = style;
        (<any>this).addChild((<any>this).text);
        (<any>this)['interactive'] = true;

    }
}