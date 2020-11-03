import { $tag } from "../../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../../utils/types";
import Ph_ControlsBar from "../../../misc/controlsBar/controlsBar.js";
import Ph_DraggableWrapper from "../draggableWrapper/draggableWrapper.js";

export default class Ph_PostImage extends HTMLElement {
	imageMax: Ph_DraggableWrapper;
	controls: Ph_ControlsBar;
	galleryWrapper: HTMLElement;
	prevImageButton: HTMLButtonElement;
	nextImageButton: HTMLButtonElement;
	removeSelfTimout = null;
	galleryData: {
		previewImg: HTMLImageElement,
		originalImg: HTMLImageElement,
		originalSrc: string
	}[] = [];
	currentImageIndex: number = 0;

	constructor(postData: RedditApiType) {
		super();

		this.classList.add("postImage");
		this.setAttribute("tabindex", "0");

		// is gallery
		if (postData.data["gallery_data"]) {
			const ids: string[] = postData.data["gallery_data"]["items"].map(item => item.media_id);
			for (const id of ids) {
				const imgData = postData.data["media_metadata"][id];
				const previews: {}[] = imgData["p"];
				const prevImg = document.createElement("img");
				prevImg.draggable = false;
				prevImg.src = previews[previews.length - 1]["u"];
				this.galleryData.push({
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
					previewImg: prevImg,
					originalImg: null,
					originalSrc: prevImg.src,
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
		}
		// spacer
		this.controls.appendSpacer();
		// title			TODO add tooltip for overflows
		const title = document.createElement("div");
		title.innerText = postData.data["title"];
		title.className = "title";
		this.controls.appendChild(title);
		// reset view
		const resetViewBtn = this.controls.appendMakeImageButton("/img/reset.svg", true);
		resetViewBtn.addEventListener("click", () => {
			this.imageMax.setMoveXY(0, 0);
			this.imageMax.setZoom(1);
		})
		// fullscreen
		const fullscreenBtn = this.controls.appendMakeImageButton("/img/minimize.svg");
		fullscreenBtn.addEventListener("click", this.toggleFullscreen.bind(this));

		this.addEventListener("keyup", (e: KeyboardEvent) => {
			switch (e.code) {
				case "Escape":
					this.onClose(e);
					break;
				case "KeyR":
					this.imageMax.setMoveXY(0, 0);
					this.imageMax.setZoom(1);
					break;
				case "ArrowRight:":
				case "ArrowDown:":
					this.nextImage();
					break;
				case "ArrowLeft:":
				case "ArrowUp:":
					this.previousImage();
					break;
			}
		});
	}

	nextImage() {
		if (this.currentImageIndex === 0)
			this.prevImageButton.disabled = false;
		else if (this.currentImageIndex + 1 === this.galleryData.length)
			return;
		++this.currentImageIndex;
		if (this.currentImageIndex + 1 === this.galleryData.length)
			this.nextImageButton.disabled = true;
		for (let img of this.galleryWrapper.children)
			img.remove()
		this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].previewImg);
	}

	previousImage() {
		if (this.currentImageIndex + 1 === this.galleryData.length)
			this.nextImageButton.disabled = false;
		else if (this.currentImageIndex === 0)
			return;
		--this.currentImageIndex;
		if (this.currentImageIndex === 0)
			this.prevImageButton.disabled = true;
		for (let img of this.galleryWrapper.children)
			img.remove()
		this.galleryWrapper.appendChild(this.galleryData[this.currentImageIndex].previewImg);
	}

	toggleFullscreen(e) {
		if (this.classList.contains("fullscreen"))
			this.onClose(e);
		else
			this.onShow(e);
	}

	onShow(e) {
		this.classList.add("fullscreen");
		this.focus();
		this.imageMax.activateWith(this.galleryWrapper);

		if (this.removeSelfTimout !== null) {
			clearTimeout(this.removeSelfTimout);
			this.removeSelfTimout = null;
		}
	}

	onClose(e) {
		this.classList.remove("fullscreen");
		this.imageMax.deactivate();
		this.imageMax.setMoveXY(0, 0);
		this.imageMax.setZoom(1);
		this.removeSelfTimout = setTimeout(() => {
			while (this.imageMax.childElementCount)
				this.imageMax.lastChild.remove();
		}, 1000 * 60 * 5);
	}
}

customElements.define("ph-post-image", Ph_PostImage);
