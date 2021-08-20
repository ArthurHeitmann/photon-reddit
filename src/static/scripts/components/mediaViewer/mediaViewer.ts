import { getImgurContent, ImgurContent, ImgurContentType } from "../../api/imgurApi";
import { RedditApiData, RedditApiType } from "../../types/misc";
import { mediaHostsWhiteList } from "../../utils/consts";
import { nonDraggableElement } from "../../utils/htmlStatics";
import { linksToSpa } from "../../utils/htmlStuff";
import {
	attachOnFullscreenChangeListener,
	enterFullscreen,
	exitFullscreen,
	hasHTML,
	hasParams,
	isFullscreen,
	makeElement
} from "../../utils/utils";
import { globalSettings } from "../global/photonSettings/photonSettings";
import Ph_ControlsBar from "../misc/controlsBar/controlsBar";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown";
import { DropDownEntryParam } from "../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_SwitchingImage from "../misc/switchableImage/switchableImage";
import Ph_Toast, { Level } from "../misc/toast/toast";
import Ph_PhotonBaseElement from "../photon/photonBaseElement/photonBaseElement";
import Ph_DraggableWrapper from "../post/postBody/draggableWrapper/draggableWrapper";
import { Ph_ViewState } from "../viewState/viewState";
import Ph_ImageViewer from "./imageViewer/imageViewer";
import { MediaElement } from "./mediaElement";
import Ph_GifVideo from "./videoPlayer/gifVideo/gifVideo";
import Ph_SimpleVideo from "./videoPlayer/simpleVideo/simpleVideo";
import Ph_VideoPlayer from "./videoPlayer/videoPlayer";

export default class Ph_MediaViewer extends Ph_PhotonBaseElement {
	controls: Ph_ControlsBar;
	draggableWrapper: Ph_DraggableWrapper;
	mediaElements: MediaElement[];
	currentIndex: number;
	isInFullscreenState: boolean = false;
	fullscreenImage: Ph_SwitchingImage;
	settingsDropDown: Ph_DropDown;
	elementLink: HTMLAnchorElement;
	elementCaption: HTMLElement;
	currentIndexDisplay: HTMLDivElement;

	static fromPostData_Image(postData: RedditApiType): Ph_MediaViewer {
		if (postData.data["preview"] && postData.data["preview"]["images"][0]["resolutions"].length) {
			const previews: any[] = postData.data["preview"]["images"][0]["resolutions"];
			return new Ph_MediaViewer([new Ph_ImageViewer({
				originalUrl: postData.data["url"],
				previewUrl: previews[previews.length - 1]["url"]
			})]);
		}
		else {
			return Ph_MediaViewer.fromUrl_Image(postData.data["url"]);
		}
	}

	static fromUrl_Image(url: string): Ph_MediaViewer {
		return new Ph_MediaViewer([new Ph_ImageViewer({
			originalUrl: url,
		})]);
	}

	static fromPostData_Video(postData: RedditApiType): Ph_MediaViewer {
		const mediaViewer = new Ph_MediaViewer();
		const video = Ph_VideoPlayer.fromPostData({ postData })
		mediaViewer.init([ video]);
		return mediaViewer;
	}

	static fromUrl_Video(url: string): Ph_MediaViewer {
		const mediaViewer = new Ph_MediaViewer();
		const video = Ph_VideoPlayer.fromPostData({ url })
		mediaViewer.init([video]);
		return mediaViewer;
	}

