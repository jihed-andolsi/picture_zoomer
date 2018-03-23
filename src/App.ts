import * as PIXI from 'pixi.js';
import * as d3 from "d3";

let sprites = require('./Components/sprites.json');
let graphics = require('./Components/graphics.json');


import {Button} from "./Tools/Button.ts";
import {LoaderText} from "./Tools/LoaderText.ts";

export default class Application extends PIXI.Application {
    private Customloader = new PIXI.loaders.Loader();
    private container = new PIXI.Container();
    private containerButtons = new PIXI.Container();
    private width:number;
    private height:number;
    private selector;
    private newGraphic = [];
    private counterGraphic:number = 0;
    private newGraphicObj = [];
    private Circls = [];
    private zoomTrans = {x: 0, y: 0, scale: 1};
    private startDrawing:boolean = false;
    private backgroundClicked:boolean = false;
    private zoomToBool:boolean = false;
    private view;
    private stage;
    private zoom_handler;
    private pixiCanvas;
    private Graphics;

    constructor(selectorId, width, height) {
        super(width, height, {transparent: true});
        let $this = this;
        $this.container.zIndex = 0;
        $this.containerButtons.zIndex = 1;
        $this.width = width;
        $this.height = height
        $this.selector = selectorId;
        $this.appendView(selectorId);
        $this.setup();
    }

    appendView(selectorId) {
        let $this = this;
        document.getElementById($this.selector).appendChild($this.view);
    }

    setup() {
        let $this = this;
        let s = {};
        let text = new LoaderText($this.width, $this.height);

        $this.stage.addChild(text);

        $this.stage.addChild($this.container);
        sprites.forEach(e => {
            $this.Customloader.add(e.name, e.url);
        })
        //loader.pre(cachingMiddleware);
        //loader.use(parsingMiddleware);
        $this.Customloader.load((loader, resources) => {
            Object.keys(resources).map(e => {
                s[e] = new PIXI.Sprite(resources[e].texture);
            });
        });
        (<any>$this).Customloader.onProgress.add((e) => {
            (<any>text).text = 'Loading ' + e.progress + '%';
        }); // called once per loaded/errored file
        $this.Customloader.onError.add(() => {
        }); // called once per errored file
        $this.Customloader.onLoad.add(() => {
        }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            (<any>s).background.x = 0;
            (<any>s).background.y = 0;
            (<any>s).background.interactive = true;
            (<any>s).background.on('pointerdown', ()=>{
                $this.backgroundClicked = true;
            })
            $this.container.addChild((<any>s).background);
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();

        });
    }

    addGraphics() {
        let $this = this;
        let Graphics = [];
        graphics.forEach(G => {
            let coords = G.coords;
            let Graph = $this.createGraph(coords);
            if(Graph){
                (<any>Graph).interactive = true;
                (<any>Graph).alpha = 0;
                (<any>Graph).mouseover = function () {
                    (<any>this).alpha = 1;
                };
                (<any>Graph).mouseout = function () {
                    (<any>this).alpha = 0;
                };
                /*(<any>Graph).on('click', () => {
                    // let x = (<any>this).x;
                    // let y = (<any>this).y;
                    // $this.zoomTo(x, y);
                    (<any>$this).zoomToBool = true;

                })*/
                (<any>$this).container.addChild(Graph);
                Graphics.push(Graph)
            }
        })
        $this.Graphics = Graphics;
    }

    initZoomAction() {
        let $this = this;
        let transform = d3.zoomIdentity.scale(0.1);
        $this.zoom_handler = d3.zoom().scaleExtent([.1, 8]).translateExtent([[0, 0], [$this.width + 10000, $this.height + 10000]]).on("zoom", zoomActions);
        $this.pixiCanvas = d3.select('#' + $this.selector + ' canvas');
        $this.pixiCanvas.call($this.zoom_handler).call($this.zoom_handler.transform, transform);
        //pixiCanvas.style("width", $this.width).style("height", $this.height);

        $this.pixiCanvas.on("click", function () {
            let x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.scale;
            let y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.scale;
            if ($this.startDrawing && $this.backgroundClicked) {
                $this.newGraphic.push([x, y]);
                $this.container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                $this.container.addChild($this.newGraphicObj[$this.counterGraphic]);
            }
            if($this.zoomToBool){
                /*$this.pixiCanvas.transition()
                    .call($this.zoomTo([x, y], 6).event)*/
            }
            $this.zoomToBool = false;
            $this.backgroundClicked = false;
        })


        function zoomActions() {
            $this.zoomTrans.x = d3.event.transform.x;
            $this.zoomTrans.y = d3.event.transform.y;
            $this.zoomTrans.scale = d3.event.transform.k;
            $this.pixiCanvas.attr("transform", d3.event.transform);


            //if(d3.event.transform.k > 1){
            let k = d3.event.transform.k;
            $this.container.scale.set(k);

            //if(d3.event.transform.x)

            let x = d3.event.transform.x;
            let y = d3.event.transform.y;
            $this.container.position.set(x, y);
        }
    }

    /*zoomTo(x, y) {
        let $this = this;
        let zoom = d3.zoom();
        let selection = d3.select('#' + $this.selector + ' canvas');
        let t = zoom.scaleTo(selection, 6)
        selection.call($this.zoomHandler.transform, t);
    }*/

    zoomTo(point, scale) {

    }

    drawCircle(x, y) {
        let $this = this;
        let c = new PIXI.Graphics();
        c.lineStyle(2, 0xFF00FF);
        c.drawCircle(x, y, 5);
        c.endFill();
        $this.container.addChild(c);
        $this.Circls.push(c);
    }

    removeCircls() {
        let $this = this;
        $this.Circls.map(e => {
            $this.container.removeChild(e);
        })
    }

    createGraph(coords) {
        let $this = this;
        if(coords.length){
            let newGraphicObj = new PIXI.Graphics();
            newGraphicObj.beginFill(0x0000ff, 0.5);
            newGraphicObj.lineStyle(1, 0x0000ff, 1);
            let firstCoord = [];
            coords.map(e => {
                let [x, y] = e;
                if (!firstCoord.length) {
                    firstCoord = e;
                    newGraphicObj.moveTo(x, y);
                } else {
                    newGraphicObj.lineTo(x, e[1]);
                }
            })
            if (firstCoord) {
                let [firstX, firstY] = firstCoord;
                newGraphicObj.lineTo(firstX, firstY);
                newGraphicObj.endFill();
            }
            return newGraphicObj;
        }
        return false;
    }


    addButtons() {
        let $this = this;
        let width = 150;
        let height = 50;
        let x = 10;
        let y = $this.height - height - 20;
        let b = new Button(width, height, x, y, 'Start drawing', null);


        $this.containerButtons.addChild(b);
        $this.stage.addChild($this.containerButtons);
        (<any>b).on('click', () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                (<any>b).text.text = 'Start drawing';
                $this.counterGraphic ++;
                $this.newGraphic = [];
            } else {
                (<any>b).text.text = 'Stop drawing';
            }
        });


        width = 250;
        height = 50;
        x = 170;
        y = $this.height - height - 20;
        let returnLastActionB = new Button(width, height, x, y, 'Return to last action', null);
        $this.containerButtons.addChild(returnLastActionB);
        (<any>returnLastActionB).on('click', () => {
            if($this.newGraphic.length){
                $this.newGraphic.splice(-1, 1);
                $this.container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                if($this.newGraphicObj[$this.counterGraphic]){
                    $this.container.addChild($this.newGraphicObj[$this.counterGraphic]);
                }
            }
        })

    }

}

window.onload = () => {
    new Application('container', 1000, 683);
};