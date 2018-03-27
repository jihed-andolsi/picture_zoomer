import * as PIXI from "pixi.js";
import * as d3 from "d3";
const sprites = require("./Components/sprites.json");
const graphics = require("./Components/graphics.json");
import Button from "./Tools/Button";
import LoaderText from "./Tools/LoaderText";

export default class Application extends PIXI.Application {
    private Customloader = new PIXI.loaders.Loader();
    private Container = new PIXI.Container();
    private ContainerButtons = new PIXI.Container();
    private width: number ;
    private height: number ;
    private selector;
    private newGraphic = [];
    private counterGraphic: number = 0;
    private newGraphicObj = [];
    private Circls = [];
    private zoomTrans = {x: 0, y: 0, scale: 1};
    private startDrawing: boolean = false;
    private backgroundClicked: boolean = false;
    private zoomToBool: boolean = false;
    private view;
    private stage;
    private zoomHandler;
    private pixiCanvas;
    private Graphics;

    constructor(selectorId, width, height) {
        super(width, height, {transparent: true});
        const $this = this;
        $this.Container.zIndex = 0;
        $this.ContainerButtons.zIndex = 1;
        $this.width = width;
        $this.height = height;
        $this.selector = selectorId;
        $this.appendView(selectorId);
        $this.setup();
    }

    private appendView(selectorId) {
        const $this = this;
        document.getElementById($this.selector).appendChild($this.view);
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

                const x = (e.data.global.x - $this.zoomTrans.x) / $this.zoomTrans.scale;
                const y = (e.data.global.y - $this.zoomTrans.y) / $this.zoomTrans.scale;

                if ($this.startDrawing){
                    $this.newGraphic.push([x, y]);
                    $this.Container.removeChild( $this.newGraphicObj[$this.counterGraphic] );
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
                (Graph as any).mouseover = function() {
                    (this as any).alpha = 1;
                };
                (Graph as any).mouseout = function() {
                    (this as any).alpha = 0;
                };
                /*(<any> Graph).on("click", () => {
                    // let x = (<any> this).x;
                    // let y = (<any> this).y;
                    // $this.zoomTo(x, y);
                    (<any> $this).zoomToBool = true;

                })*/
                ($this as any).Container.addChild(Graph);
                Graphics.push(Graph);
            }
        });
        $this.Graphics = Graphics;
    }

    private initZoomAction() {
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
            /*console.log('x :::: ');
            console.log('d3.event.x ::: ' + d3.event.x);
            console.log('$this.zoomTrans.x ::: ' + $this.zoomTrans.x);
            console.log('$this.zoomTrans.scale ::: ' + $this.zoomTrans.scale);
            console.log('y :::: ');
            console.log('d3.event.y ::: ' + d3.event.x);
            console.log('$this.zoomTrans.y ::: ' + $this.zoomTrans.y);
            console.log('$this.zoomTrans.scale ::: ' + $this.zoomTrans.scale);*/
            if ($this.startDrawing && $this.backgroundClicked) {

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
            $this.Container.scale.set(k);
            // if(d3.event.transform.x)
            const x = d3.event.transform.x;
            const y = d3.event.transform.y;
            $this.Container.position.set(x, y);
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
                $this.counterGraphic ++;
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

}

window.onload = () => {
    (() => {
        return new Application("container", 1000, 683);
    })();
};
