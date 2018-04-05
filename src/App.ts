require("./Assets/css/_custom.scss");
require("./Assets/css/main.css");
let $ = require("jquery");
(window as any).jQuery = (window as any).$ = $;
require("bootstrap");
require("jquery-ui");
require("./Assets/jquery-ui-1.12.1/jquery-ui.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.theme.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.structure.css");

import * as PIXI from "pixi.js";
import * as d3 from "d3";
import Button from "./Tools/Button";
import LoaderText from "./Tools/LoaderText";
import {scaleToWindow} from "./Tools/Scale";
import {isMobile} from "./Tools/DeviceDetect";

const sprites = require("./Components/sprites.json");
const graphics = require("./Components/graphics.json");

let ModalDetail = require("./Components/DetailModal.html");
let ModalSearch = require("./Components/SearchForm.html");
let ModalAdd = require("./Components/addModal.html");
// import * as filters from 'pixi-filters';

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
    private _counterGraphic: number = 0;
    private newGraphicObj = [];
    private Circls = [];
    private zoomTrans = {x: 0, y: 0, k: .1};
    private startDrawing: boolean = false;
    private backgroundClicked: boolean = false;
    private sprites: object = {};
    // private zoomToBool: boolean = false;
    private view;
    private stage;
    private zoomHandler;
    private Graphics = [];
    private Buttons = [];
    private canvas = null;
    private context = null;
    private widthCanvas = null;
    private heightCanvas = null;
    private D3Interval = null;
    private isMobile: boolean = false;
    private _modeSearh: boolean = false;

    constructor(selectorId, width, height) {
        super(width, height, {transparent: true, autoResize: true});
        this.Container.zIndex = 0;
        this.ContainerButtons.zIndex = 1;
        this.width = width;
        this.height = height;
        this.widthExtentMaximum = this.width + 10000;
        this.heightExtentMaximum = this.height + 10000;
        this.selector = selectorId;
        this.isMobile = isMobile();
        this.appendView();
        this.setup();
    }

    private appendView() {
        const $this = this;
        document.getElementById($this.selector).appendChild($this.view);
        $("canvas").addClass('row');
        $("canvas").attr('id', 'canvas-container');
        $("canvas").css('margin', '0');
        $("canvas").attr('title', ' ');
        $(document).tooltip({
            track: true,
            context: function () {
                return ' ';
            },
        });
    }

    private setup() {
        const $this = this;
        const s = {};
        const text = new LoaderText(($this as any).width, ($this as any).height);

        $this.stage.addChild(text);

        $this.stage.addChild($this.Container);
        sprites.forEach((e) => {
            $this.Customloader.add(e.name, e.url);
        });
        // loader.pre(cachingMiddleware);
        // loader.use(parsingMiddleware);
        $this.Customloader.load((loader, resources) => {
            Object.keys(resources).map((e) => {
                this.sprites[e] = new PIXI.Sprite(resources[e].texture);
            });
        });
        ($this as any ).Customloader.onProgress.add((e) => {
            (text as any).text = `Loading ${e.progress}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            $this.addBackground();
            $this.addSearchButton();
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();
            //let colorMatrix = new PIXI.ColorMatrixFilter();
            //colorMatrix.contrast(2);
            $this.resizeCanvas();
        });
    }

    private addBackground() {
        const $this = this;
        if(($this.sprites as any).background.interactive){
            $this.Container.removeChild(($this.sprites as any).background)
        }
        ($this.sprites as any).background.x = 0;
        ($this.sprites as any).background.y = 0;
        ($this.sprites as any).background.interactive = true;
        // const filter = new filters.ColorMatrixFilter();
        //$this.removeColorFromSprite(($this.sprites as any).background);
        ($this.sprites as any).background.on("pointerdown", (e) => {
            if($this.startDrawing){
                const x = e.data.global.x;
                const y = e.data.global.y;
                const xD3 = $this.getD3X(x);
                const yD3 = $this.getD3Y(y);
                $this.newGraphic.push([xD3, yD3]);
                $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
            }

            $this.backgroundClicked = true;
        });
        $this.Container.addChild(($this.sprites as any).background);
    }

    private addSearchButton() {
        const $this = this;
        /*if(($this.sprites as any).searchIcon.interactive){
            $this.ContainerButtons.removeChild(($this.sprites as any).searchIcon)
        }*/
        ($this.sprites as any).searchIcon.x = ($this as any).width - 150;
        ($this.sprites as any).searchIcon.y = 50;
        ($this.sprites as any).searchIcon.width = 100;
        ($this.sprites as any).searchIcon.height = 100;
        ($this.sprites as any).searchIcon.interactive = true;
        // let filter = new PIXI.filters.OutlineFilter(2, 0x99ff99);
        // ($this.sprites as any).searchIcon.filters = [filter];
        ($this.sprites as any).searchIcon.on("pointerdown", (e) => {
            let mo = null;
            if ($('.modal.search-modal').length) {
                mo = $('.modal.search-modal');
            } else {
                mo = $(ModalSearch);
            }
            $(ModalSearch).attr('data-initilized', 'true');
            mo.modal({show: true}).on("shown.bs.modal", function (e) {
                $(this).find('form').submit(function () {
                    let data = $(this).serializeArray();
                    data = data.filter((e) => e.value);
                    if(data.length){
                        $this.removeColorFromSprite(($this.sprites as any).background);
                        $this.modeSearh = true;
                        let dataSearch = {};
                        data.map((e) => {
                            dataSearch[e.name] = e.value;
                        })
                        $this.Graphics.filter((e) => {
                            let {G: dataGraphic, Graph: obj} = e;
                            obj.alpha = 0;
                            if(dataSearch.hasOwnProperty('pieces')){
                                if(!dataGraphic.info.hasOwnProperty('pieces')){
                                    return false;
                                }
                                if(!dataGraphic.info.pieces){
                                    return false;
                                }
                                let sPieces = "S+1";
                                if((dataSearch as any).pieces == 2){
                                    sPieces = "S+2";
                                } else if((dataSearch as any).pieces == 3){
                                    sPieces = "S+3";
                                }
                                if(dataGraphic.info.pieces != sPieces){
                                    return false;
                                }
                            }
                            if(dataSearch.hasOwnProperty('surface')){
                                if(!dataGraphic.info.hasOwnProperty('surface')){
                                    return false;
                                }
                                if(!dataGraphic.info.surface){
                                    return false;
                                }

                                let bool = false;
                                let sSurface = dataGraphic.info.surface;
                                if((dataSearch as any).surface == 1){
                                    bool = sSurface>100 && sSurface<200;
                                } else if((dataSearch as any).surface == 2){
                                    bool = sSurface>200 && sSurface<300;
                                } else if((dataSearch as any).surface == 3){
                                    bool = sSurface>400;
                                }
                                if(!bool){
                                    return bool;
                                }
                            }
                            obj.alpha = 1;

                        })
                    } else {
                        $this.removeFiltersFromSprite(($this.sprites as any).background);
                        $this.Graphics.map((e) => {
                            let {Graph: obj} = e;
                            obj.alpha = 0;
                        });
                        $this.modeSearh = false;
                    }
                });
                $(this).find('form select').on('change', function(){
                    $($(this).parents('form')[0]).submit();
                });
            }).on("hidden.bs.modal", function (e) {
                // $(this).remove();
            });
        });
        $this.ContainerButtons.addChild(($this.sprites as any).searchIcon);
    }

    private addGraphics() {
        const $this = this;
        const Graphics = [];
        graphics.forEach((G, k) => {
            const coords = G.coords;
            const Graph = $this.createGraph(coords);
            if (Graph) {
                (Graph as any).interactive = true;
                (Graph as any).alpha = 0;
                (Graph as any).mouseover = function () {
                    if(!$this.modeSearh) {
                        (this as any).alpha = 1;
                    }
                    $(document).tooltip("option", "content", "<h1>" + G.info.title + "</h1><p>" + G.info.description + "</p>");
                    $('body').removeClass('tooltip-hidden');
                };
                (Graph as any).mouseout = function () {
                    if(!$this.modeSearh){
                        (this as any).alpha = 0;
                    }
                    $(document).tooltip("option", "content", ' ');
                    $('body').addClass('tooltip-hidden');
                };

                (Graph as any).pointerdown = function (e) {
                    // console.dir(this);
                    // let xx = this._bounds;
                    // console.dir(xx);
                    // $this.zoomTo(coords[0][0], coords[0][1], 4, Graph);
                    $(ModalDetail).modal({show: true}).on("shown.bs.modal", function (e) {
                        $(this).find(".modal-title").html(G.info.title);
                        $(this).find(".description").html(G.info.description);
                    }).on("hidden.bs.modal", function (e) {
                        $(this).remove();
                    });
                    if ($this.isMobile) {

                    }
                };
                ($this as any).Container.addChild(Graph);
                Graphics.push({G, Graph});
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
        $this.initZommActionFunctionalities();
    }
    private initZommActionFunctionalities(){
        const $this = this;
        let initX = 0;
        let initY = -100;
        let scalInit = .1;
        if(isMobile()){
            scalInit = .5;
            initY = - $this.height / 2;
            initX = - $this.width / 2;
        }
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate(initX, initY).scale(scalInit));
        $this.canvas.on("click", () => {
            // const x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.k;
            // const y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.k;
        });
    }
    private zoomActions($this) {
        const x = d3.event.transform.x;
        const y = d3.event.transform.y;
        const k = d3.event.transform.k;
        $this.zoomTrans = d3.event.transform;
        // let translate = "translate(" + d3.event.translate + ")";
        // let scale = "scale(" + d3.event.scale + ")";
        // $this.canvas.attr("transform", translate + scale);
        $this.Container.scale.set(k);
        $this.Container.position.set(x, y);
    }

    /*private zoomTo(x: number, y: number, k: number, graph) {
     const $this = this;
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
     }*/

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
        if($this.Buttons.length){
            $this.Buttons.map((e) => {
                $this.ContainerButtons.removeChild(e);
            })
            $this.Buttons = [];
        }
        let width = 150;
        let height = 50;
        let x = 10;
        let y = ($this as any).height - height - 20;
        const b = new Button(width, height, x, y, "Start drawing", null);
        $this.ContainerButtons.addChild(b);
        $this.stage.addChild($this.ContainerButtons);
        (b as any).on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                (b as any).text.text = "Start drawing";
                $this._counterGraphic++;
                $this.newGraphic = [];
                $(ModalAdd).modal({show: true});
            } else {
                (b as any).text.text = "Stop drawing";
            }
        });
        $this.Buttons.push(b);
        width = 250;
        height = 50;
        x = 170;
        y = ($this as any).height - height - 20;
        const returnLastActionB = new Button(width, height, x, y, "Return to last action", null);
        $this.ContainerButtons.addChild(returnLastActionB);
        (returnLastActionB as any).on("click", () => {
            if ($this.newGraphic.length) {
                $this.newGraphic.splice(-1, 1);
                $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                if ($this.newGraphicObj[$this._counterGraphic]) {
                    $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
                }
            }
        });
        $this.Buttons.push(returnLastActionB);
    }

    public getD3X(x: number) {
        const $this = this;
        return (x - $this.zoomTrans.x) / $this.zoomTrans.k;
    }

    public getD3Y(y: number) {
        const $this = this;
        return (y - $this.zoomTrans.y) / $this.zoomTrans.k;
    }

    public resizeCanvas() {
        const $this = this;
        $this.rendererResize($this);
        window.addEventListener('resize', () => {
            return $this.rendererResize($this);
        });
        window.addEventListener('deviceOrientation', () => {
            return $this.rendererResize($this);
        });
    };

    public rendererResize($this) {
        if(isMobile()){
            $this.width = window.innerWidth;
            $this.height = window.innerHeight;
        }
        let ratio = Math.min(window.innerWidth/$this.width,
            window.innerHeight/$this.height);
        if(ratio >1){
            ratio = 1;
        }
        $this.Container.scale.x =
            $this.Container.scale.y =
                $this.ContainerButtons.scale.x =
                    $this.ContainerButtons.scale.y = ratio;
        ($this.sprites as any).searchIcon.x = ($this as any).width - 150;
        ($this.sprites as any).searchIcon.y = 50;
        $this.addButtons();


        // Update the renderer dimensions
        let width = Math.ceil($this.width * ratio);
        let height = Math.ceil($this.height * ratio);
        /*if(window.innerWidth > window.innerHeight && isMobile()){
            [width, height] = [height, width];
        }*/
        $this.renderer.resize(width, height);
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate($this.zoomTrans.x, $this.zoomTrans.y).scale($this.zoomTrans.k));

    };


    private removeColorFromSprite(sprite) {
        const filter = new PIXI.filters.ColorMatrixFilter();
        sprite.filters = [filter];
        filter.desaturate();
    }

    private removeFiltersFromSprite(sprite) {
        sprite.filters = [];
    }

    get modeSearh(): boolean {
        return this._modeSearh;
    }

    set modeSearh(value: boolean) {
        this._modeSearh = value;
    }
}

window.onload = () => {
    (() => {
        let [width, height] = [960, 540];
        if(isMobile()){
            [width, height] = [window.innerWidth, window.innerHeight];
            if(width > height){
                [width, height] = [height, width];
            }
        }
        return new Application("container", width, height);
    })();
};
