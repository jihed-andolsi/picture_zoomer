"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./Assets/css/_custom.scss");
require("./Assets/css/main.css");
let $ = window.$;
/*
let $ = require("jquery");
(window as any).jQuery = (window as any).$ = $;

require("bootstrap");
require("jquery-ui");
require("./Assets/jquery-ui-1.12.1/jquery-ui.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.theme.css");
require("./Assets/jquery-ui-1.12.1/jquery-ui.structure.css");*/
const PIXI = require("pixi.js");
const d3 = require("d3");
const Button_1 = require("./Tools/Button");
const LoaderText_1 = require("./Tools/LoaderText");
const DeviceDetect_1 = require("./Tools/DeviceDetect");
const Fullscreen_1 = require("./Tools/Fullscreen");
// import {scaleToWindow} from "./Tools/Scale";
const configPlanManager = window.configPlanManager;
const sprites = configPlanManager.sprites;
// const graphics = require("./Components/graphics.json");
const graphics = configPlanManager.properties;
let ModalDetail = require("./Components/DetailModal.html");
let ModalSearch = require("./Components/SearchForm.html");
let ModalAdd = require("./Components/addModal.html");
// import * as filters from 'pixi-filters';
class Application extends PIXI.Application {
    constructor(selectorId, width, height) {
        super(width, height, { transparent: true, autoResize: true });
        this.Customloader = new PIXI.loaders.Loader();
        this.Container = new PIXI.Container();
        this.ContainerButtons = new PIXI.Container();
        this.newGraphic = [];
        this._counterGraphic = 0;
        this.newGraphicObj = [];
        this.Circls = [];
        this.zoomTrans = { x: 0, y: 0, k: .1 };
        this.startDrawing = false;
        this.backgroundClicked = false;
        this.sprites = {};
        this.Graphics = [];
        this.Buttons = [];
        this.canvas = null;
        this.context = null;
        this.widthCanvas = null;
        this.heightCanvas = null;
        this.D3Interval = null;
        this.isMobile = false;
        this._modeSearh = false;
        this._graphicHovered = false;
        this.PowredByText = null;
        this.MultipleBackground = [];
        this.isZooming = false;
        this.Container.zIndex = 0;
        this.ContainerButtons.zIndex = 1;
        this.width = width;
        this.height = height;
        this.widthExtentMaximum = configPlanManager.widthExtent(this.width);
        this.heightExtentMaximum = configPlanManager.heightExtent(this.height);
        this.selector = selectorId;
        this.isMobile = DeviceDetect_1.isMobile();
        this.appendView();
        this.setup();
    }
    appendView() {
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
                this.sprites[e] = new PIXI.Sprite(resources[e].texture);
            });
        });
        $this.Customloader.onProgress.add((e) => {
            let prog = parseInt(e.progress);
            text.text = `Loading ${prog}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            if (configPlanManager.backgroundMultiple) {
                $this.addBackgroundMultiple();
            }
            else {
                $this.addBackground();
            }
            $this.addSearchButton();
            $this.addFullscreenButton();
            $this.addButtons();
            $this.addGraphics();
            $this.initZoomAction();
            $this.addPowredBy();
            $this.resizeCanvas();
            $this.Container.convertTo2d();
        });
    }
    addBackground() {
        const $this = this;
        if ($this.sprites.background.interactive) {
            $this.Container.removeChild($this.sprites.background);
        }
        $this.sprites.background.x = 0;
        $this.sprites.background.y = 0;
        $this.sprites.background.interactive = true;
        // const filter = new filters.ColorMatrixFilter();
        //$this.removeColorFromSprite(($this.sprites as any).background);
        $this.sprites.background.on("pointerdown", (e) => {
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
        $this.sprites.background.mouseover = function () {
            $('body').addClass('tooltip-hidden');
        };
        $this.Container.addChild($this.sprites.background);
    }
    addPowredBy() {
        const $this = this;
        let style = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 14,
            // fontStyle: "italic",// Font Style
            fontWeight: "bold",
            fill: ["#646565"],
        });
        $this.PowredByText = new PIXI.Text("Powred by ConceptLab", "arial");
        $this.PowredByText.anchor = new PIXI.Point(0.5, 0.5);
        $this.PowredByText.x = $this.width - 200;
        $this.PowredByText.y = $this.height - 50;
        $this.PowredByText.style = style;
        $this.ContainerButtons.addChild(this.PowredByText);
    }
    addBackgroundMultiple() {
        const $this = this;
        $this.MultipleBackground = [
            [$this.sprites.background_1, 'background_1'],
            [$this.sprites.background_2, 'background_2'],
            [$this.sprites.background_3, 'background_3'],
            [$this.sprites.background_4, 'background_4'],
            [$this.sprites.background_5, 'background_5'],
            [$this.sprites.background_6, 'background_6'],
            [$this.sprites.background_7, 'background_7'],
            [$this.sprites.background_8, 'background_8'],
            [$this.sprites.background_9, 'background_9'],
            [$this.sprites.background_10, 'background_10'],
            [$this.sprites.background_11, 'background_11'],
            [$this.sprites.background_12, 'background_12'],
            [$this.sprites.background_13, 'background_13'],
            [$this.sprites.background_14, 'background_14'],
            [$this.sprites.background_15, 'background_15'],
            [$this.sprites.background_16, 'background_16'],
        ];
        $this.MultipleBackground.map((element) => {
            const $this = this;
            let [background, name] = element;
            let found = sprites.filter(function (item) { return item.name === name; });
            background.x = found[0].x;
            background.y = found[0].y;
            background.interactive = true;
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
        });
    }
    addSearchButton() {
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
                        dataSearch[e.name].push(e.value);
                    }
                    else {
                        dataSearch[e.name] = e.value;
                    }
                });
                $this.Graphics.filter((e) => {
                    let { G: dataGraphic, Graph: obj } = e;
                    obj.alpha = 0;
                    let minDistance = 0;
                    let maxDistance = 0;
                    let lots = [];
                    if (dataSearch.hasOwnProperty('minDistance')) {
                        if (dataSearch.minDistance) {
                            minDistance = dataSearch.minDistance;
                        }
                    }
                    if (dataSearch.hasOwnProperty('maxDistance')) {
                        if (dataSearch.maxDistance) {
                            maxDistance = dataSearch.maxDistance;
                        }
                    }
                    if (dataSearch.hasOwnProperty('lots')) {
                        if (dataSearch.lots) {
                            lots = dataSearch.lots;
                        }
                    }
                    if (minDistance && maxDistance) {
                        let sSurface = dataGraphic.info.surface;
                        if (!sSurface) {
                            sSurface = dataGraphic.info.surface_habitable;
                        }
                        if (sSurface) {
                            let bool = sSurface > minDistance && sSurface < maxDistance;
                            if (!bool) {
                                return bool;
                            }
                        }
                    }
                    if (lots.length) {
                        let foundGraph = lots.filter(function (item) { return item.toLowerCase() === dataGraphic.info.landUse.abbreviation.toLowerCase(); });
                        if (!foundGraph.length) {
                            return false;
                        }
                    }
                    obj.alpha = 1;
                });
            }
            else {
                $this.addColorToBackground();
                $this.Graphics.map((e) => {
                    let { Graph: obj } = e;
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
                let { Graph: obj } = e;
                obj.alpha = 0;
            });
            $this.modeSearh = false;
        });
        /*if(($this.sprites as any).searchIcon.interactive){
            $this.ContainerButtons.removeChild(($this.sprites as any).searchIcon)
        }*/
        $this.sprites.searchIcon.x = $this.width - 150;
        $this.sprites.searchIcon.y = 50;
        $this.sprites.searchIcon.width = 100;
        $this.sprites.searchIcon.height = 100;
        $this.sprites.searchIcon.interactive = true;
        // let filter = new PIXI.filters.OutlineFilter(2, 0x99ff99);
        // ($this.sprites as any).searchIcon.filters = [filter];
        $this.sprites.searchIcon.on("pointerdown", (e) => {
            let mo = null;
            if ($('.modal.search-modal').length) {
                mo = $('.modal.search-modal');
            }
            else {
                mo = $(ModalSearch);
            }
            $(ModalSearch).attr('data-initilized', 'true');
            mo.modal({ show: true }).on("shown.bs.modal", function (e) {
                $(this).find('form').submit(function () {
                    let data = $(this).serializeArray();
                    data = data.filter((e) => e.value);
                    if (data.length) {
                        $this.addColorToBackground();
                        $this.modeSearh = true;
                        let dataSearch = {};
                        data.map((e) => {
                            dataSearch[e.name] = e.value;
                        });
                        $this.Graphics.filter((e) => {
                            let { G: dataGraphic, Graph: obj } = e;
                            obj.alpha = 0;
                            if (dataSearch.hasOwnProperty('pieces')) {
                                if (!dataGraphic.info.hasOwnProperty('pieces')) {
                                    return false;
                                }
                                if (!dataGraphic.info.pieces) {
                                    return false;
                                }
                                let sPieces = "S+1";
                                if (dataSearch.pieces == 2) {
                                    sPieces = "S+2";
                                }
                                else if (dataSearch.pieces == 3) {
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
                                if (dataSearch.surface == 1) {
                                    bool = sSurface > 100 && sSurface < 200;
                                }
                                else if (dataSearch.surface == 2) {
                                    bool = sSurface > 200 && sSurface < 300;
                                }
                                else if (dataSearch.surface == 3) {
                                    bool = sSurface > 400;
                                }
                                if (!bool) {
                                    return bool;
                                }
                            }
                            obj.alpha = 1;
                        });
                    }
                    else {
                        $this.addColorToBackground();
                        $this.Graphics.map((e) => {
                            let { Graph: obj } = e;
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
        if (configPlanManager.showSearchButton) {
            $this.ContainerButtons.addChild($this.sprites.searchIcon);
        }
    }
    addFullscreenButton() {
        const $this = this;
        $this.sprites.fulscreenIcon.x = $this.width - 150;
        $this.sprites.fulscreenIcon.y = $this.height - 150;
        $this.sprites.fulscreenIcon.width = 100;
        $this.sprites.fulscreenIcon.height = 100;
        $this.sprites.fulscreenIcon.interactive = true;
        $this.sprites.fulscreenIcon.on("pointerdown", (e) => {
            Fullscreen_1.enableFullscreen();
        });
        $this.sprites.fulscreenIcon.buttonMode = true;
        if (configPlanManager.fullScreenButton) {
            $this.ContainerButtons.addChild($this.sprites.fulscreenIcon);
        }
    }
    addGraphics() {
        const $this = this;
        const Graphics = [];
        graphics.forEach((G, k) => {
            const coords = G.coords;
            const Graph = $this.createGraph(coords, G);
            if (Graph) {
                Graph.interactive = true;
                Graph.alpha = 0;
                Graph.buttonMode = true;
                Graph.mouseover = function () {
                    if (!$this.modeSearh && !$this.startDrawing) {
                        this.alpha = 1;
                    }
                    let description = "";
                    let picture = (configPlanManager.hasOwnProperty("pictureNotFoundUrl")) ? configPlanManager.pictureNotFoundUrl : "";
                    picture = (G.info.image && G.info.image.hasOwnProperty('small')) ? G.info.image.small : picture;
                    (picture) ? description += "<div class=\"col-6 pr-0\"><img class=\"img-fluid\" src='" + picture + "'></div>" : "";
                    description += "<div class=\"col-6 pl-0\">";
                    (G.info.reference) ? description += "<p style='color:  #fff;font-weight:  bold;'>" + G.info.reference + "</p>" : "";
                    (!G.info.reference && G.info.title) ? description += "<span style='color:  #fff;font-weight:  bold;'>" + G.info.title + "</span>" : "";
                    (G.info.landUse) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff; display:block;\">Vocation:</b> " + G.info.landUse.name + "</p>" : "";
                    (G.info.surface_terrain) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff;display:block\">Surface du lot:</b> " + G.info.surface_terrain + " <span>m²<span></p>" : "";
                    (G.info.surface_habitable) ? description += "<p style=\"color:#949b46\"><b style=\"color:#fff;display:block\">Surface TT:</b> " + G.info.surface_habitable + " <span>m²<span></p>" : "";
                    description += "<p style='color: #d1a9a4'>Cliquer sur le bien pour télécharger le PDF</p>";
                    description += "</div>";
                    if (description && !$this.startDrawing) {
                        $("canvas[title]").tooltip("option", "content", "<div class=\"row\">" + description + "</div>");
                        $('body').removeClass('tooltip-hidden');
                    }
                };
                Graph.mouseout = function () {
                    if (!$this.modeSearh && !$this.startDrawing) {
                        this.alpha = 0;
                    }
                };
                Graph.pointerdown = function (e) {
                    // console.dir(this);
                    // let xx = this._bounds;
                    // console.dir(xx);
                    // $this.zoomTo(coords[0][0], coords[0][1], 4, Graph);
                    if (configPlanManager.hasOwnProperty("modalPropertyDetailId") && !$this.isZooming) {
                        $("#" + configPlanManager.modalPropertyDetailId).modal({ show: true }).on("shown.bs.modal", function (e) {
                            console.dir(G.info);
                            $(this).find("img.img-property, .reference-property, .surface-lot, .surface-total, .nbr-etage, .voaction, .cuffar, .cos, .emprise, .niveau, .download-pdf a").addClass("d-none");
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
                            if (G.info.pdfDownloadLink) {
                                let [firstPdf] = G.info.pdfDownloadLink;
                                (firstPdf) ? $(this).find(".download-pdf a").attr("href", firstPdf).removeClass("d-none") : "";
                            }
                        }).on("hidden.bs.modal", function (e) {
                            $(this).find("img.img-property, .reference-property, .surface-lot, .surface-total, .nbr-etage, .voaction, .cuffar, .cos, .emprise, .niveau, .download-pdf a").addClass("d-none");
                        });
                    }
                    if ($this.isMobile) {
                    }
                };
                $this.Container.addChild(Graph);
                Graphics.push({ G, Graph });
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
    initZommActionFunctionalities() {
        const $this = this;
        let initX = 0;
        let initY = -100;
        let scalInit = .5;
        if (configPlanManager.hasOwnProperty("initialData")) {
            initX = configPlanManager.initialData.x;
            initY = configPlanManager.initialData.y;
            scalInit = configPlanManager.initialData.k;
        }
        if (DeviceDetect_1.isMobile()) {
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
    zoomActions($this) {
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
    startZoomActions($this) {
        // console.dir("start zoom");
        $this.isZooming = true;
    }
    endZoomActions($this) {
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
    createGraph(coords, graphInfo = {}) {
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
                if (graphInfo.hasOwnProperty('info')) {
                    if (graphInfo.info.landUse) {
                        if (graphInfo.info.landUse.color) {
                            color = graphInfo.info.landUse.color;
                            color = color.replace(/#/gi, "0x");
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
        }
        return false;
    }
    addButtons() {
        const $this = this;
        if ($this.Buttons.length) {
            $this.Buttons.map((e) => {
                $this.ContainerButtons.removeChild(e);
            });
            $this.Buttons = [];
        }
        let width = 150;
        let height = 50;
        let x = 10;
        let y = $this.height - height - 20;
        let txt = "Start drawing";
        if ($this.startDrawing) {
            let txt = "Stop drawing";
        }
        const b = new Button_1.default(width, height, x, y, txt, null);
        $this.stage.addChild($this.ContainerButtons);
        //b.buttonMode = true;
        b.on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                b.text.text = "Start drawing";
                $this._counterGraphic++;
                if ($this.newGraphic.length) {
                    $('#property #coords').html(JSON.stringify($this.newGraphic));
                    $("#property").modal({ show: true });
                }
                $this.newGraphic = [];
            }
            else {
                b.text.text = "Stop drawing";
            }
        });
        $this.Buttons.push(b);
        width = 250;
        height = 50;
        x = 170;
        y = $this.height - height - 20;
        const returnLastActionB = new Button_1.default(width, height, x, y, "Return to last action", null);
        //returnLastActionB.buttonMode = true;
        returnLastActionB.on("click", () => {
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
    getD3X(x) {
        const $this = this;
        return (x - $this.zoomTrans.x) / $this.zoomTrans.k;
    }
    getD3Y(y) {
        const $this = this;
        return (y - $this.zoomTrans.y) / $this.zoomTrans.k;
    }
    resizeCanvas() {
        const $this = this;
        $this.rendererResize($this);
        window.addEventListener('resize', () => {
            return $this.rendererResize($this);
        });
        window.addEventListener('deviceOrientation', () => {
            return $this.rendererResize($this);
        });
    }
    ;
    rendererResize($this) {
        if (DeviceDetect_1.isMobile() || configPlanManager.fullSizeShow) {
            $this.width = window.innerWidth;
            $this.height = window.innerHeight;
        }
        let ratio = Math.min(window.innerWidth / $this.width, window.innerHeight / $this.height);
        if (ratio > 1) {
            ratio = 1;
        }
        $this.Container.scale.x =
            $this.Container.scale.y =
                $this.ContainerButtons.scale.x =
                    $this.ContainerButtons.scale.y = ratio;
        $this.sprites.searchIcon.x = $this.width - 150;
        $this.sprites.searchIcon.y = 50;
        $this.sprites.fulscreenIcon.x = $this.width - 150;
        $this.sprites.fulscreenIcon.y = $this.height - 150;
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
    }
    ;
    removeColorFromBackground() {
        const $this = this;
        if (configPlanManager.backgroundMultiple) {
            $this.MultipleBackground.map((element) => {
                let [background] = element;
                $this.removeColorFromSprite(background);
            });
        }
        else {
            $this.removeColorFromSprite($this.sprites.background);
        }
    }
    addColorToBackground() {
        const $this = this;
        if (configPlanManager.backgroundMultiple) {
            $this.MultipleBackground.map((element) => {
                let [background] = element;
                $this.removeFiltersFromSprite(background);
            });
        }
        else {
            $this.removeFiltersFromSprite($this.sprites.background);
        }
    }
    removeColorFromSprite(sprite) {
        const filter = new PIXI.filters.ColorMatrixFilter();
        sprite.filters = [filter];
        filter.desaturate();
    }
    removeFiltersFromSprite(sprite) {
        sprite.filters = [];
    }
    get modeSearh() {
        return this._modeSearh;
    }
    set modeSearh(value) {
        this._modeSearh = value;
    }
}
exports.default = Application;
window.onload = () => {
    (() => {
        let [width, height] = configPlanManager.size;
        if (DeviceDetect_1.isMobile()) {
            [width, height] = configPlanManager.sizePhone;
            if (width > height) {
                [width, height] = [height, width];
            }
        }
        return new Application("container", width, height);
    })();
};
//# sourceMappingURL=App.js.map