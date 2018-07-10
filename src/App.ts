require("./Assets/css/_custom.scss");
require("./Assets/css/main.css");

let $ = (window as any).$;
/*
let $ = require("jquery");
(window as any).jQuery = (window as any).$ = $;

require("bootstrap");
require("jquery-ui");
require("./Assets/jquery-ui-1.12.1/jquery-ui.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.theme.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.structure.css");*/

import * as PIXI from "pixi.js";
import * as d3 from "d3";
import Button from "./Tools/Button";
import LoaderText from "./Tools/LoaderText";
import {isMobile} from "./Tools/DeviceDetect";
import {enableFullscreen} from "./Tools/Fullscreen";
// import {scaleToWindow} from "./Tools/Scale";

const configPlanManager = (window as any).configPlanManager;
const sprites = configPlanManager.sprites;
// const graphics = require("./Components/graphics.json");
const graphics = configPlanManager.properties;
let ModalSearch = require("./Components/SearchForm.html");
// import * as filters from 'pixi-filters';

export default class Application extends PIXI.Application {
    private Customloader = new PIXI.loaders.Loader();
    private Container = new PIXI.Container();
    private ContainerButtons = new PIXI.Container();
    private filterBackground = new PIXI.filters.ColorMatrixFilter();
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
    private _graphicHovered: boolean = false;
    private PowredByText = null;
    private MultipleBackground = [];
    private isZooming: boolean = false;

