import { RedditApiType } from "../../types/misc.js";
import Ph_ControlsBar from "../misc/controlsBar/controlsBar.js";
import Ph_DraggableWrapper from "../post/postBody/draggableWrapper/draggableWrapper.js";
import Ph_ImageViewer from "./imageView/imageView.js";
import { MediaElement } from "./mediaElement.js";

export default class Ph_MediaViewer extends HTMLElement {
	controls: Ph_ControlsBar;
	draggableWrapper: Ph_DraggableWrapper;
	mediaElements: MediaElement[];

	static fromPostData(postData: RedditApiType): Ph_MediaViewer {
		if (postData.data["post_hint"] == "image" || /(?<!#.*)\.(png|jpg|jpeg|svg)$/.test(postData.data["url"])) {
			return new Ph_MediaViewer([new Ph_ImageViewer({
				originalUrl: postData.data["url"],
			})])
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
	}

	displayElement(i: number) {
		this.draggableWrapper.children[0]?.remove();
		this.draggableWrapper.appendChild(this.mediaElements[i].element);
	}
}

customElements.define("ph-media-viewer", Ph_MediaViewer);
