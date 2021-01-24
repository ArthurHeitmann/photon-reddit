import { globalSettings } from "../components/global/photonSettings/photonSettings.js";
import { Ph_ViewState } from "../components/viewState/viewState.js";
import { $tag } from "../utils/htmlStatics.js";
import { HistoryState } from "../utils/types.js";
import { deepClone } from "../utils/utils.js";
import { pushLinkToHistoryComb, PushType } from "./historyStateManager.js";

interface ViewsType {
	[index: number]: Ph_ViewState,
}

export interface ViewChangeData {
	viewState: Ph_ViewState,
	newLoad: boolean
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
			// if page has been reloaded or similar, retrieve the previous historyState
			this.pos =  (history.state && history.state.index ? history.state.index - 1 : -1);
		++this.pos;
		state.state.index = this.pos;
		this.views[this.pos] = state;

		if (this.isNextReplace) {
			if (globalSettings.isIncognitoEnabled)
				this.incognitoReplace(state.state);
			else
				history.replaceState(state.state, state.state.title, state.state.url);
			this.isNextReplace = false;
		}
		else {
			if (globalSettings.isIncognitoEnabled)
				this.incognitoPush(state.state);
			else
				history.pushState(state.state, state.state.title, state.state.url);
		}

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: this.views[this.pos],
				newLoad: true,
			}
		}));
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
			throw "Trying to update historyState, but there is currently no historyState";
			
		this.views[this.pos].state.url = newUrl;
		if (globalSettings.isIncognitoEnabled)
			this.incognitoReplace(this.views[this.pos].state);
		else {
			history.replaceState(
				this.views[this.pos].state,
				this.views[this.pos].state.title,
				this.views[this.pos].state.url
			);
		}
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

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: this.views[this.pos],
				newLoad: false,
			}
		}));
	}

	back() {
		if (this.views[this.pos - 1] == undefined) {						// probably a page reload,
			pushLinkToHistoryComb(history.state.url, PushType.PushBefore);	// need to create to html elements
			window.dispatchEvent(new CustomEvent("ph-view-change", {
				detail: <ViewChangeData> {
					viewState: this.views[this.pos],
					newLoad: true,
				}
			}));
			return;
		}

		this.views[this.pos--].classList.add("hide");
		this.views[this.pos].classList.remove("hide");

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: this.views[this.pos],
				newLoad: false,
			}
		}));
	}

	setNextIsReplace() {
		this.isNextReplace = true;
	}

	setCurrentStateTitle(title: string) {
		document.title = globalSettings.isIncognitoEnabled ? `Photon: ${this.randomUrl()}` : title;
		history.state.title = title;
	}

	nextState(): Ph_ViewState {
		return this.views[this.pos + 1] || null;
	}

	clear() {
		const viewIds: string[] = Object.keys(this.views);
		for (let i of viewIds) {
			if (i === this.pos.toString())
				continue;
			this.views[i].remove();
			delete this.views[i];
		}
	}

	position(): number {
		return this.pos;
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

	private incognitoPush(state) {
		history.pushState(state, `Photon; ${this.randomUrl()}`, this.randomUrl());
	}

	private incognitoReplace(state) {
		history.replaceState(state, `Photon; ${this.randomUrl()}`, this.randomUrl());
	}

	private readonly allChars = "abcdefghijklmnopqrstuvxyz";
	private randomUrl(): string {
		let randomSub = ["/", "r", "/"]
		for (let i = 0; i < 10; i++) {
			randomSub.push(this.allChars[Math.floor(Math.random() * this.allChars.length)]);
		}
		return randomSub.join("");
	}
}
