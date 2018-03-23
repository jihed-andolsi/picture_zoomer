import * as PIXI from 'pixi.js';

export class LoaderText extends PIXI.Text{
    constructor(width, height){
        super('Loading 0%', {
            fill: '#555555',
            fontsize: '48px',
            fontfamily: 'Arial',
            wordWrap: true,
            wordWrapWidth: 700
        });
        (<any>this).anchor = new PIXI.Point(0.5, 0.5);
        (<any>this).x = width/2;
        (<any>this).y = height/2;
    }
}