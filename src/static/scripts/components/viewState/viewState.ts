import { PhEvents } from "../../types/Events";
import { HistoryState } from "../../types/misc";
import { $tag } from "../../utils/htmlStatics";
import { elementWithClassInTree } from "../../utils/htmlStuff";
import { hasParams } from "../../utils/utils";
import Ph_Header from "../global/header/header";
import Ph_PhotonBaseElement from "../photon/photonBaseElement/photonBaseElement";

/**
 * A page that is associated with a history state/url.
 * Will be displayed when viewing that history state.
 * When leaving this page, it will be hidden, not removed or unloaded.
 */
export abstract class Ph_ViewState extends Ph_PhotonBaseElement {
	state: HistoryState;
	headerElements: HTMLElement[] = [];
	header: Ph_Header;
	scrollSave: ScrollSave;

	protected constructor(state: HistoryState) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "viewState";

		this.state = state;
		this.header = $tag("ph-header")[0] as Ph_Header;

		this.addEventListener(PhEvents.removed, this.onRemoved.bind(this));
	}

	setHeaderElements(elements: HTMLElement[]) {
		this.headerElements = elements;
		this.header.setFeedElements(this.headerElements);
	}

	abstract finishWith(result: any);
	abstract error();

	onRemoved() {
		const cleanupElements = this.$css("[requiresCleanup]") as HTMLCollectionOf<Ph_PhotonBaseElement>;
		for (const elem of cleanupElements)
			elem.cleanup();
	}

	saveScroll(elem?: HTMLElement, edge: ElementEdge = "top") {
		let scrollVal: number;
		if (elem)
			scrollVal = elem.getBoundingClientRect()[edge];
		else
			scrollVal = document.scrollingElement.scrollTop;
		this.scrollSave = {
			scrollVal: scrollVal,
			referenceElement: elem,
			edge: edge
		}
	}

	loadScroll(_secondCall = false) {
		if (!this.scrollSave)
			return;
		let newScrollTop: number;
		let scrollYDiff: number;
		if (this.scrollSave.referenceElement) {
			if (!this.scrollSave.referenceElement.isConnected)
				return;
			newScrollTop = this.scrollSave.referenceElement
				.getBoundingClientRect()[this.scrollSave.edge];
			scrollYDiff = newScrollTop - this.scrollSave.scrollVal;
		} else {
			newScrollTop = document.scrollingElement.scrollTop;
			scrollYDiff = this.scrollSave.scrollVal - newScrollTop;
		}
		document.scrollingElement.scrollBy({ top: scrollYDiff });
		if (!_secondCall)
			setTimeout(() => this.loadScroll(true), 0);		// sometimes the browser goes back to scroll Y 0 immediately
	}

	static getViewOf(elem: HTMLElement): Ph_ViewState {
		return elementWithClassInTree(elem, "viewState") as Ph_ViewState;
	}
}

interface ScrollSave {
	scrollVal: number,
	referenceElement?: HTMLElement
	edge?: ElementEdge;
}

type ElementEdge = "top" | "right" | "bottom" | "left";