    constructor(selectorId, width, height) {
        super(width, height, {transparent: true, autoResize: true});
        this.Container.zIndex = 0;
        this.ContainerButtons.zIndex = 1;
        this.width = width;
        this.height = height;
        this.widthExtentMaximum = configPlanManager.widthExtent(this.width);
        this.heightExtentMaximum = configPlanManager.heightExtent(this.height);
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
        $("canvas[title]").tooltip({
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
        ($this as any).Customloader.onProgress.add((e) => {
            let prog = parseInt(e.progress);
            (text as any).text = `Loading ${prog}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            if (configPlanManager.backgroundMultiple) {
                $this.addBackgroundMultiple();
            } else {
                $this.addBackground();
            }
            $this.addSearchButton();
            $this.addFullscreenButton();
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();
            $this.addPowredBy();
            $this.resizeCanvas();

        });
    }

    private addBackground() {
        const $this = this;
        if (($this.sprites as any).background.interactive) {
            $this.Container.removeChild(($this.sprites as any).background)
        }
        ($this.sprites as any).background.x = 0;
        ($this.sprites as any).background.y = 0;
        ($this.sprites as any).background.interactive = true;
        ($this.sprites as any).background.filters = [this.filterBackground];
        // const filter = new filters.ColorMatrixFilter();
        //$this.removeColorFromSprite(($this.sprites as any).background);
        ($this.sprites as any).background.on("pointerdown", (e) => {
            const x = e.data.global.x;
            const y = e.data.global.y;
            // console.log(`Point {${x}, ${y}}`);
            if ($this.startDrawing) {
                const xD3 = $this.getD3X(x);
                const yD3 = $this.getD3Y(y);
                $this.newGraphic.push([xD3, yD3]);
                $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
            }

            $this.backgroundClicked = true;
        });
        ($this.sprites as any).background.mouseover = function () {
            $('body').addClass('tooltip-hidden');
        };
        $this.Container.addChild(($this.sprites as any).background);
    }

    private addPowredBy() {
        const $this = this;
        let style = new PIXI.TextStyle({
            fontFamily: "Arial", // Font Family
            fontSize: 14, // Font Size
            // fontStyle: "italic",// Font Style
            fontWeight: "bold", // Font Weight
            fill: ["#646565"], // gradient
            // stroke: "#ffffff",
            // strokeThickness: 5,
            // dropShadow: true,
            // dropShadowColor: "#000000",
            // dropShadowBlur: 4,
            // dropShadowAngle: Math.PI / 6,
            // dropShadowDistance: 6,
            // wordWrap: true,
            // wordWrapWidth: 440
        });

        $this.PowredByText = new PIXI.Text("Powred by ConceptLab", "arial");
        $this.PowredByText.anchor = new PIXI.Point(0.5, 0.5);
        $this.PowredByText.x = $this.width - 200;
        $this.PowredByText.y = $this.height - 50;
        $this.PowredByText.style = style;
        $this.ContainerButtons.addChild(this.PowredByText);
    }

    private addBackgroundMultiple() {
        const $this = this;
        $this.MultipleBackground = [
            [($this.sprites as any).background_1, 'background_1'],
            [($this.sprites as any).background_2, 'background_2'],
            [($this.sprites as any).background_3, 'background_3'],
            [($this.sprites as any).background_4, 'background_4'],
            [($this.sprites as any).background_5, 'background_5'],
            [($this.sprites as any).background_6, 'background_6'],
            [($this.sprites as any).background_7, 'background_7'],
            [($this.sprites as any).background_8, 'background_8'],
            [($this.sprites as any).background_9, 'background_9'],
            [($this.sprites as any).background_10, 'background_10'],
            [($this.sprites as any).background_11, 'background_11'],
            [($this.sprites as any).background_12, 'background_12'],
            [($this.sprites as any).background_13, 'background_13'],
            [($this.sprites as any).background_14, 'background_14'],
            [($this.sprites as any).background_15, 'background_15'],
            [($this.sprites as any).background_16, 'background_16'],
        ];
        $this.MultipleBackground.map((element) => {
            const $this = this;
            let [background, name] = element;
            let found = sprites.filter(function (item) {
                return item.name === name;
            });
            background.x = found[0].x;
            background.y = found[0].y;
            background.interactive = true;
            background.filters = [this.filterBackground];
            background.on("pointerdown", (e) => {
                const x = e.data.global.x;
                const y = e.data.global.y;
                // console.log(`Point {${x}, ${y}}`);
                if ($this.startDrawing) {
                    const xD3 = $this.getD3X(x);
                    const yD3 = $this.getD3Y(y);
                    $this.newGraphic.push([xD3, yD3]);
                    $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                    $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                    $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
                }
                $this.backgroundClicked = true;
            });
            background.mouseover = () => {
                $('body').addClass('tooltip-hidden');
            };
            $this.Container.addChild(background);
        })
    }

    private addSearchButton() {
        const $this = this;
        let selector = '#' + configPlanManager.searchFormId;
        $(selector).submit(function () {
            let serializedData = $(this).serializeArray();
            serializedData = serializedData.filter((e) => e.value);
            if (serializedData.length) {
                $this.removeColorFromBackground();
                $this.modeSearh = true;
                let dataSearch = {};
                serializedData.map((e) => {
                    if (e.name == "lots") {
                        if (!dataSearch.hasOwnProperty(e.name)) {
                            dataSearch[e.name] = [];
                        }
                        dataSearch[e.name].push(e.value)
                    } else {
                        dataSearch[e.name] = e.value;
                    }
                });
                $this.Graphics.filter((e) => {
                    let {G: dataGraphic, Graph: obj} = e;
                    obj.alpha = 0;
                    let minDistance = 0;
                    let maxDistance = 0;
                    let lots = [];
                    if (dataSearch.hasOwnProperty('minDistance')) {
                        if ((dataSearch as any).minDistance) {
                            minDistance = (dataSearch as any).minDistance;
                        }
                    }
                    if (dataSearch.hasOwnProperty('maxDistance')) {
                        if ((dataSearch as any).maxDistance) {
                            maxDistance = (dataSearch as any).maxDistance;
                        }
                    }
                    if (dataSearch.hasOwnProperty('lots')) {
                        if ((dataSearch as any).lots) {
                            lots = (dataSearch as any).lots;
                        }
                    }
                    if (minDistance && maxDistance) {
                        let sSurface = dataGraphic.info.surface;
                        if (!sSurface) {
                            sSurface = /*dataGraphic.info.surface_terrain + */dataGraphic.info.surface_habitable;
                        }
                        if (sSurface) {
                            let bool = sSurface > minDistance && sSurface < maxDistance;
                            if (!bool) {
                                return bool;
                            }
                        }
                    }
                    if (lots.length) {
                        let foundGraph = lots.filter(function (item) {
                            return item.toLowerCase() === dataGraphic.info.landUse.abbreviation.toLowerCase();
                        });
                        if (!foundGraph.length) {
                            return false;
                        }
                    }
                    obj.alpha = 1;
                })
            } else {
                $this.addColorToBackground();
                $this.Graphics.map((e) => {
                    let {Graph: obj} = e;
                    obj.alpha = 0;
                });
                $this.modeSearh = false;
            }

        });
        setTimeout(() => {
            if ($(`${selector} input[name="do-search"]`).length) {
                $(`${selector}`).submit();
            }
        }, 3000);
        $(`${selector} input[name="reinitiliser"]`).click(function () {
            $this.addColorToBackground();
            $this.Graphics.map((e) => {
                let {Graph: obj} = e;
                obj.alpha = 0;
            });
            $this.modeSearh = false;
        });
        if (configPlanManager.showSearchButton) {
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
                        if (data.length) {
                            $this.removeColorFromBackground();
                            $this.modeSearh = true;
                            let dataSearch = {};
                            data.map((e) => {
                                dataSearch[e.name] = e.value;
                            })
                            $this.Graphics.filter((e) => {
                                let {G: dataGraphic, Graph: obj} = e;
                                obj.alpha = 0;
                                if (dataSearch.hasOwnProperty('pieces')) {
                                    if (!dataGraphic.info.hasOwnProperty('pieces')) {
                                        return false;
                                    }
                                    if (!dataGraphic.info.pieces) {
                                        return false;
                                    }
                                    let sPieces = "S+1";
                                    if ((dataSearch as any).pieces == 2) {
                                        sPieces = "S+2";
                                    } else if ((dataSearch as any).pieces == 3) {
                                        sPieces = "S+3";
                                    }
                                    if (dataGraphic.info.pieces != sPieces) {
                                        return false;
                                    }
                                }
                                if (dataSearch.hasOwnProperty('surface')) {
                                    if (!dataGraphic.info.hasOwnProperty('surface')) {
                                        return false;
                                    }
                                    if (!dataGraphic.info.surface) {
                                        return false;
                                    }

                                    let bool = false;
                                    let sSurface = dataGraphic.info.surface;
                                    if ((dataSearch as any).surface == 1) {
                                        bool = sSurface > 100 && sSurface < 200;
                                    } else if ((dataSearch as any).surface == 2) {
                                        bool = sSurface > 200 && sSurface < 300;
                                    } else if ((dataSearch as any).surface == 3) {
                                        bool = sSurface > 400;
                                    }
                                    if (!bool) {
                                        return bool;
                                    }
                                }
                                obj.alpha = 1;

                            })
                        } else {
                            $this.addColorToBackground();
                            $this.Graphics.map((e) => {
                                let {Graph: obj} = e;
                                obj.alpha = 0;
                            });
                            $this.modeSearh = false;
                        }
                    });
                    $(this).find('form select').on('change', function () {
                        $($(this).parents('form')[0]).submit();
                    });
                }).on("hidden.bs.modal", function (e) {
                    // $(this).remove();
                });
            });

            $this.ContainerButtons.addChild(($this.sprites as any).searchIcon);
        }
    }

    private addFullscreenButton() {
        const $this = this;
        ($this.sprites as any).fulscreenIcon.x = ($this as any).width - 150;
        ($this.sprites as any).fulscreenIcon.y = ($this as any).height - 150;
        ($this.sprites as any).fulscreenIcon.width = 100;
        ($this.sprites as any).fulscreenIcon.height = 100;
        ($this.sprites as any).fulscreenIcon.interactive = true;
        ($this.sprites as any).fulscreenIcon.on("pointerdown", (e) => {
            enableFullscreen();
        });
        ($this.sprites as any).fulscreenIcon.buttonMode = true;
        if (configPlanManager.fullScreenButton) {
            $this.ContainerButtons.addChild(($this.sprites as any).fulscreenIcon);
        }
    }

    private addGraphics() {
        const $this = this;
        const Graphics = [];
        graphics.forEach((G, k) => {
            const coords = G.coords;
            const Graph = $this.createGraph(coords, G);
            if (Graph) {
                (Graph as any).interactive = true;
                (Graph as any).alpha = 0;
                (Graph as any).buttonMode = true;
                (Graph as any).mouseover = function () {

                    if (!$this.modeSearh && !$this.startDrawing) {
                        (this as any).alpha = 1;
                    }
                    let description = "";
                    (G.info.reference) ? description += "<div class=\"row\"><div class=\"col-12\"><p style=\"color:  #fff;font-weight:  bold;\">" + G.info.reference + "</p></div></div>" : "";
                    (!G.info.reference && G.info.title) ? description += "<div class=\"row\"><div class=\"col-12\"><p style=\"color:  #fff;font-weight:  bold;\">" + G.info.title + "</p></div></div>" : "";
                    description += "<div class=\"row\">";
                    let picture = (configPlanManager.hasOwnProperty("pictureNotFoundUrl")) ? configPlanManager.pictureNotFoundUrl : "";
                    picture = (G.info.image && G.info.image.hasOwnProperty('small')) ? G.info.image.small : picture;
                    (picture) ? description += "<div class=\"col-6 pr-0\"><img class=\"img-fluid\" src='" + picture + "'></div>" : "";
                    description += "<div class=\"col-6\">";

                    (G.info.landUse) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff;\">"+configPlanManager.plan_lang.vocation+": </b> " + G.info.landUse.name + "</p>" : "";
                    (G.info.surface_terrain) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff;\">"+configPlanManager.plan_lang.surface_du_lot+"</b> " + G.info.surface_terrain + " <span>m²<span></p>" : "";
                    (G.info.surface_habitable) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff;\">"+configPlanManager.plan_lang.surface_totale+"</b> " + G.info.surface_habitable + " <span>m²<span></p>" : "";
                    if (G.info.pdfDownloadLink) {
                        let [firstPdf] = G.info.pdfDownloadLink;
                        (firstPdf) ? description += "<p style='color: #d1a9a4'>"+configPlanManager.plan_lang.pdf+"</p>" : "";
                    }
                    description += "</div>";
                    description += "</div>";
                    if (description && !$this.startDrawing) {
                        $("canvas[title]").tooltip("option", "content", description);
                        $('body').removeClass('tooltip-hidden');
                    }
                };

                (Graph as any).mouseout = function () {
                    if (!$this.modeSearh && !$this.startDrawing) {
                        (this as any).alpha = 0;
                    }
                };
                Graph.touchstart = function(){
                    Graph.dataTranslate = $this.zoomTrans;
                };
                Graph.pointerdown = function(){
                    Graph.dataTranslate = $this.zoomTrans;
                };
                Graph.click = Graph.tap = function() {
                    //if($this.isMobile) {
                        const k = Graph.dataTranslate.k == $this.zoomTrans.k;
                        let x = Graph.dataTranslate.x - $this.zoomTrans.x;
                        let y = Graph.dataTranslate.y - $this.zoomTrans.y;
                        x = (x>0) ? x : x*-1;
                        y = (y>0) ? y : y*-1;
                        const x_diff = x <= 10;
                        const y_diff = y <= 10;
                        if (k && x_diff && y_diff) {
                            $this.showModalProperty(G, $this);
                        }
                    /*} else {
                        $this.showModalProperty(G, $this);
                    }*/
                };
                ($this as any).Container.addChild(Graph);
                Graphics.push({G, Graph});
            }
        });
        $this.Graphics = Graphics;
    }
    private showModalProperty(G, $this){
        // console.dir(this);
        // let xx = this._bounds;
        // console.dir(xx);
        // $this.zoomTo(coords[0][0], coords[0][1], 4, Graph);
        if (configPlanManager.hasOwnProperty("modalPropertyDetailId")) {
            $("#" + configPlanManager.modalPropertyDetailId).modal({show: true}).on("shown.bs.modal", function (e) {
                console.dir(G.info);
                $(this).find("img.img-property, .reference-property, .surface-lot, .surface-total, .nbr-etage, .voaction, .cuffar, .cos, .emprise, .niveau, .download-pdf a, .description").addClass("d-none");
                $(this).find("input[name='property_id']").val(G.info.id);
                $(this).find("input[name='property_ref']").val(G.info.title);
                let picture = (configPlanManager.hasOwnProperty("pictureNotFoundUrl")) ? configPlanManager.pictureNotFoundUrl : "";
                picture = (G.info.image && G.info.image.hasOwnProperty('small')) ? G.info.image.small : picture;
                (picture) ? $(this).find("img.img-property").attr("src", picture).removeClass("d-none") : "";
                $(this).find(".reference-property").html(G.info.title).removeClass("d-none");
                (G.info.surface_terrain) ? $(this).find(".surface-lot b").html(G.info.surface_terrain + " m²").parent().removeClass("d-none") : "";
                (G.info.surface_habitable) ? $(this).find(".surface-total b").html(G.info.surface_habitable + " m²").parent().removeClass("d-none") : "";
                (G.info.etage) ? $(this).find(".nbr-etage b").html(G.info.etage).parent().removeClass("d-none") : "";
                (G.info.landUse) ? $(this).find(".voaction b").html(G.info.landUse.name).parent().removeClass("d-none") : "";
                (G.info.cuffar) ? $(this).find(".cuffar b").html(G.info.cuffar).parent().removeClass("d-none") : "";
                (G.info.cosCoverage) ? $(this).find(".cos b").html(G.info.cosCoverage).parent().removeClass("d-none") : "";
                (G.info.emprise) ? $(this).find(".emprise b").html(G.info.emprise).parent().removeClass("d-none") : "";
                (G.info.elevation) ? $(this).find(".niveau b").html(G.info.elevation).parent().removeClass("d-none") : "";
                (G.info.description) ? $(this).find(".description").html(G.info.description).removeClass("d-none") : "";
                if (G.info.pdfDownloadLink) {
                    let [firstPdf] = G.info.pdfDownloadLink;
                    (firstPdf) ? $(this).find(".download-pdf a").attr("href", firstPdf).removeClass("d-none") : "";
                }
            }).on("hidden.bs.modal", function (e) {
                $(this).find("img.img-property, .reference-property, .surface-lot, .surface-total, .nbr-etage, .voaction, .cuffar, .cos, .emprise, .niveau, .download-pdf a, .description").addClass("d-none");
            });
        }
        if ($this.isMobile) {

        }
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
            .on("start", () => {
                return $this.startZoomActions($this);
            })
            .on("zoom", () => {
                return $this.zoomActions($this);
            })
            .on("end", () => {
                return $this.endZoomActions($this);
            })
            .filter(() => {
                return !$this.D3Interval;
            });
        $this.initZommActionFunctionalities();
    }

    private initZommActionFunctionalities() {
        const $this = this;
        let initX = 0;
        let initY = -100;
        let scalInit = .5;
        if (configPlanManager.hasOwnProperty("initialData")) {
            initX = configPlanManager.initialData.x;
            initY = configPlanManager.initialData.y;
            scalInit = configPlanManager.initialData.k;
        }
        if (isMobile()) {
            scalInit = .5;
            initY = -$this.height / 2;
            initX = -$this.width / 2;
            if (configPlanManager.hasOwnProperty("initialDataMobile")) {
                initX = configPlanManager.initialDataMobile.x;
                initY = configPlanManager.initialDataMobile.y;
                scalInit = configPlanManager.initialDataMobile.k;
            }
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
        // console.dir(d3.event.transform);
        // let translate = "translate(" + d3.event.translate + ")";
        // let scale = "scale(" + d3.event.scale + ")";
        // $this.canvas.attr("transform", translate + scale);
        $this.Container.scale.set(k);
        $this.Container.position.set(x, y);
    }

    private startZoomActions($this) {
        // console.dir("start zoom");
        $this.isZooming = true;
    }

    private endZoomActions($this) {
        // console.dir("end zoom");
        $this.isZooming = false;
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

    private createGraph(coords, graphInfo = {}) {
        const $this = this;
        if (coords) {
            if (coords.length) {
                let color = 0xc10000;
                let opacity = .5;
                if (configPlanManager.hasOwnProperty('defaultColor')) {
                    if (configPlanManager.defaultColor) {
                        color = configPlanManager.defaultColor;
                    }
                }
                if (configPlanManager.hasOwnProperty('defaultOpacity')) {
                    if (configPlanManager.defaultOpacity) {
                        opacity = configPlanManager.defaultOpacity;
                    }
                }
                if ((graphInfo as any).hasOwnProperty('info')) {
                    if ((graphInfo as any).info.landUse) {
                        if ((graphInfo as any).info.landUse.color) {
                            color = (graphInfo as any).info.landUse.color;
                            color = (color as any).replace(/#/gi, "0x");
                        }
                    }
                }
                const newGraphicObj = new PIXI.Graphics();
                newGraphicObj.beginFill(color, opacity);
                newGraphicObj.lineStyle(3, 0x000000, opacity);
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
        }
        return false;
    }

    private addButtons() {
        const $this = this;
        if ($this.Buttons.length) {
            $this.Buttons.map((e) => {
                $this.ContainerButtons.removeChild(e);
            })
            $this.Buttons = [];
        }
        let width = 150;
        let height = 50;
        let x = 10;
        let y = ($this as any).height - height - 20;
        let txt = "Start drawing";
        if ($this.startDrawing) {
            let txt = "Stop drawing";
        }
        const b = new Button(width, height, x, y, txt, null);
        $this.stage.addChild($this.ContainerButtons);
        //b.buttonMode = true;
        (b as any).on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                (b as any).text.text = "Start drawing";
                $this._counterGraphic++;
                if ($this.newGraphic.length) {
                    $('#property #coords').html(JSON.stringify($this.newGraphic));
                    $("#property").modal({show: true});
                }
                $this.newGraphic = [];

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
        //returnLastActionB.buttonMode = true;
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
        if (configPlanManager.hasOwnProperty('showButtonPlans')) {
            if (configPlanManager.showButtonPlans) {
                $this.ContainerButtons.addChild(b);
                $this.ContainerButtons.addChild(returnLastActionB);
            }
        }
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
        if (isMobile() || configPlanManager.fullSizeShow) {
            $this.width = window.innerWidth;
            $this.height = window.innerHeight;
        }
        let ratio = Math.min(window.innerWidth / $this.width,
            window.innerHeight / $this.height);
        if (ratio > 1) {
            ratio = 1;
        }
        $this.Container.scale.x =
            $this.Container.scale.y =
                $this.ContainerButtons.scale.x =
                    $this.ContainerButtons.scale.y = ratio;
        ($this.sprites as any).searchIcon.x = ($this as any).width - 150;
        ($this.sprites as any).searchIcon.y = 50;
        ($this.sprites as any).fulscreenIcon.x = ($this as any).width - 150;
        ($this.sprites as any).fulscreenIcon.y = ($this as any).height - 150;
        $this.addButtons();
        $this.PowredByText.x = $this.width - 200;
        $this.PowredByText.y = $this.height - 50;
        // Update the renderer dimensions
        let width = Math.ceil($this.width * ratio);
        let height = Math.ceil($this.height * ratio);
        /*if(window.innerWidth > window.innerHeight && isMobile()){
            [width, height] = [height, width];
        }*/
        $this.renderer.resize(width, height);
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate($this.zoomTrans.x, $this.zoomTrans.y).scale($this.zoomTrans.k));

    };

    private removeColorFromBackground() {
        const $this = this;
        if (configPlanManager.backgroundMultiple) {
            $this.MultipleBackground.map((element) => {
                let [background] = element;
                $this.removeColorFromSprite(background);
            })
        } else {
            $this.removeColorFromSprite(($this.sprites as any).background);
        }
    }

    private addColorToBackground() {
        console.log("addColorToBackground")
        const $this = this;
        if (configPlanManager.backgroundMultiple) {
            $this.MultipleBackground.map((element) => {
                let [background] = element;
                $this.removeFiltersFromSprite(background);
            })
        } else {
            $this.removeFiltersFromSprite(($this.sprites as any).background);
        }

    }

    private removeColorFromSprite(sprite) {
        this.filterBackground.desaturate();
    }

    private removeFiltersFromSprite(sprite) {
        this.filterBackground.reset();
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
        let [width, height] = configPlanManager.size;
        if (isMobile()) {
            [width, height] = configPlanManager.sizePhone;
            if (width > height) {
                [width, height] = [height, width];
            }
        }
        return new Application("container", width, height);
    })();
};
