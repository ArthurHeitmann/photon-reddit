import { $tag } from "../../utils/htmlStatics.js";
import { HistoryState } from "../../types/misc.js";
import Ph_Header from "../global/header/header.js";

/**
 * A page that is associated with a history state/url.
 * Will be displayed when viewing that history state.
 * When leaving this page, it will be hidden, not removed or unloaded.
 */
export abstract class Ph_ViewState extends HTMLElement {
	state: HistoryState;
	headerElements: HTMLElement[] = [];
	header: Ph_Header;

	protected constructor(state: HistoryState) {
		super();

		this.className = "viewState";

		this.state = state;
		this.header = $tag("ph-header")[0] as Ph_Header;
	}

	setHeaderElements(elements: HTMLElement[]) {
		this.headerElements = elements;
		this.header.setFeedElements(this.headerElements);
	}

	abstract finishWith(result: any);
	abstract error();
}
