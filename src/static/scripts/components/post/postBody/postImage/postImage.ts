import { RedditApiType } from "../../../../utils/types";

export default class Ph_PostImage extends HTMLElement {
	imagePreview: HTMLImageElement;
	imageMax: HTMLDivElement;
	sourceImageUrl: string;
	isInitialized = false;

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

		this.imagePreview.addEventListener("click", e => this.onShow(e));
		
		// max container
		this.sourceImageUrl = postData.data["url"];
		this.imageMax = document.createElement("div");
		this.appendChild(this.imageMax);
		this.imageMax.className = "imageMax hide";

		// acutal max image
		const bigImage = document.createElement("div");
		this.imageMax.appendChild(bigImage);
		bigImage.className = "bigImage";

		// close button
		const closeButton = document.createElement("button");
		this.imageMax.appendChild(closeButton);
		closeButton.className = "closeButton";

		closeButton.addEventListener("click", e => this.onClose(e));
	}

	onShow(e) {
		this.imageMax.classList.remove("hide");
		if (!this.isInitialized)
			this.makePreview();
	}

	makePreview() {
		this.isInitialized = true;
		this.imageMax.setAttribute("style", `--max-img: url(${this.sourceImageUrl})`);
	}
	
	onClose(e) {
		this.imageMax.classList.add("hide");

	}
}

customElements.define("ph-post-image", Ph_PostImage);
