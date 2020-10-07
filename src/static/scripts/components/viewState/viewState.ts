import { HistoryState } from "../../utils/types";

export class Ph_ViewState extends HTMLElement {
	state: HistoryState;
	contentElement: HTMLElement;

	constructor(state: HistoryState) {
		super();

		this.className = "viewState";

		this.state = state;

		this.contentElement = document.createElement("div");
		this.contentElement.className =  "contentElement"
		this.contentElement.innerText = "loading...";
		this.appendChild(this.contentElement);
	}
}

customElements.define("ph-view-state", Ph_ViewState);
