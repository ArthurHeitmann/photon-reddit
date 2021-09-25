import { getLoadingIcon, nonDraggableElement } from "../../../utils/htmlStatics";
import { hasParams } from "../../../utils/utils";
import { ImageLoadingPolicy, PhotonSettings } from "../../global/photonSettings/photonSettings";
import { ControlsLayoutSlots } from "../../misc/controlsBar/controlsBar";
import Users from "../../multiUser/userManagement";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import { MediaElement } from "../mediaElement";

interface ImageInitData {
	originalUrl: string,
	previewUrl?: string,
	displayUrl?: string
	caption?: string
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
	originalImage: HTMLImageElement;
	previewImage: HTMLImageElement = null;
	originalSrc: string;

	constructor(initData: ImageInitData) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("imageViewer")

		this.caption = initData.caption;
		this.controls = { rightItems: [getLoadingIcon()] };
		this.controls.rightItems[0].classList.add("hide");
		this.element = this;
		this.url = initData.displayUrl || initData.originalUrl;

		this.originalImage = document.createElement("img")
		this.originalImage.className = "original";
		this.originalImage.alt = initData.caption || this.url;
		this.originalImage.onerror = this.makeOnImageError();
		nonDraggableElement(this.originalImage);
		if (initData.previewUrl && Users.current.d.photonSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal) {
			this.previewImage = document.createElement("img");
			this.previewImage.className = "preview";
			this.previewImage.src = initData.previewUrl
			this.previewImage.alt = initData.caption || this.url;
			this.previewImage.onerror = this.startLoadingOriginal.bind(this);
			nonDraggableElement(this.previewImage);
			this.append(this.previewImage);
			this.addEventListener("ph-entered-fullscreen", this.onFullscreenEnter.bind(this));
			this.originalSrc = initData.originalUrl;
			this.originalImage.classList.add("hide");
		}
		else {
			this.originalImage.src = initData.originalUrl;
		}
		this.append(this.originalImage);

		this.addWindowEventListener("ph-settings-changed", this.onSettingsChange.bind(this));
	}

	startLoadingOriginal() {
		if (!this.previewImage)
			return;
		if (this.originalImage.src)
			return;

		this.controls.rightItems[0].classList.remove("hide");
		this.originalImage.addEventListener("load", () => {
			this.previewImage.remove();
			this.previewImage = undefined;
			this.controls.rightItems[0].classList.add("hide");
		}, { once: true });
		this.originalImage.src = this.originalSrc;
		this.originalImage.classList.remove("hide");
	}

	onFullscreenEnter() {
		if (Users.current.d.photonSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysPreview)
			this.startLoadingOriginal();
	}

	onSettingsChange(e: CustomEvent) {
		const changed = e.detail as PhotonSettings;
		if (changed.imageLoadingPolicy && changed.imageLoadingPolicy === ImageLoadingPolicy.alwaysOriginal) {
			this.startLoadingOriginal();
		}
	}

	makeOnImageError() {
		return (e: Event) => {
			const currentImg = e.currentTarget as HTMLImageElement;
			const refreshButton = document.createElement("button");
			refreshButton.innerHTML = `<img src="/img/refresh.svg" alt="refresh">`;
			refreshButton.className = "refreshButton";
			refreshButton.setAttribute("data-tooltip", "Reload Image");
			refreshButton.onclick = () => {
				const refreshButtonIndex = this.controls.rightItems.findIndex(e => e === refreshButton);
				this.controls.rightItems.splice(refreshButtonIndex, 1);
				this.dispatchEvent(new Event("ph-controls-changed"));
				const currentSrc = currentImg.src;
				currentImg.src = "";
				currentImg.src = currentSrc;
			};
			this.controls.rightItems.push(refreshButton);
			this.dispatchEvent(new Event("ph-controls-changed"));
		}
	}
}

customElements.define("ph-image-viewer", Ph_ImageViewer);

