import { Ph_ViewState } from "../components/viewState/viewState.js";
import { $tag } from "../utils/htmlStuff.js";
import { HistoryState } from "../utils/types.js";
import { pushLinkToHistoryComb, PushType } from "./stateManager.js";

interface ViewsType {
	[index: number]: Ph_ViewState,
}

export default class ViewsStack {
	private views: ViewsType = {};
	private pos: number = null;
	private attachmentPoint: HTMLElement = $tag("main")[0];

	pushAfter(state: Ph_ViewState, isInitialPush = false): void {
		for (let i = this.pos + 1; this.views[i] !== undefined; ++i) {
			this.views[i].remove();
		}

		this.attachmentPoint.appendChild(state);
		
		if (this.pos !== null)
			this.views[this.pos].classList.add("hide");
		else
			this.pos = -1;
		++this.pos;
		this.views[this.pos] = state;

		// document.title = state.state.title;
		if (isInitialPush)
			history.replaceState(state.state, state.state.title, state.state.url);
		else
			history.pushState(state.state, state.state.title, state.state.url);
	}

	pushBefore(state: Ph_ViewState) {
		if (this.pos == null)
			throw new Error("First cannot be inserted using insertBefore");
		if (this.views[this.pos - 1] !== undefined)
			throw new Error("inserting before element! An element already exists at that position");

		this.views[this.pos].insertAdjacentElement("beforebegin", state);
		this.views[this.pos].classList.add("hide");
		--this.pos;
		this.views[this.pos] = state;
	}

	forward() {
		if (this.views[this.pos + 1] == undefined) {			// probably a page reload,
			pushLinkToHistoryComb(history.state.url);			// need to create to html elements
			return;
		}

		this.views[this.pos++].classList.add("hide");
		this.views[this.pos].classList.remove("hide");
	}

	back() {
		if (this.views[this.pos - 1] == undefined) {			// probably a page reload,
			pushLinkToHistoryComb(history.state.url, PushType.PushBefore);		// need to create to html elements
			return;
		}

		this.views[this.pos--].classList.add("hide");
		this.views[this.pos].classList.remove("hide");
	}

	setCurrentStateTitle(title: string) {
		document.title = title;
		history.state.title = title;
	}

	position(): number {
		return this.pos;
	}

	makeHistoryState(title: string, url: string, posOffset: number): HistoryState {
		return {
			index: (this.pos ?? -1) + posOffset,
			title: title,
			url: url,
		};
	}

}