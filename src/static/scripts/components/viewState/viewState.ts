import { $tag } from "../../utils/htmlStatics.js";
import { HistoryState } from "../../utils/types";
import Ph_Header from "../global/header/header.js";

export class Ph_ViewState extends HTMLElement {
	state: HistoryState;
	contentElement: HTMLElement;
	headerElements: HTMLElement[] = [];
	header: Ph_Header;

	constructor(state: HistoryState) {
		super();

		this.className = "viewState overflow-y-auto";

		this.state = state;
		this.header = $tag("ph-header")[0] as Ph_Header;

		this.contentElement = document.createElement("div");
		this.contentElement.className =  "contentElement"
		this.contentElement.innerText = "loading...";
		this.appendChild(this.contentElement);
	}

	setHeaderElements(elements: HTMLElement[]) {
		this.headerElements = elements;
		this.header.setFeedElements(this.headerElements);
	}
}

customElements.define("ph-view-state", Ph_ViewState);
