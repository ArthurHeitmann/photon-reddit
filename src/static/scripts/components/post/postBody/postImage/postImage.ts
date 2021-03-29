import { RedditApiType } from "../../../../types/misc.js";
import { elementWithClassInTree } from "../../../../utils/htmlStuff.js";
import { globalSettings, ImageLoadingPolicy, PhotonSettings } from "../../../global/photonSettings/photonSettings.js";
import Ph_ControlsBar from "../../../misc/controlsBar/controlsBar.js";
import Ph_Toast, { Level } from "../../../misc/toast/toast.js";
import Ph_DraggableWrapper from "../draggableWrapper/draggableWrapper.js";

export interface GalleryInitData {
	originalUrl: string,
	previewUrl?: string,
	caption: string
}

interface GalleryDataInternal {
	caption: string,
	previewImg: HTMLImageElement,
	originalImg: HTMLImageElement,
	originalSrc: string,
}

/**
 * A single image or a gallery of images. Can (depending on user settings) first load preview images and in fullscreen
 * load origin high res images.
 */
export default class Ph_PostImage extends HTMLElement {
	imageMax: Ph_DraggableWrapper;
	controls: Ph_ControlsBar;
	galleryWrapper: HTMLElement;
	prevImageButton: HTMLButtonElement;
	nextImageButton: HTMLButtonElement;
	imageIndexText: HTMLDivElement;
	caption: HTMLDivElement;
	loadingIcon: HTMLImageElement;
	galleryData: GalleryDataInternal[] = [];
	currentImageIndex: number = 0;

	static fromPostData(postData: RedditApiType): Ph_PostImage {
		let galleryInitData: GalleryInitData[] = [];

		// is gallery
		if (postData.data["gallery_data"]) {
			const items: {}[] = postData.data["gallery_data"]["items"];
			for (const item of items) {
				const imgData = postData.data["media_metadata"][item["media_id"]];
				if (imgData["status"] === "failed") {
					new Ph_Toast(Level.warning, "Couldn't load a gallery image");
					continue;
				}
				const previews: {}[] = imgData["p"];
				galleryInitData.push({
					caption: item["caption"] || postData.data["title"],
					originalUrl: imgData["s"]["u"],
					previewUrl: previews.length > 0 && previews[previews.length - 1]["u"] || undefined,
				});
			}
		}
		// normal image
		else {
			// reddit has generated a preview for us
			if (postData.data["preview"]) {
				const previews: any[] = postData.data["preview"]["images"][0]["resolutions"];
				galleryInitData = [{
					caption: postData.data["title"],
					originalUrl: postData.data["url"],
					previewUrl: previews[previews.length - 1]["url"],
				}];
			}
			// just a raw image url
			else {
				galleryInitData = [{
					caption: postData.data["title"],
					originalUrl: postData.data["url"],
				}];

			}
		}

		return new Ph_PostImage(galleryInitData);
	}

