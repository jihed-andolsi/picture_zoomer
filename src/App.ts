import * as PIXI from "pixi.js";
import * as d3 from "d3";
const sprites = require("./Components/sprites.json");
const graphics = require("./Components/graphics.json");
import Button from "./Tools/Button";
import LoaderText from "./Tools/LoaderText";
require("./Assets/css/_custom.scss");
var $ = require("jquery");
import {scaleToWindow} from "./Tools/Scale";

export default class Application extends PIXI.Application {
    private Customloader = new PIXI.loaders.Loader();
    private Container = new PIXI.Container();
    private ContainerButtons = new PIXI.Container();
    private width: number;
    private height: number;
    private widthExtentMaximum: number;
    private heightExtentMaximum: number;
    private selector;
    private newGraphic = [];
    private counterGraphic: number = 0;
    private newGraphicObj = [];
    private Circls = [];
    private zoomTrans = null;
    private startDrawing: boolean = false;
    private backgroundClicked: boolean = false;
    // private zoomToBool: boolean = false;
    private view;
    private stage;
    private zoomHandler;
    private Graphics;


    private canvas = null;
    private context = null;
    private widthCanvas = null;
    private heightCanvas = null;
    private D3Interval = null;

    constructor(selectorId, width, height) {
        super(width, height, {transparent: true, autoResize: true});
        this.Container.zIndex = 0;
        this.ContainerButtons.zIndex = 1;
        this.width = width;
        this.height = height;
        this.widthExtentMaximum = this.width + 10000;
        this.heightExtentMaximum = this.width + 10000;
        this.selector = selectorId;
        this.appendView(selectorId);
        this.setup();
        this.resize();
    }

    private appendView(selectorId) {
        const $this = this;
        document.getElementById($this.selector).appendChild($this.view);
        $("canvas").addClass('row');
        $("canvas").attr('id', 'canvas-container');
        $("canvas").css('margin', '0');
    }

