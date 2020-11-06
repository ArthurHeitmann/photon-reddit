import { elementWithClassInTree } from "../../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../../utils/types";
import Ph_ControlsBar from "../../../misc/controlsBar/controlsBar.js";
import Ph_DraggableWrapper from "../draggableWrapper/draggableWrapper.js";

export default class Ph_PostImage extends HTMLElement {
	imageMax: Ph_DraggableWrapper;
	controls: Ph_ControlsBar;
	galleryWrapper: HTMLElement;
	prevImageButton: HTMLButtonElement;
	nextImageButton: HTMLButtonElement;
	imageIndexText: HTMLDivElement;
	caption: HTMLDivElement;
	loadingIcon: HTMLImageElement;
	galleryData: {
		caption: string,
		previewImg: HTMLImageElement,
		originalImg: HTMLImageElement,
		originalSrc: string,
	}[] = [];
	currentImageIndex: number = 0;
	beforeFsScrollTop = 0;

	constructor(postData: RedditApiType) {
		super();

		this.classList.add("postImage");
		this.setAttribute("tabindex", "0");

		// is gallery
		if (postData.data["gallery_data"]) {
			const items: {}[] = postData.data["gallery_data"]["items"];
			for (const item of items) {
				const imgData = postData.data["media_metadata"][item["media_id"]];
				const previews: {}[] = imgData["p"];
				const prevImg = document.createElement("img");
				prevImg.draggable = false;
				prevImg.src = previews[previews.length - 1]["u"];
				this.galleryData.push({
					caption: item["caption"] || postData.data["title"],
					previewImg: prevImg,
					originalImg: null,
					originalSrc: imgData["s"]["u"],
				});
			}
		}
		// normal image
		else {
			// reddit has generated a preview for us
			if (postData.data["preview"]) {
				const prevImg = document.createElement("img");
				const previews: any[] = postData.data["preview"]["images"][0]["resolutions"];
				prevImg.src = previews[previews.length - 1]["url"];
				prevImg.draggable = false
				this.galleryData = [{
					caption: postData.data["title"],
					previewImg: prevImg,
					originalImg: null,
					originalSrc: postData.data["url"],
				}];
			}
			// just a raw image url
			else {
				const prevImg = document.createElement("img");
				prevImg.src = postData.data["url"];
				prevImg.draggable = false;
				const origImg = document.createElement("img");
				origImg.src = postData.data["url"];
				origImg.draggable = false;
				this.galleryData = [{
					caption: postData.data["title"],
					previewImg: prevImg,
					originalImg: origImg,
					originalSrc: null,
				}];

			}
		}

		// gallery wrapper
		this.galleryWrapper = document.createElement("div")
		this.galleryWrapper.className = "galleryWrapper draggable";
		this.galleryWrapper.appendChild(this.galleryData[0].previewImg);
		this.galleryWrapper.addEventListener("dblclick", this.toggleFullscreen.bind(this));

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
			this.prevImageButton.addEventListener("click", this.previousImage.bind(this));
			this.prevImageButton.disabled = true;
			// next img
			this.nextImageButton = this.controls.appendMakeImageButton("/img/playNext.svg");
			this.nextImageButton.addEventListener("click", this.nextImage.bind(this));
			// current image text
			this.imageIndexText = document.createElement("div");
			this.controls.appendChild(this.imageIndexText);
		}
		// spacer
		this.controls.appendSpacer();
		// loading icon
		this.loadingIcon = document.createElement("img");
		this.loadingIcon.src = "/img/loading.svg";
		this.loadingIcon.draggable = false;
		this.loadingIcon.className = "loading";
		this.loadingIcon.hidden = true;
		this.controls.appendChild(this.loadingIcon);
		// caption			TODO add tooltip for overflows
		this.caption = document.createElement("div");
		this.caption.className = "title";
		this.controls.appendChild(this.caption);
		// reset view
		const resetViewBtn = this.controls.appendMakeImageButton("/img/reset.svg", true);
		resetViewBtn.classList.add("resetView");
		resetViewBtn.addEventListener("click", () => {
			this.imageMax.setMoveXY(0, 0);
			this.imageMax.setZoom(1);
		})
		// fullscreen
		const fullscreenBtn = this.controls.appendMakeImageButton("/img/minimize.svg");
		fullscreenBtn.addEventListener("click", this.toggleFullscreen.bind(this));
		this.addEventListener("fullscreenchange", e => document.fullscreenElement || this.onClose());

