"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("pixi.js");
const d3 = require("d3");
const sprites = require("./Components/sprites.json");
const graphics = require("./Components/graphics.json");
const Button_1 = require("./Tools/Button");
const LoaderText_1 = require("./Tools/LoaderText");
class Application extends PIXI.Application {
    constructor(selectorId, width, height) {
        super(width, height, { transparent: true });
        this.Customloader = new PIXI.loaders.Loader();
        this.Container = new PIXI.Container();
        this.ContainerButtons = new PIXI.Container();
        this.newGraphic = [];
        this.counterGraphic = 0;
        this.newGraphicObj = [];
        this.Circls = [];
        this.zoomTrans = { x: 0, y: 0, scale: .1 };
        this.startDrawing = false;
        this.backgroundClicked = false;
        this.canvas = null;
        this.context = null;
        this.widthCanvas = null;
        this.heightCanvas = null;
        this.D3Interval = null;
        const $this = this;
        $this.Container.zIndex = 0;
        $this.ContainerButtons.zIndex = 1;
        $this.width = width;
        $this.height = height;
        $this.widthExtentMaximum = $this.width + 10000;
        $this.heightExtentMaximum = $this.width + 10000;
        $this.selector = selectorId;
        $this.appendView(selectorId);
        $this.setup();
    }
    appendView(selectorId) {
        const $this = this;
        document.getElementById($this.selector).appendChild($this.view);
    }
    setup() {
        const $this = this;
        const s = {};
        const text = new LoaderText_1.default($this.width, $this.height);
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
        $this.Customloader.onProgress.add((e) => {
            text.text = `Loading ${e.progress}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            s.background.x = 0;
            s.background.y = 0;
            s.background.interactive = true;
            s.background.on("pointerdown", (e) => {
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
            $this.Container.addChild(s.background);
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();
        });
    }
    addGraphics() {
        const $this = this;
        const Graphics = [];
        graphics.forEach((G) => {
            const coords = G.coords;
            const Graph = $this.createGraph(coords);
            if (Graph) {
                Graph.interactive = true;
                Graph.alpha = 0;
                Graph.mouseover = function () {
                    this.alpha = 1;
                };
                Graph.mouseout = function () {
                    this.alpha = 0;
                };
                Graph.pointerdown = function (e) {
                    // console.dir(this);
                    // let xx = this._bounds;
                    // console.dir(xx);
                    $this.zoomTo(coords[0][0], coords[0][1], 4);
                };
                $this.Container.addChild(Graph);
                Graphics.push(Graph);
            }
        });
        $this.Graphics = Graphics;
    }
    initZoomAction() {
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
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate(0, 0).scale(0.1));
        $this.canvas.on("click", () => {
            const x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.scale;
            const y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.scale;
        });
    }
    zoomActions($this) {
        const x = d3.event.transform.x;
        const y = d3.event.transform.y;
        const k = d3.event.transform.k;
        $this.zoomTrans.x = x;
        $this.zoomTrans.y = y;
        $this.zoomTrans.scale = k;
        $this.canvas.attr("transform", d3.event.transform);
        $this.Container.scale.set(k);
        $this.Container.position.set(x, y);
    }
    zoomTo(x, y, k) {
        const $this = this;
        console.log(`zoom to ${x} ${y} ==> ${k}`);
        let tk = d3.interpolateNumber($this.zoomTrans.scale, k);
        let tx = d3.interpolateNumber(0, x);
        let ty = d3.interpolateNumber(0, y);
        let temp = 0;
        $this.D3Interval = d3.interval(function () {
            if (temp < 1) {
                temp += 0.01;
                let k_temp = tk(temp);
                let x_temp = tx(temp);
                let y_temp = ty(temp);
                $this.zoomHandler.scaleTo($this.canvas, k_temp);
                $this.zoomHandler.translateTo($this.canvas, x, y);
            }
            else {
                $this.D3Interval.stop();
                $this.D3Interval = null;
            }
        }, 1);
    }
    drawCircle(x, y) {
        const $this = this;
        const c = new PIXI.Graphics();
        c.lineStyle(2, 0xFF00FF);
        c.drawCircle(x, y, 5);
        c.endFill();
        $this.Container.addChild(c);
        $this.Circls.push(c);
    }
    removeCircls() {
        const $this = this;
        $this.Circls.map((e) => {
            $this.Container.removeChild(e);
        });
    }
    createGraph(coords) {
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
                }
                else {
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
    addButtons() {
        const $this = this;
        let width = 150;
        let height = 50;
        let x = 10;
        let y = $this.height - height - 20;
        const b = new Button_1.default(width, height, x, y, "Start drawing", null);
        $this.ContainerButtons.addChild(b);
        $this.stage.addChild($this.ContainerButtons);
        b.on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                b.text.text = "Start drawing";
                $this.counterGraphic++;
                $this.newGraphic = [];
            }
            else {
                b.text.text = "Stop drawing";
            }
        });
        width = 250;
        height = 50;
        x = 170;
        y = $this.height - height - 20;
        const returnLastActionB = new Button_1.default(width, height, x, y, "Return to last action", null);
        $this.ContainerButtons.addChild(returnLastActionB);
        returnLastActionB.on("click", () => {
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
    getD3X(x) {
        const $this = this;
        return (x - $this.zoomTrans.x) / $this.zoomTrans.scale;
    }
    getD3Y(y) {
        const $this = this;
        return (y - $this.zoomTrans.x) / $this.zoomTrans.scale;
    }
}
exports.default = Application;
window.onload = () => {
    (() => {
        return new Application("container", 1000, 683);
    })();
};
//# sourceMappingURL=App.js.map