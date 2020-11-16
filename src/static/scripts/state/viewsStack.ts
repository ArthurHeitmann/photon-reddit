import { Ph_ViewState } from "../components/viewState/viewState.js";
import { $tag } from "../utils/htmlStuff.js";
import { HistoryState } from "../utils/types.js";
import { pushLinkToHistoryComb, PushType } from "./stateManager.js";

interface ViewsType {
	[index: number]: Ph_ViewState,
}

// TODO eventually fix the following (rare occurrence): when reloading the page and going back/forward multiple page
// at once (right click on the back/forwards arrows in the browser) all pages in between will not
// load properly and all be the same

export default class ViewsStack {
	private views: ViewsType = {};
	private pos: number = null;
	private attachmentPoint: HTMLElement = $tag("main")[0];
	private isNextReplace: boolean;
	
	pushAfter(state: Ph_ViewState): void {
		for (let i = this.pos + 1; this.views[i] !== undefined; ++i) {
			this.views[i].remove();
		}

		this.attachmentPoint.appendChild(state);
		
		if (this.pos !== null)
			this.views[this.pos].classList.add("hide");
		else
			// if page is reload or similar, retrieve the previous state
			this.pos =  (history.state && history.state.index ? history.state.index - 1 : -1);
		++this.pos;
		state.state.index = this.pos;
		this.views[this.pos] = state;

		window.dispatchEvent(new CustomEvent("urlChange", { detail: state.state.url }))
		if (this.isNextReplace) {
			history.replaceState(state.state, state.state.title, state.state.url);
			this.isNextReplace = false;
		}
		else
			history.pushState(state.state, state.state.title, state.state.url);

		window.dispatchEvent(new CustomEvent("viewChange", { detail: this.views[this.pos]  }));
	}

	pushBefore(state: Ph_ViewState) {
		if (this.pos == null)
			throw "First cannot be inserted using insertBefore";
		if (this.views[this.pos - 1] !== undefined)
			throw "inserting before element! An element already exists at that position";

		this.views[this.pos].insertAdjacentElement("beforebegin", state);
		this.views[this.pos].classList.add("hide");
		--this.pos;
		this.views[this.pos] = state;
	}

	changeCurrentUrl(newUrl: string) {
		if (this.pos === null || !this.views[this.pos])
			throw "Trying to update state, but there is currently no state";
			
		this.views[this.pos].state.url = newUrl;
		history.replaceState(
			this.views[this.pos].state, 
			this.views[this.pos].state.title, 
			this.views[this.pos].state.url
		);
		window.dispatchEvent(new CustomEvent("urlChange", { detail: newUrl }));
	}

	forward(isFromPopStateEvent = false) {
		if (this.views[this.pos + 1] == undefined) {			// probably a page reload,
			if (isFromPopStateEvent)							// need to create to html elements
				this.setNextIsReplace();
			pushLinkToHistoryComb(history.state.url);
			return;
		}

		this.views[this.pos++].classList.add("hide");
		this.views[this.pos].classList.remove("hide");

		window.dispatchEvent(new CustomEvent("viewChange", { detail: this.views[this.pos]  }));
	}

	back() {
		if (this.views[this.pos - 1] == undefined) {						// probably a page reload,
			pushLinkToHistoryComb(history.state.url, PushType.PushBefore);	// need to create to html elements
			window.dispatchEvent(new CustomEvent("viewChange", { detail: this.views[this.pos]  }));
			return;
		}

		this.views[this.pos--].classList.add("hide");
		this.views[this.pos].classList.remove("hide");

		window.dispatchEvent(new CustomEvent("viewChange", { detail: this.views[this.pos]  }));
	}

	setNextIsReplace() {
		this.isNextReplace = true;
	}

	setCurrentStateTitle(title: string) {
		document.title = title;
		history.state.title = title;
	}

	position(): number {
		return this.pos;
	}

	nextState(): Ph_ViewState {
		return this.views[this.pos + 1] || null;
	}

	makeHistoryState(title: string, url: string, posOffset: number): HistoryState {
		return {
			index: (this.pos ?? -1) + posOffset,
			title: title,
			url: url,
			optionalData: null
		};
	}

	hasPreviousLoaded(): boolean {
		return this.pos !== null && this.views[this.pos - 1] !== undefined;
	}

}
