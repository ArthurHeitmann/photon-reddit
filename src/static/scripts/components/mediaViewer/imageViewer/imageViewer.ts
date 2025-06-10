import {PhEvents} from "../../../types/Events";
import {getLoadingIcon, nonDraggableElement} from "../../../utils/htmlStatics";
import {hasParams, makeElement, sleep} from "../../../utils/utils";
import {ControlsLayoutSlots} from "../../misc/controlsBar/controlsBar";
import Users from "../../../multiUser/userManagement";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {MediaElement} from "../mediaElement";
import {ImageLoadingPolicy, PhotonSettings} from "../../global/photonSettings/settingsConfig";

interface ImageInitData {
	originalUrl: string,
	previewUrl?: string,
	displayUrl?: string
	caption?: string,
	heightHint?: number
}

/**
 * A single image or a gallery of images. Can (depending on user settings) first load preview images and in fullscreen
 * load origin high res images.
 */
export default class Ph_ImageViewer extends Ph_PhotonBaseElement implements MediaElement {
	caption: string;
	controls: ControlsLayoutSlots;
	element: HTMLElement;
	url: string;
	private refreshButton: HTMLElement;
	private hdButton: HTMLElement;
	private loadingIcon: HTMLElement;
	private originalImage: HTMLImageElement;
	private previewImage: HTMLImageElement = null;
	private originalSrc: string;

	constructor(initData?: ImageInitData, url?: string) {
		super();
		if (!hasParams(arguments)) return;

		this.element = this;
		this.url = url ?? "";
		this.controls = {
			rightItems: [
				this.loadingIcon = getLoadingIcon(),
				this.hdButton = makeElement("button", { class: "hdButton" }, [nonDraggableElement(
					makeElement("img", { src: "/img/hd.svg?noThemeOverride", alt: "hd", onclick: this.startLoadingOriginal.bind(this) }))]),
				this.refreshButton = makeElement("button", { class: "refreshButton hide", "data-tooltip": "Reload Image", onclick: this.refreshImages.bind(this) }, [
					makeElement("img", { src: "/img/refresh.svg?noThemeOverride", alt: "↻" })
				])
			]
		};

		if (initData)
			this.init(initData);
	}

	init(initData: ImageInitData) {
		this.classList.add("imageViewer");
		this.classList.add("loading");
		if (Number(initData.heightHint))
			this.style.setProperty("--height-hint", `${initData.heightHint}px`);

		this.caption = initData.caption;
		this.loadingIcon.classList.add("hide");
		this.hdButton.classList.add("hide");
		this.url = initData.displayUrl || initData.originalUrl;

		this.originalImage = makeElement("img", {
			class: "original",
			alt: initData.caption || this.url,
			onerror: this.onImageError.bind(this),
			onload: () => this.classList.remove("loading"),
		}) as HTMLImageElement;
		nonDraggableElement(this.originalImage);
		if (initData.previewUrl && Users.global.d.photonSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal) {
			this.hdButton.classList.remove("hide");
			this.previewImage = makeElement("img", {
				class: "preview",
				src: initData.previewUrl,
				alt: initData.caption || this.url,
				onerror: this.startLoadingOriginal.bind(this),
				onload: () => this.classList.remove("loading"),
			}) as HTMLImageElement;
			nonDraggableElement(this.previewImage);
			this.append(this.previewImage);
			this.addEventListener(PhEvents.enteredFullscreen, this.onFullscreenEnter.bind(this));
			this.originalSrc = initData.originalUrl;
			this.originalImage.classList.add("hide");
		}
		else {
			this.originalImage.src = initData.originalUrl;
		}
		this.append(this.originalImage);

		this.addWindowEventListener(PhEvents.settingsChanged, this.onSettingsChange.bind(this));
	}

	startLoadingOriginal() {
		this.hdButton.classList.add("hide");

		if (!this.previewImage)
			return;
		if (this.originalImage.src)
			return;

		this.loadingIcon.classList.remove("hide");
		this.originalImage.addEventListener("load", () => {
			this.previewImage.remove();
			this.previewImage = undefined;
			this.loadingIcon.classList.add("hide");
		}, { once: true });
		this.originalImage.src = this.originalSrc;
		this.originalImage.classList.remove("hide");
	}

	onFullscreenEnter() {
		if (Users.global.d.photonSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysPreview)
			this.startLoadingOriginal();
	}

	onSettingsChange(e: CustomEvent) {
		const changed = e.detail as PhotonSettings;
		if (changed.imageLoadingPolicy && changed.imageLoadingPolicy === ImageLoadingPolicy.alwaysOriginal) {
			this.startLoadingOriginal();
		}
	}

	refreshImages() {
		this.tryRefreshImage(this.previewImage);
		this.tryRefreshImage(this.originalImage);
		this.refreshButton.classList.add("hide");
	}

	async tryRefreshImage(img: HTMLImageElement) {
		if (img.complete && img.naturalWidth)
			return;
		const currentSrc = img.src;
		img.src = "";
		await sleep(100);
		img.src = currentSrc;
	}

	onImageError() {
		this.refreshButton.classList.remove("hide");
	}

	onKeyDownEvent(e: KeyboardEvent): void {
		if (e.code == "KeyH") {
			this.startLoadingOriginal();
		}
	};
}

customElements.define("ph-image-viewer", Ph_ImageViewer);

