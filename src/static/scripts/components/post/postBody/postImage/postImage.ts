import { $tag } from "../../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../../utils/types";

export default class Ph_PostImage extends HTMLElement {
	imagePreview: HTMLImageElement;
	imageMax: HTMLDivElement;
	bigImage: HTMLImageElement;
	sourceImageUrl: string;
	isInitialized = false;
	prevX = 0;
	prevY = 0;
	moveX = 0;
	moveY = 0;
	scale = 1;
	removeSelfTimout = null;

	constructor(postData: RedditApiType) {
		super();

		this.className = "w100";

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
		this.imageMax = document.createElement("div");
		this.appendChild(this.imageMax);
		this.imageMax.className = "imageMax hide";
		this.imageMax.addEventListener("mousedown", e => this.beginDrag(e));
		this.imageMax.addEventListener("mouseup", e => this.endDrag(e));
		this.imageMax.addEventListener("mouseleave", e => this.endDrag(e));
		this.imageMax.addEventListener("wheel", e => this.onZoom(e), { passive: true });

		// acutal max image
		this.bigImage = document.createElement("img");
		this.imageMax.appendChild(this.bigImage);
		this.bigImage.className = "bigImage";
		this.bigImage.draggable = false;

		// close button
		const closeButton = document.createElement("button");
		this.imageMax.appendChild(closeButton);
		closeButton.className = "closeButton";

		closeButton.onclick = e => this.onClose(e);
	}

	onShow(e) {
		this.imageMax.classList.remove("hide");
		if (!this.isInitialized)
			this.makePreview();
		this.setMoveXY(0, 0);
		this.setZoom(1);

		if (this.removeSelfTimout !== null) {
			clearTimeout(this.removeSelfTimout);
			this.removeSelfTimout = null;
		}
	}

	beginDrag(e: MouseEvent) {
		this.imageMax.onmousemove = e => this.moveImage(e);
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	endDrag(e: MouseEvent) {
		this.imageMax.onmousemove = null;
	}

	moveImage(e: MouseEvent) {
		this.addMoveXY(e.screenX - this.prevX, e.screenY - this.prevY)
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	onZoom(e: WheelEvent) {
		this.addZoom(e.deltaY / -1000);
	}

	makePreview() {
		this.isInitialized = true;
		this.bigImage.src = this.sourceImageUrl;

		// preview image to show while possible waiting for big image to load
		const intermediateImage = document.createElement("img");
		this.imageMax.appendChild(intermediateImage);
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

	setZoom(val: number) {
		this.scale = val;
		this.imageMax.style.setProperty("--img-zoom", this.scale.toString());
	}

	addZoom(val: number) {
		this.scale += val * this.scale;
		this.scale = Math.max(1, this.scale);
		this.imageMax.style.setProperty("--img-zoom", this.scale.toString());
	}

	setMoveXY(x: number, y: number) {
		this.moveX = x;
		this.moveY = y;
		this.imageMax.style.setProperty("--img-move-x", `${this.moveX}px`);
		this.imageMax.style.setProperty("--img-move-y", `${this.moveY}px`);
	}

	addMoveXY(x: number, y: number) {
		this.moveX += x / this.scale;
		this.moveY += y / this.scale;
		this.imageMax.style.setProperty("--img-move-x", `${this.moveX}px`);
		this.imageMax.style.setProperty("--img-move-y", `${this.moveY}px`);
	}
}

customElements.define("ph-post-image", Ph_PostImage);
