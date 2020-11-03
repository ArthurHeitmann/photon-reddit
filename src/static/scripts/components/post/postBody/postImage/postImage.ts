import { $tag } from "../../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../../utils/types";
import Ph_DraggableWrapper from "../draggableWrapper/draggableWrapper.js";

export default class Ph_PostImage extends HTMLElement {
	imagePreview: HTMLImageElement;
	imageMax: Ph_DraggableWrapper;
	bigImage: HTMLImageElement;
	controls: HTMLElement;
	sourceImageUrl: string;
	isInitialized = false;
	removeSelfTimout = null;

	constructor(postData: RedditApiType) {
		super();

		this.classList.add("w100");
		this.setAttribute("tabindex", "0");

		// preview image
		this.imagePreview = document.createElement("img");
		this.appendChild(this.imagePreview);
		this.imagePreview.className = "postImage";
		this.imagePreview.alt = postData.data["title"];
		const previews: any[] = postData.data["preview"]["images"][0]["resolutions"];
		this.imagePreview.src = previews[previews.length - 1]["url"];

		this.imagePreview.onclick = e => this.onShow(e);
		
		// max container
		this.sourceImageUrl = postData.data["url"];
		this.imageMax = new Ph_DraggableWrapper();
		this.imageMax.classList.add("imageMax")
		this.imageMax.classList.add("hide")
		this.appendChild(this.imageMax);
		// controls bar
		this.controls = document.createElement("div");
		this.imageMax.appendChild(this.controls);
		this.controls.className = "controls";
		this.controls.insertAdjacentHTML("beforeend", `<div class="accessibilitySpacer dragThrough"></div>`);
		const title = document.createElement("div");
		title.innerText = postData.data["title"];
		title.className = "title";
		this.controls.appendChild(title);
		const resetViewBtn = document.createElement("button");
		resetViewBtn.innerHTML = `<img src="/img/reset.svg" alt="minimize" draggable="false" class="padded">`;
		resetViewBtn.addEventListener("click", () => {
			this.imageMax.setMoveXY(0, 0);
			this.imageMax.setZoom(1);
		})
		this.controls.appendChild(resetViewBtn);
		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = `<img src="/img/minimize.svg" alt="minimize" draggable="false">`;
		closeBtn.addEventListener("click", this.onClose.bind(this));
		this.controls.appendChild(closeBtn);
		const downloadBtn = document.createElement("button");


		// acutal max image
		this.bigImage = document.createElement("img");
		this.imageMax.appendChild(this.bigImage);
		this.imageMax.activateWith(this.bigImage);
		this.bigImage.className = "bigImage draggable";
		this.bigImage.draggable = false;

		this.addEventListener("keyup", (e: KeyboardEvent) => {
			if (e.key === "Escape")
				this.onClose(e);
		});
	}

	onShow(e) {
		this.imageMax.classList.remove("hide");
		this.focus();
		if (!this.isInitialized)
			this.makePreview();
		this.imageMax.setMoveXY(0, 0);
		this.imageMax.setZoom(1);

		if (this.removeSelfTimout !== null) {
			clearTimeout(this.removeSelfTimout);
			this.removeSelfTimout = null;
		}
	}

	makePreview() {
		this.isInitialized = true;
		this.bigImage.src = this.sourceImageUrl;

		// preview image to show while possible waiting for big image to load
		const intermediateImage = document.createElement("img");
		intermediateImage.className = "draggable";
		this.bigImage.insertAdjacentElement("beforebegin", intermediateImage);
		intermediateImage.src = this.imagePreview.src;
		intermediateImage.draggable = false;

		if (!this.bigImage.complete) {
			$tag("header")[0].classList.add("contentIsLoading");
			this.bigImage.onload = e => {
				intermediateImage.remove();
				$tag("header")[0].classList.remove("contentIsLoading");
			};
		}
		else
			intermediateImage.remove();
	}
	
	onClose(e) {
		this.imageMax.classList.add("hide");
		this.removeSelfTimout = setTimeout(() => {
			while (this.imageMax.childElementCount)
				this.imageMax.lastChild.remove();
		}, 1000 * 60 * 5);
	}
}

customElements.define("ph-post-image", Ph_PostImage);