	static fromPostData_RedditGallery(postData: RedditApiType): Ph_MediaViewer {
		const mediaElements: MediaElement[] = [];
		const items: {}[] = postData.data["gallery_data"]["items"];
		for (const item of items) {
			const itemData = postData.data["media_metadata"][item["media_id"]];
			if (itemData["status"] === "failed") {
				new Ph_Toast(Level.warning, "Couldn't load a gallery image");
				continue;
			}
			switch (itemData["e"]) {
				case "Image":
					const previews: {}[] = itemData["p"];
					mediaElements.push(new Ph_ImageViewer({
						originalUrl: itemData["s"]["u"],
						previewUrl: previews.length > 0 && previews[previews.length - 1]["u"] || undefined,
						caption: item["caption"] || "",
						displayUrl: item["outbound_url"]
					}))
					break;
				case "AnimatedImage":
					const videoPlayer = new Ph_VideoPlayer(item["outbound_url"] || postData.data["url"]);
					mediaElements.push(videoPlayer);
					if ("mp4" in itemData["s"]) {
						videoPlayer.init(new Ph_SimpleVideo([{
							src: itemData["s"]["mp4"],
							type: "video/mp4"
						}]));
					}
					else {
						videoPlayer.init(new Ph_GifVideo(itemData["s"]["gif"]));
					}
					break;
				default:
					console.warn(`Unknown gallery item type ${itemData["e"]}`, itemData);
					new Ph_Toast(Level.warning, `Unknown gallery item type ${itemData["e"]}`)
			}
		}

		return  new Ph_MediaViewer(mediaElements);
	}

	static fromUrl(url: string): Ph_MediaViewer | null {
		if (Ph_MediaViewer.isUrlVideo(url))
			return Ph_MediaViewer.fromUrl_Video(url);
		else if (Ph_MediaViewer.isUrlImgur(url))
			return Ph_MediaViewer.fromImgurUrl(url);
		else if (Ph_MediaViewer.isUrlImage(url))
			return Ph_MediaViewer.fromUrl_Image(url);
		else
			return null;
	}

	static fromImgurUrl(url: string): Ph_MediaViewer {
		const mediaViewer = new Ph_MediaViewer();
		getImgurContent(url).then((contents: ImgurContent[]) =>
			mediaViewer.init(contents.map(imgurElement => {
				if (imgurElement.type === ImgurContentType.image)
					return Ph_MediaViewer.makeImgurImage(imgurElement, url);
				else if (imgurElement.type === ImgurContentType.video)
					return Ph_MediaViewer.makeImgurVideo(imgurElement, url);
				else
					throw new Error("oops");
			})))
			.catch(() => mediaViewer.init([]));
		return mediaViewer;
	}

	private static makeImgurImage(data: ImgurContent, url: string) {
		return new Ph_ImageViewer({
			originalUrl: data.link,
			previewUrl: data.preview,
			caption: data.caption,
			displayUrl: url
		});
	}

	private static makeImgurVideo(data: ImgurContent, url: string) {
		const videoPlayer = new Ph_VideoPlayer(url);
		videoPlayer.caption = data.caption;
		videoPlayer.init(new Ph_SimpleVideo([{
			src: data.link,
			type: "video/mp4"
		}]));
		return videoPlayer;
	}

	static isPostVideo(postData: RedditApiData): boolean {
		if (Ph_MediaViewer.isUrlVideo(postData["url"]))
			return true
		else if (/https?:\/\/clips.twitch.tv\/[\w-]+/.test(postData["url"]) && postData["media"])
			return true;
		else if (postData["post_hint"] == "hosted:video")
			return true;
		return false
	}

	static isUrlVideo(url: string): boolean {
		return Ph_MediaViewer.isUrlOnWhiteList(url) && new RegExp(
			"^((https?://(i|m)?\.?imgur\\.com\/[\\w-]+.(gifv|mp4))|" +		// imgur
			"(https?://v.redd.it\\/[\\w-]+)|" +										// v.redd.it
			"(https?://(www\\.)+reddit\\.com/link/\\w+/video/\\w+)|" +						// other v.redd.it?
			"(https?://w?w?w?\\.?redgifs.com/watch/\\w+))|" +						// redgifs
			"(https?://gfycat.com/[\\w-]+)|" +										// gfycat
			"(giphy\\.com/\\w+/\\w+)|" +											// giphy
			"(streamable\\.com/\\w+)|" +											// streamable
			"(\\.(gif|mp4)(\\?.*)?$)"												// .gif or .mp4 file
		).test(url);
	}

	static isPostImage(postData: RedditApiData): boolean {
		return postData["post_hint"] == "image" ||
			Ph_MediaViewer.isUrlImage(postData["url"])
	}