		this.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.code == "ArrowUp" || e.code == "ArrowRight" || e.code == "ArrowDown" || e.code == "ArrowLeft")
				e.preventDefault();
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
					if (this.galleryData.length > 1)
						this.nextImage();
					break;
				case "ArrowLeft":
				case "ArrowUp":
					if (this.galleryData.length > 1)
						this.previousImage();
					break;
			}
		});

		const intersectionObserver = new IntersectionObserver((entries, obs) => {
			if (entries[0].intersectionRatio > .4) {
				this.focus({ preventScroll: true });
			}
			else {
				this.blur();
			}
		}, {
			threshold: .4,
		});
		intersectionObserver.observe(this);

		this.updateTexts();
	}

	updateTexts() {
		if (this.imageIndexText)
			this.imageIndexText.innerText = `${this.currentImageIndex + 1} / ${this.galleryData.length}`;
		this.caption.innerText = this.galleryData[this.currentImageIndex].caption;
		this.caption.title = this.galleryData[this.currentImageIndex].caption;
	}

	nextImage() {
		if (this.currentImageIndex === 0)
			this.prevImageButton.disabled = false;
		else if (this.currentImageIndex + 1 === this.galleryData.length)
			return;
		++this.currentImageIndex;
		if (this.currentImageIndex + 1 === this.galleryData.length)
			this.nextImageButton.disabled = true;
		this.replaceCurrentImage();
		this.updateTexts();
	}

	previousImage() {
		if (this.currentImageIndex + 1 === this.galleryData.length)
			this.nextImageButton.disabled = false;
		else if (this.currentImageIndex === 0)
			return;
		--this.currentImageIndex;
		if (this.currentImageIndex === 0)
			this.prevImageButton.disabled = true;
		this.replaceCurrentImage();
		this.updateTexts();
	}

	isFullscreen(): boolean {
		return Boolean(document.fullscreenElement);
	}

	replaceCurrentImage() {
		for (let img of this.galleryWrapper.children)
			img.remove();

		if (this.isFullscreen() && this.galleryData[this.currentImageIndex].originalImg === null) {
			const origImg = document.createElement("img");
			origImg.draggable = false;
			origImg.src = this.galleryData[this.currentImageIndex].originalSrc;
			this.galleryData[this.currentImageIndex].originalImg = origImg;
			const currIndex = this.currentImageIndex;
			this.loadingIcon.hidden = false;
			origImg.addEventListener("load", () => {
				this.loadingIcon.hidden = true;
				this.galleryData[currIndex].previewImg.remove();
				this.galleryData[currIndex].previewImg = null
			});
		}

		if (this.galleryData[this.currentImageIndex].previewImg)
			this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].previewImg);
		if (this.galleryData[this.currentImageIndex].originalImg)
			this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].originalImg);
	}

	toggleFullscreen() {
		if (this.isFullscreen())
			document.exitFullscreen();
		else
			this.onShow();
	}

	async onShow() {
		const viewState = elementWithClassInTree(this.parentElement, "viewState");
		if (viewState)
			this.beforeFsScrollTop = viewState.scrollTop;

		this.classList.add("fullscreen");
		await this.requestFullscreen();
		if (this.galleryData[this.currentImageIndex].originalImg === null)
			this.replaceCurrentImage();
		this.focus();
		this.imageMax.activateWith(this.galleryWrapper);
	}

	onClose() {
		this.classList.remove("fullscreen");
		this.imageMax.deactivate();
		this.imageMax.setMoveXY(0, 0);
		this.imageMax.setZoom(1);

		if (this.beforeFsScrollTop) {
			setTimeout(() => elementWithClassInTree(this.parentElement, "viewState").scrollTop = this.beforeFsScrollTop, 0);
		}
	}
}

customElements.define("ph-post-image", Ph_PostImage);
