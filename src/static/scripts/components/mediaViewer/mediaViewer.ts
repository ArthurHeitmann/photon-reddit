import { RedditApiType } from "../../types/misc.js";
import Ph_ControlsBar from "../misc/controlsBar/controlsBar.js";
import Ph_DraggableWrapper from "../post/postBody/draggableWrapper/draggableWrapper.js";
import Ph_ImageViewer from "./imageView/imageView.js";
import { MediaElement } from "./mediaElement.js";

export default class Ph_MediaViewer extends HTMLElement {
	controls: Ph_ControlsBar;
	draggableWrapper: Ph_DraggableWrapper;
	mediaElements: MediaElement[];
	currentIndex: number;
	isInFullscreenState: boolean = false;

	static fromPostData(postData: RedditApiType): Ph_MediaViewer {
		if (postData.data["post_hint"] == "image" || /(?<!#.*)\.(png|jpg|jpeg|svg)$/.test(postData.data["url"])) {
			return Ph_MediaViewer._fromPostData_Image(postData);
		}
	}

	private static _fromPostData_Image(postData: RedditApiType): Ph_MediaViewer {
		if (postData.data["preview"]) {
			const previews: any[] = postData.data["preview"]["images"][0]["resolutions"];
			return new Ph_MediaViewer([new Ph_ImageViewer({
				originalUrl: postData.data["url"],
				previewUrl: previews[previews.length - 1]["url"]
			})]);
		}
		else {
			return new Ph_MediaViewer([new Ph_ImageViewer({
				originalUrl: postData.data["url"],
			})]);
		}
	}

	constructor(initElements?: MediaElement[]) {
		super();

		this.classList.add("mediaViewer");

		this.draggableWrapper = new Ph_DraggableWrapper();
		this.appendChild(this.draggableWrapper);

		this.controls = new Ph_ControlsBar(true);
		this.controls.addShowHideListeners(this.draggableWrapper);
		this.appendChild(this.controls);

		if (initElements)
			this.init(initElements);
	}

	init(initElements: MediaElement[]) {
		this.mediaElements = initElements;
		this.displayElement(0);
		this.addEventListener("fullscreenchange", this.onFullscreenChange.bind(this));
		this.draggableWrapper.addEventListener("dblclick", this.toggleFullscreen.bind(this));
	}

	displayElement(i: number) {
		this.currentIndex = i;
		this.draggableWrapper.children[0]?.remove();
		this.draggableWrapper.appendChild(this.mediaElements[i].element);
	}

	toggleFullscreen() {
		if (document.fullscreenElement)
			document.exitFullscreen();
		else
			this.requestFullscreen();
	}

	onFullscreenChange() {
		if (document.fullscreenElement)
			this.onEnterFullscreen();
		else
			this.onExitFullscreen();
	}

	onEnterFullscreen() {
		this.isInFullscreenState = true;
		this.mediaElements[this.currentIndex].element.dispatchEvent(new Event("ph-entered-fullscreen"));
		this.draggableWrapper.activate();
	}

	onExitFullscreen() {
		this.isInFullscreenState = false;
		this.draggableWrapper.deactivate();
		this.draggableWrapper.setMoveXY(0, 0);
		this.draggableWrapper.setZoom(1);
	}
}

customElements.define("ph-media-viewer", Ph_MediaViewer);