	static isUrlImage(url: string): boolean {
		return Ph_MediaViewer.isUrlOnWhiteList(url) && /^[^#]+\.(png|jpg|jpeg|svg|webp)(\?.*)?$/i.test(url);		// ends with img file ending and does not have a "#" before that
	}

	static isUrlImgur(url: string): boolean {
		return /^(https?:\/\/)?(\w+\.)?imgur\.com\/\w+(\/\w+)?/.test(url);
	}

	static isUrlOnWhiteList(url: string): boolean {
		let urlHost: string;
		try {
			urlHost = (new URL(url)).hostname.match(/(?:[^.]+\.)?[^.]+$/)[0];		// sub.en.domain.com --> domain.com
		}
		catch {
			return false;
		}
		for (const host of mediaHostsWhiteList) {
			if (host === urlHost)
				return true;
		}
		return false;
	}

	constructor(initElements?: MediaElement[]) {
		super();
		if (hasHTML(this)) return;

		this.classList.add("mediaViewer");

		this.draggableWrapper = new Ph_DraggableWrapper();
		this.append(this.draggableWrapper);

		this.controls = new Ph_ControlsBar(globalSettings.firstShowControlBar);
		this.controls.addShowHideListeners(this.draggableWrapper);
		this.append(this.controls);

		if (initElements)
			this.init(initElements);
	}

	init(initElements: MediaElement[]) {
		if (!hasParams(arguments)) return;

		if (initElements.length === 0) {
			this.innerText = "Nothing loaded";
			return;
		}

		this.mediaElements = initElements;

		const controlSlots: HTMLElement[] = [];

		// prev/next + i
		if (initElements.length > 1) {
			const prevBtn = Ph_ControlsBar.makeImageButton("/img/playBack.svg");
			prevBtn.addEventListener("click", this.previousGalleryElement.bind(this));
			controlSlots.push(prevBtn);
			const nextBtn = Ph_ControlsBar.makeImageButton("/img/playNext.svg");
			nextBtn.addEventListener("click", this.nextGalleryElement.bind(this));
			controlSlots.push(nextBtn);
			controlSlots.push(this.controls.firstLeftItemsSlot);
			this.currentIndexDisplay = document.createElement("div");
			this.currentIndexDisplay.className = "textOnly";
			controlSlots.push(this.currentIndexDisplay);
		}
		else
			controlSlots.push(this.controls.firstLeftItemsSlot);
		controlSlots.push(this.controls.leftItemsSlot);
		// spacer
		const spacer = Ph_ControlsBar.makeSpacer();
		controlSlots.push(spacer);
		controlSlots.push(this.controls.rightItemsSlot);
		//caption
		this.elementCaption = makeElement("div", { class: "caption" }, [
			makeElement("div", { "class": "scrollablePopup" }),
			makeElement("div", { "class": "inlinePreview textOnly" }),
		]);
		controlSlots.push(this.elementCaption);
		// link
		this.elementLink = document.createElement("a");
		this.elementLink.className = "textOnly";
		this.elementLink.href = "";
		this.elementLink.setAttribute("excludeLinkFromSpa", "");
		this.elementLink.setAttribute("excludeLinkFromMedia", "");
		controlSlots.push(this.elementLink);
		// reset view
		const resetViewBtn = Ph_ControlsBar.makeImageButton("/img/reset.svg");
		resetViewBtn.classList.add("resetView");
		resetViewBtn.classList.add("evenSmaller");
		resetViewBtn.setAttribute("data-tooltip", "Reset View (R)");
		resetViewBtn.addEventListener("click", () => this.draggableWrapper.reset());
		controlSlots.push(resetViewBtn);
		// settings dropdown
		const settingsImg = document.createElement("img");
		settingsImg.src = "/img/settings2.svg";
		nonDraggableElement(settingsImg)
		settingsImg.alt = "settings";
		this.settingsDropDown = new Ph_DropDown(
			[{
				label: "Filters",
				labelImgUrl: "/img/filters.svg",
				nestedEntries: [
					this.makeRotateFilter(),
					this.makeBgFilter(),
					...this.makeFiltersFilter()
				]
			}],
			settingsImg, DirectionX.right, DirectionY.top, false
		)
		this.settingsDropDown.toggleButton.classList.add("smaller");
		controlSlots.push(this.settingsDropDown);
		// fullscreen
		const { b: fsBtn, img: fsImg } = Ph_ControlsBar.makeSwitchingImageBtn(new Ph_SwitchingImage([
			{ src: "/img/fullscreen.svg", key: "fullscreen" },
			{ src: "/img/minimize.svg", key: "minimize" },
		]));
		this.fullscreenImage = fsImg;
		fsBtn.addEventListener("click", this.toggleFullscreen.bind(this));
		controlSlots.push(fsBtn);

		this.controls.setupSlots(controlSlots);

		this.setupKeyListeners();
		attachOnFullscreenChangeListener(this, this.onFullscreenChange.bind(this));
		this.draggableWrapper.addEventListener("dblclick", this.toggleFullscreen.bind(this));
		for (const media of this.mediaElements) {
			media.element.addEventListener("ph-controls-changed",
				e => this.controls.updateSlotsWith(media.controls));
		}

		linksToSpa(this);
		this.currentIndex = 0;
		this.displayCurrentElement();
	}

	setupKeyListeners() {
		this.tabIndex = 0;
		this.addEventListener("keyup", (e: KeyboardEvent) => {
			if ((e.target as HTMLElement).tagName === "INPUT")
				return;
			const activeElement = this.mediaElements[this.currentIndex];
			activeElement.onKeyDownEvent?.(e);
			switch (e.code) {
				case "KeyF":
					this.toggleFullscreen();
					break;
				case "KeyR":
					this.draggableWrapper.setMoveXY(0, 0);
					this.draggableWrapper.setZoom(1);
					break;
				case "ArrowRight":
					if (this.mediaElements.length > 1 && (!activeElement.usesArrowKeys || e.ctrlKey || e.shiftKey))
						this.nextGalleryElement(false);
					break;
				case "ArrowLeft":
					if (this.mediaElements.length > 1 && (!activeElement.usesArrowKeys || e.ctrlKey || e.shiftKey))
						this.previousGalleryElement(false);
					break;
			}
		});
		this.addEventListener("keydown", (e: KeyboardEvent) => {
			if (["Space", "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"].includes(e.code)
				&& (e.target as HTMLElement).tagName !== "INPUT")
				e.preventDefault();
		})
	}

	displayCurrentElement() {
		const newMedia = this.mediaElements[this.currentIndex];
		// replace element
		this.draggableWrapper.children[0]?.remove();
		this.draggableWrapper.append(newMedia.element);
		// gallery index
		if (this.mediaElements.length > 1)
			this.currentIndexDisplay.innerText = `${this.currentIndex + 1}/${this.mediaElements.length}`;
		// capation
		(this.elementCaption.children[0] as HTMLElement).innerText = newMedia.caption || "";
		(this.elementCaption.children[1] as HTMLElement).innerText = newMedia.caption || "";
		// link
		this.elementLink.href = newMedia.url;
		const shortLinkMatches = newMedia.url.match(/[\w-_]+\.[\w-_]+(?=([/?#].*)?$)/);	// sub.en.domain.com?query --> domain.com
		this.elementLink.innerText = shortLinkMatches?.[0] || newMedia.url.slice(0, 10);
		// controls slots
		this.controls.updateSlotsWith(newMedia.controls);
		// fs event
		if (isFullscreen())
			newMedia.element.dispatchEvent(new Event("ph-entered-fullscreen"));
	}

	nextGalleryElement(fixScrollToBottom = true) {
		fixScrollToBottom && Ph_ViewState.getViewOf(this).saveScroll(this, "bottom");
		this.currentIndex = (this.currentIndex + 1) % this.mediaElements.length;
		this.displayCurrentElement();
		fixScrollToBottom && Ph_ViewState.getViewOf(this).loadScroll();
	}

	previousGalleryElement(fixScrollToBottom = true) {
		fixScrollToBottom && Ph_ViewState.getViewOf(this).saveScroll(this, "bottom");
		this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.mediaElements.length - 1;
		this.displayCurrentElement();
		fixScrollToBottom && Ph_ViewState.getViewOf(this).loadScroll();
	}

	toggleFullscreen() {
		if (isFullscreen()) {
			exitFullscreen()
		}
		else {
			Ph_ViewState.getViewOf(this)?.saveScroll(this, "top");
			enterFullscreen(this);
		}
	}

	onFullscreenChange() {
		if (isFullscreen())
			this.onEnterFullscreen();
		else
			this.onExitFullscreen();
	}

	onEnterFullscreen() {
		this.isInFullscreenState = true;
		this.mediaElements[this.currentIndex].element.dispatchEvent(new Event("ph-entered-fullscreen"));
		this.draggableWrapper.activate();
		this.fullscreenImage.showImage("minimize");
		this.classList.add("isInFullscreen");
	}

	onExitFullscreen() {
		this.isInFullscreenState = false;
		this.draggableWrapper.deactivate();
		this.draggableWrapper.reset();
		this.fullscreenImage.showImage("fullscreen")
		this.classList.remove("isInFullscreen");
		Ph_ViewState.getViewOf(this).loadScroll();
	}

	cleanup() {
		super.cleanup();
		this.mediaElements
			?.filter(elem => elem.element instanceof Ph_PhotonBaseElement)
			.forEach(elem => (elem.element as Ph_PhotonBaseElement).cleanup());
	}

	private makeRotateFilter(): DropDownEntryParam {
		const wrapper = document.createElement("div");
		wrapper.className = "filterWrapper rotateFilter";
		const makeRotateButton = (rotateDir: "cw" | "ccw") => {
			const rotateBtn = document.createElement("button");
			rotateBtn.className = `rotateBtn transparentButtonAlt ${rotateDir}`;
			rotateBtn.setAttribute("data-tooltip",`rotate ${rotateDir}`);
			rotateBtn.innerHTML = `<img src="/img/reset.svg" alt="rotate ${rotateDir}">`;
			rotateBtn.addEventListener("click", this.onRotate.bind(this));
			return rotateBtn;
		}
		wrapper.append(makeRotateButton("ccw"));
		wrapper.append(makeRotateButton("cw"));
		return <DropDownEntryParam> { label: wrapper, nonSelectable: true };
	}

	private onRotate(e: MouseEvent) {
		this.draggableWrapper.addRotation((e.currentTarget as HTMLElement).classList.contains("cw") ? 90 : -90);
	}

	private makeBgFilter(): DropDownEntryParam {
		const wrapper = document.createElement("div");
		wrapper.className = "filterWrapper bgFilter";
		const label = document.createElement("span");
		label.innerText = "background:";
		wrapper.append(label);
		const colorInput = document.createElement("input");
		colorInput.type = "text";
		colorInput.value = "initial";
		colorInput.addEventListener("input", this.onBgColorChange.bind(this));
		wrapper.append(colorInput);
		return <DropDownEntryParam> { label: wrapper, nonSelectable: true };
	}

	private onBgColorChange(e: InputEvent) {
		const newColor = (e.target as HTMLInputElement).value;
		this.draggableWrapper.style.setProperty("--draggableBg", `${newColor}`);
	}

	private makeFiltersFilter(): DropDownEntryParam[] {
		const out: HTMLElement[] = [];
		const makeSlider = (filterName: string, init: number, min: number, max: number, append = "") => {
			const sliderWrapper = document.createElement("div");
			sliderWrapper.className = "filterWrapper filtersFilterWrapper";
			sliderWrapper.insertAdjacentHTML("afterbegin", `<span>${filterName}</span>`);
			const manualInput = document.createElement("input");
			manualInput.type = "text";
			manualInput.value = init.toString();
			manualInput.oninput = e => this.draggableWrapper.style.setProperty(`--${filterName}`, manualInput.value + append);
			sliderWrapper.append(manualInput);
			return sliderWrapper;

		};
		out.push(makeSlider("brightness", 1, 0, 4));
		out.push(makeSlider("contrast", 1, 0, 2));
		out.push(makeSlider("saturate", 1, 0, 2));
		out.push(makeSlider("grayscale", 0, 0, 1));
		out.push(makeSlider("hue-rotate", 0, 0, 360, "deg"));
		out.push(makeSlider("invert", 0, 0, 1));
		return out.map(el => (<DropDownEntryParam> { label: el, nonSelectable: true }));
	}
}

customElements.define("ph-media-viewer", Ph_MediaViewer);
