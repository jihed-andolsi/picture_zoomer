"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PIXI = require("pixi.js");
const d3 = require("d3");
const sprites = require("./Components/sprites.json");
const graphics = require("./Components/graphics.json");
const Button_ts_1 = require("./Tools/Button.ts");
const LoaderText_ts_1 = require("./Tools/LoaderText.ts");
class Application extends PIXI.Application {
    constructor(selectorId, width, height) {
        super(width, height, { transparent: true });
        this.Customloader = new PIXI.loaders.Loader();
        this.container = new PIXI.Container();
        this.containerButtons = new PIXI.Container();
        this.newGraphic = [];
        this.counterGraphic = 0;
        this.newGraphicObj = [];
        this.Circls = [];
        this.zoomTrans = { x: 0, y: 0, scale: 1 };
        this.startDrawing = false;
        this.backgroundClicked = false;
        this.zoomToBool = false;
        const $this = this;
        $this.container.zIndex = 0;
        $this.containerButtons.zIndex = 1;
        $this.width = width;
        $this.height = height;
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
        const text = new LoaderText_ts_1.LoaderText($this.width, $this.height);
        $this.stage.addChild(text);
        $this.stage.addChild($this.container);
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
            s.background.on("pointerdown", () => {
                $this.backgroundClicked = true;
            });
            $this.container.addChild(s.background);
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
                /*(<any> Graph).on("click", () => {
                    // let x = (<any> this).x;
                    // let y = (<any> this).y;
                    // $this.zoomTo(x, y);
                    (<any> $this).zoomToBool = true;

                })*/
                $this.container.addChild(Graph);
                Graphics.push(Graph);
            }
        });
        $this.Graphics = Graphics;
    }
    initZoomAction() {
        const $this = this;
        const transform = d3.zoomIdentity.scale(0.1);
        $this.zoomHandler = d3.zoom()
            .scaleExtent([.1, 8])
            .translateExtent([[0, 0], [$this.width + 10000, $this.height + 10000]])
            .on("zoom", zoomActions);
        $this.pixiCanvas = d3.select(`#${$this.selector} canvas`);
        $this.pixiCanvas.call($this.zoomHandler).call($this.zoomHandler.transform, transform);
        // pixiCanvas.style("width", $this.width).style("height", $this.height);
        $this.pixiCanvas.on("click", () => {
            const x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.scale;
            const y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.scale;
            if ($this.startDrawing && $this.backgroundClicked) {
                $this.newGraphic.push([x, y]);
                $this.container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                $this.container.addChild($this.newGraphicObj[$this.counterGraphic]);
            }
            // if($this.zoomToBool){/*$this.pixiCanvas.transition() .call($this.zoomTo([x, y], 6).event)*/ }
            $this.zoomToBool = false;
            $this.backgroundClicked = false;
        });
        function zoomActions() {
            $this.zoomTrans.x = d3.event.transform.x;
            $this.zoomTrans.y = d3.event.transform.y;
            $this.zoomTrans.scale = d3.event.transform.k;
            $this.pixiCanvas.attr("transform", d3.event.transform);
            // if(d3.event.transform.k > 1){
            const k = d3.event.transform.k;
            $this.container.scale.set(k);
            // if(d3.event.transform.x)
            const x = d3.event.transform.x;
            const y = d3.event.transform.y;
            $this.container.position.set(x, y);
        }
    }
    /*zoomTo(x, y) {
        const $this = this;
        let zoom = d3.zoom();
        let selection = d3.select("#" + $this.selector + " canvas");
        let t = zoom.scaleTo(selection, 6)
        selection.call($this.zoomHandler.transform, t);
    }

    private zoomTo(point, scale) {

    }
     */
    drawCircle(x, y) {
        const $this = this;
        const c = new PIXI.Graphics();
        c.lineStyle(2, 0xFF00FF);
        c.drawCircle(x, y, 5);
        c.endFill();
        $this.container.addChild(c);
        $this.Circls.push(c);
    }
    removeCircls() {
        const $this = this;
        $this.Circls.map((e) => {
            $this.container.removeChild(e);
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
        const b = new Button_ts_1.Button(width, height, x, y, "Start drawing", null);
        $this.containerButtons.addChild(b);
        $this.stage.addChild($this.containerButtons);
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
        const returnLastActionB = new Button_ts_1.Button(width, height, x, y, "Return to last action", null);
        $this.containerButtons.addChild(returnLastActionB);
        returnLastActionB.on("click", () => {
            if ($this.newGraphic.length) {
                $this.newGraphic.splice(-1, 1);
                $this.container.removeChild($this.newGraphicObj[$this.counterGraphic]);
                $this.newGraphicObj[$this.counterGraphic] = $this.createGraph($this.newGraphic);
                if ($this.newGraphicObj[$this.counterGraphic]) {
                    $this.container.addChild($this.newGraphicObj[$this.counterGraphic]);
                }
            }
        });
    }
}
exports.default = Application;
window.onload = () => {
    (() => {
        return new Application("container", 1000, 683);
    })();
};
//# sourceMappingURL=App.js.map