    private setup() {
        const $this = this;
        const s = {};
        const text = new LoaderText($this.width, $this.height);

        $this.stage.addChild(text);

        $this.stage.addChild($this.Container);
        sprites.forEach((e) => {
            $this.Customloader.add(e.name, e.url);
        });
        // loader.pre(cachingMiddleware);
        // loader.use(parsingMiddleware);
        $this.Customloader.load((loader, resources) => {
            Object.keys(resources).map((e) => {
                s[e] = new PIXI.Sprite(resources[e].texture);
            });
        });
        ($this as any ).Customloader.onProgress.add((e) => {
            (text as any).text = `Loading ${e.progress}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            (s as any).background.x = 0;
            (s as any).background.y = 0;
            (s as any).background.interactive = true;
            (s as any).background.on("pointerdown", (e) => {
                const x = $this.getD3X(e.data.global.x);
                const y = $this.getD3Y(e.data.global.y);
                if ($this.startDrawing) {
                    $this.newGraphic.push([x, y]);
                    $this.Container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                    $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                    $this.Container.addChild($this.newGraphicObj[$this.counterGraphic]);
                }

                $this.backgroundClicked = true;
            });
            $this.Container.addChild((s as any).background);
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();
        });
    }

    private addGraphics() {
        const $this = this;
        const Graphics = [];
        graphics.forEach((G) => {
            const coords = G.coords;
            const Graph = $this.createGraph(coords);
            if (Graph) {
                (Graph as any).interactive = true;
                (Graph as any).alpha = 0;
                (Graph as any).mouseover = function () {
                    (this as any).alpha = 1;
                };
                (Graph as any).mouseout = function () {
                    (this as any).alpha = 0;
                };

                (Graph as any).pointerdown = function (e) {
                    // console.dir(this);
                    // let xx = this._bounds;
                    // console.dir(xx);
                    $this.zoomTo(coords[0][0], coords[0][1], 4, Graph);
                };
                ($this as any).Container.addChild(Graph);
                Graphics.push(Graph);
            }
        });
        $this.Graphics = Graphics;
    }

    private initZoomAction() {
        const $this = this;
        $this.canvas = d3.select(`#${$this.selector} canvas`);
        $this.context = $this.canvas.node().getContext("2d");
        $this.widthCanvas = $this.canvas.property("width");
        $this.heightCanvas = $this.canvas.property("height");

        $this.zoomHandler = d3.zoom()
            .scaleExtent([.1, 8])
            .translateExtent([[0, 0], [$this.widthExtentMaximum, $this.heightExtentMaximum]])
            .on("zoom", () => {
                return $this.zoomActions($this);
            }).filter(() => {
                return !$this.D3Interval;
            });
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate(364,0).scale(0.1));
        $this.canvas.on("click", () => {
            const x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.k;
            const y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.k;
        });
    }

    private zoomActions($this) {
        const x = d3.event.transform.x;
        const y = d3.event.transform.y;
        const k = d3.event.transform.k;
        $this.zoomTrans = d3.event.transform;

        $this.canvas.attr("transform", d3.event.transform);
        $this.Container.scale.set(k);
        $this.Container.position.set(x, y);
    }

    private zoomTo(x: number, y: number, k: number, graph) {
        const $this = this;
        // constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments), translateExtent)
        //var t0 = d3.zoomIdentity;
        /*var t0 = d3.zoomTransform($this.canvas.node());

        var p0 = [x, y];
        var p1 = t0.invert(p0);
        var t = t0.translate(t0.scale($this.zoomHandler, 4),  p0, p1);
        $this.canvas.call($this.zoomHandler, t);
         */
        const trans = d3.zoomTransform($this.canvas.node());
        const fx = d3.interpolateNumber(364, x);
        const fy = d3.interpolateNumber(0, y);
        const fk = d3.interpolateNumber(trans.k, k);
        let temp = 0;
        $this.D3Interval = d3.interval(function () {
            if (temp < 1) {
                temp += 0.005;
                $this.zoomHandler.scaleBy($this.canvas, fk(temp));
                $this.zoomHandler.translateBy($this.canvas, x, y);
            } else {
                $this.D3Interval.stop();
                $this.D3Interval = null;
            }
        }, 1);
    }

    private drawCircle(x, y) {
        const $this = this;
        const c = new PIXI.Graphics();
        c.lineStyle(2, 0xFF00FF);
        c.drawCircle(x, y, 5);
        c.endFill();
        $this.Container.addChild(c);
        $this.Circls.push(c);
    }

    private removeCircls() {
        const $this = this;
        $this.Circls.map((e) => {
            $this.Container.removeChild(e);
        });
    }

    private createGraph(coords) {
        const $this = this;
        if (coords.length) {
            const newGraphicObj = new PIXI.Graphics();
            newGraphicObj.beginFill(0x0000ff, 0.5);
            newGraphicObj.lineStyle(1, 0x0000ff, 1);
            let firstCoord = [];
            coords.map((e) => {
                const [x, y] = e;
                if (!firstCoord.length) {
                    firstCoord = e;
                    newGraphicObj.moveTo(x, y);
                } else {
                    newGraphicObj.lineTo(x, e[1]);
                }
            });
            if (firstCoord) {
                const [firstX, firstY] = firstCoord;
                newGraphicObj.lineTo(firstX, firstY);
                newGraphicObj.endFill();
            }
            return newGraphicObj;
        }
        return false;
    }

    private addButtons() {
        const $this = this;
        let width = 150;
        let height = 50;
        let x = 10;
        let y = $this.height - height - 20;
        const b = new Button(width, height, x, y, "Start drawing", null);
        $this.ContainerButtons.addChild(b);
        $this.stage.addChild($this.ContainerButtons);
        (b as any).on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                (b as any).text.text = "Start drawing";
                $this.counterGraphic++;
                $this.newGraphic = [];
            } else {
                (b as any).text.text = "Stop drawing";
            }
        });
        width = 250;
        height = 50;
        x = 170;
        y = $this.height - height - 20;
        const returnLastActionB = new Button(width, height, x, y, "Return to last action", null);
        $this.ContainerButtons.addChild(returnLastActionB);
        (returnLastActionB as any).on("click", () => {
            if ($this.newGraphic.length) {
                $this.newGraphic.splice(-1, 1);
                $this.Container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                if ($this.newGraphicObj[$this.counterGraphic]) {
                    $this.Container.addChild($this.newGraphicObj[$this.counterGraphic]);
                }
            }
        });

    }

    public getD3X(x: number) {
        const $this = this;
        return (x - $this.zoomTrans.x) / $this.zoomTrans.scale
    }

    public getD3Y(y: number) {
        const $this = this;
        return (y - $this.zoomTrans.x) / $this.zoomTrans.scale
    }

    public resize() {
        const $this = this;
        $this.rendererResize($this);
        window.addEventListener('resize', ()=>{
            return $this.rendererResize($this);
        });
        window.addEventListener('deviceOrientation', ()=>{
            return $this.rendererResize($this);
        });
    };
    /**
     * Calculate the current window size and set the canvas renderer size accordingly
     */
    public rendererResize ($this) {
        let {scale, scaleX, scaleY} = scaleToWindow('canvas-container');
        //$this.Container.scale.set(scale);
    };



}

window.onload = () => {
    (() => {
        return new Application("container", document.getElementById('container').offsetWidth, document.body.clientHeight);
    })();
};