	constructor(galleryInitData: GalleryInitData[]) {
		super();

		let hasUnloadedOriginals = false;
		for (const img of galleryInitData) {
			const imgData: GalleryDataInternal = {
				caption: img.caption,
				originalSrc: img.previewUrl && globalSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal ? img.originalUrl : undefined,
				originalImg: img.previewUrl && globalSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal ? null : document.createElement("img"),
				previewImg: img.previewUrl && globalSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal ? document.createElement("img") : undefined
			}

			if (img.previewUrl && globalSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysOriginal) {
				imgData.previewImg.alt = img.previewUrl;
				imgData.previewImg.src = img.previewUrl;
				imgData.previewImg.draggable = false;
			}
			else if (img.originalUrl) {
				imgData.originalImg.alt = img.originalUrl;
				imgData.originalImg.src = img.originalUrl;
				imgData.originalImg.draggable = false;
			}
			else {
				if (!imgData.originalImg)
					imgData.originalImg = document.createElement("img");
				imgData.originalImg.src= "/img/error.svg";
				new Ph_Toast(Level.error, "No image URL given");
			}

			if (!hasUnloadedOriginals && imgData.previewImg && imgData.originalSrc)
				hasUnloadedOriginals = true;

			this.galleryData.push(imgData);
		}

		if (hasUnloadedOriginals)
			window.addEventListener("settingsChanged", (e: CustomEvent) => this.onAlwaysLoadOriginals(e.detail), { once: true });

		this.classList.add("postImage");
		this.setAttribute("tabindex", "0");

		// gallery wrapper
		this.galleryWrapper = document.createElement("div");
		this.galleryWrapper.className = "galleryWrapper draggable";
		this.galleryWrapper.setAttribute("tabindex", "0");
		this.galleryWrapper.appendChild(this.galleryData[0].previewImg || this.galleryData[0].originalImg);
		this.galleryWrapper.addEventListener("dblclick", this.toggleFullscreen.bind(this));
		this.galleryWrapper.addEventListener("dragstart", e => {
			e.preventDefault();
			return false;
		});

		// draggable
		this.imageMax = new Ph_DraggableWrapper();
		this.imageMax.classList.add("imageMax");
		this.appendChild(this.imageMax);
		this.imageMax.appendChild(this.galleryWrapper);

		// controls bar
		this.controls = new Ph_ControlsBar(this.galleryData.length > 1);
		this.controls.addShowHideListeners(this.galleryWrapper);
		this.imageMax.appendChild(this.controls);
		this.controls.className = "controls";
		if (this.galleryData.length > 1) {
			// prev img
			this.prevImageButton = this.controls.appendMakeImageButton("/img/playBack.svg");
			this.prevImageButton.setAttribute("data-tooltip", "Shortcut: Arrow Left");
			this.prevImageButton.addEventListener("click", this.previousImage.bind(this));
			// next img
			this.nextImageButton = this.controls.appendMakeImageButton("/img/playNext.svg");
			this.nextImageButton.setAttribute("data-tooltip", "Shortcut: Arrow Right");
			this.nextImageButton.addEventListener("click", this.nextImage.bind(this));
			// current image text
			this.imageIndexText = document.createElement("div");
			this.controls.appendChild(this.imageIndexText);
		}
		if (this.galleryData.length === 1) {
			if (!globalSettings.controlBarForImages)
				this.controls.classList.add("hide");
			window.addEventListener("settingsChanged", (e: CustomEvent) => {
				const changed = e.detail as PhotonSettings;
				if (changed.controlBarForImages === undefined)
					return;
				if (changed.controlBarForImages)
					this.controls.classList.remove("hide");
				else
					this.controls.classList.add("hide");
			});
		}
		// spacer
		this.controls.appendSpacer();
		// loading icon
		this.loadingIcon = document.createElement("img");
		this.loadingIcon.alt = "loading";
		this.loadingIcon.src = "/img/loading.svg";
		this.loadingIcon.draggable = false;
		this.loadingIcon.className = "loading";
		this.loadingIcon.hidden = true;
		this.controls.appendChild(this.loadingIcon);
		// caption
		this.caption = document.createElement("div");
		this.caption.className = "title";
		this.controls.appendChild(this.caption);
		// reset view
		const resetViewBtn = this.controls.appendMakeImageButton("/img/reset.svg", true);
		resetViewBtn.classList.add("resetView");
		resetViewBtn.setAttribute("data-tooltip", "Shortcut: R");
		resetViewBtn.addEventListener("click", () => {
			this.imageMax.setMoveXY(0, 0);
			this.imageMax.setZoom(1);
		});
		// fullscreen
		const fullscreenBtn = this.controls.appendMakeImageButton("/img/minimize.svg");
		fullscreenBtn.setAttribute("data-tooltip", "Shortcut: F");
		fullscreenBtn.addEventListener("click", this.toggleFullscreen.bind(this));
		this.addEventListener("fullscreenchange", e => document.fullscreenElement || this.onClose());

		this.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.code == "ArrowUp" || e.code == "ArrowRight" || e.code == "ArrowDown" || e.code == "ArrowLeft") {
				e.preventDefault();
			}
		});
		this.addEventListener("keyup", (e: KeyboardEvent) => {
			switch (e.code) {
				case "KeyF":
					this.toggleFullscreen();
					break;
				case "KeyR":
					this.imageMax.setMoveXY(0, 0);
					this.imageMax.setZoom(1);
					break;
				case "ArrowRight":
				case "ArrowDown":
					if (this.galleryData.length > 1) {
						this.nextImage();
					}
					break;
				case "ArrowLeft":
				case "ArrowUp":
					if (this.galleryData.length > 1) {
						this.previousImage();
					}
					break;
			}
		});

		const intersectionObserver = new IntersectionObserver((entries, obs) => {
			if (entries[0].intersectionRatio > .4) {
				this.focus({preventScroll: true});
			} else {
				this.blur();
			}
		}, {
			threshold: .4,
		});
		intersectionObserver.observe(this);

		this.updateTexts();
	}

	private onAlwaysLoadOriginals(changedSettings: PhotonSettings) {
		if (!changedSettings.imageLoadingPolicy)
			return;

		for (const [i, galleryImg] of this.galleryData.entries()) {
			if (galleryImg.originalImg)
				continue;
			if (!galleryImg.previewImg)
				throw "No preview image???";

			galleryImg.originalImg = document.createElement("img");
			galleryImg.originalImg.addEventListener("load", () => {
				galleryImg.previewImg.remove();
				galleryImg.previewImg = undefined;
			}, { once: true });
			galleryImg.originalImg.alt = galleryImg.originalSrc;
			galleryImg.originalImg.src = galleryImg.originalSrc;
			galleryImg.originalImg.draggable = false;

			if (this.currentImageIndex === i)
				this.galleryWrapper.appendChild(galleryImg.originalImg);
		}
	}

	updateTexts() {
		if (this.imageIndexText) {
			this.imageIndexText.innerText = `${this.currentImageIndex + 1} / ${this.galleryData.length}`;
		}
		this.caption.innerText = this.galleryData[this.currentImageIndex].caption;
		this.caption.setAttribute("data-tooltip", this.galleryData[this.currentImageIndex].caption);
		this.caption.title = this.galleryData[this.currentImageIndex].caption;
	}

	nextImage() {
		if (this.currentImageIndex + 1 === this.galleryData.length) {
			this.currentImageIndex = 0;
		} else {
			++this.currentImageIndex;
		}
		this.replaceCurrentImage();
		this.updateTexts();
	}

	previousImage() {
		if (this.currentImageIndex === 0) {
			this.currentImageIndex = this.galleryData.length - 1;
		} else {
			--this.currentImageIndex;
		}
		this.replaceCurrentImage();
		this.updateTexts();
	}

	isFullscreen(): boolean {
		return Boolean(document.fullscreenElement);
	}

	replaceCurrentImage() {
		for (let img of this.galleryWrapper.children) {
			img.remove();
		}

		if (this.isFullscreen() && this.galleryData[this.currentImageIndex].originalImg === null && globalSettings.imageLoadingPolicy !== ImageLoadingPolicy.alwaysPreview) {
			const origImg = document.createElement("img");
			origImg.draggable = false;
			origImg.alt = this.galleryData[this.currentImageIndex].originalSrc;
			origImg.src = this.galleryData[this.currentImageIndex].originalSrc;
			this.galleryData[this.currentImageIndex].originalImg = origImg;
			const currIndex = this.currentImageIndex;
			this.loadingIcon.hidden = false;
			origImg.addEventListener("load", () => {
				this.loadingIcon.hidden = true;
				this.galleryData[currIndex].previewImg.remove();
				this.galleryData[currIndex].previewImg = null;
			}, { once: true });
		}

		if (this.galleryData[this.currentImageIndex].previewImg) {
			this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].previewImg);
		}
		if (this.galleryData[this.currentImageIndex].originalImg) {
			this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].originalImg);
		}
	}

	toggleFullscreen() {
		if (this.isFullscreen()) {
			document.exitFullscreen();
		} else {
			this.onShow();
		}
	}

	async onShow() {
		this.classList.add("fullscreen");
		await this.requestFullscreen();
		if (this.galleryData[this.currentImageIndex].originalImg === null) {
			this.replaceCurrentImage();
		}
		this.galleryWrapper.focus();
		this.imageMax.activateWith(this.galleryWrapper);
	}

	onClose() {
		this.classList.remove("fullscreen");
		this.imageMax.deactivate();
		this.imageMax.setMoveXY(0, 0);
		this.imageMax.setZoom(1);
	}
}

customElements.define("ph-post-image", Ph_PostImage);
