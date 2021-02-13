import { globalSettings } from "../components/global/photonSettings/photonSettings.js";
import { Ph_ViewState } from "../components/viewState/viewState.js";
import { $tag } from "../utils/htmlStatics.js";
import { HistoryState } from "../utils/types.js";
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
	private static views: ViewsType = {};
	private static pos: number = null;
	private static attachmentPoint: HTMLElement = $tag("main")[0];
	private static isNextReplace: boolean;

	static pushAfter(state: Ph_ViewState): void {
		for (let i = ViewsStack.pos + 1; ViewsStack.views[i] !== undefined; ++i) {
			ViewsStack.views[i].remove();
		}

		ViewsStack.attachmentPoint.appendChild(state);
		
		if (ViewsStack.pos !== null)
			ViewsStack.views[ViewsStack.pos].classList.add("hide");
		else
			// if page has been reloaded or similar, retrieve the previous historyState
			ViewsStack.pos =  (history.state && history.state.index ? history.state.index - 1 : -1);
		++ViewsStack.pos;
		state.state.index = ViewsStack.pos;
		ViewsStack.views[ViewsStack.pos] = state;

		if (ViewsStack.isNextReplace) {
			if (globalSettings.isIncognitoEnabled)
				ViewsStack.incognitoReplace(state.state);
			else
				history.replaceState(state.state, state.state.title, state.state.url);
			ViewsStack.isNextReplace = false;
		}
		else {
			if (globalSettings.isIncognitoEnabled)
				ViewsStack.incognitoPush(state.state);
			else
				history.pushState(state.state, state.state.title, state.state.url);
		}

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: ViewsStack.views[ViewsStack.pos],
				newLoad: true,
			}
		}));
	}

	static pushBefore(state: Ph_ViewState) {
		if (ViewsStack.pos == null)
			throw "First cannot be inserted using insertBefore";
		if (ViewsStack.views[ViewsStack.pos - 1] !== undefined)
			throw "inserting before element! An element already exists at that position";

		ViewsStack.views[ViewsStack.pos].insertAdjacentElement("beforebegin", state);
		ViewsStack.views[ViewsStack.pos].classList.add("hide");
		--ViewsStack.pos;
		ViewsStack.views[ViewsStack.pos] = state;
	}

	static changeCurrentUrl(newUrl: string) {
		if (ViewsStack.pos === null || !ViewsStack.views[ViewsStack.pos])
			throw "Trying to update historyState, but there is currently no historyState";
			
		ViewsStack.views[ViewsStack.pos].state.url = newUrl;
		if (globalSettings.isIncognitoEnabled)
			ViewsStack.incognitoReplace(ViewsStack.views[ViewsStack.pos].state);
		else {
			history.replaceState(
				ViewsStack.views[ViewsStack.pos].state,
				ViewsStack.views[ViewsStack.pos].state.title,
				ViewsStack.views[ViewsStack.pos].state.url
			);
		}
	}

	static forward(isFromPopStateEvent = false) {
		if (ViewsStack.views[ViewsStack.pos + 1] == undefined) {			// probably a page reload,
			if (isFromPopStateEvent)							// need to create to html elements
				ViewsStack.setNextIsReplace();
			pushLinkToHistoryComb(history.state.url);
			return;
		}

		ViewsStack.views[ViewsStack.pos++].classList.add("hide");
		ViewsStack.views[ViewsStack.pos].classList.remove("hide");

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: ViewsStack.views[ViewsStack.pos],
				newLoad: false,
			}
		}));
	}

	static back() {
		if (ViewsStack.views[ViewsStack.pos - 1] == undefined) {						// probably a page reload,
			pushLinkToHistoryComb(history.state.url, PushType.PushBefore);	// need to create to html elements
			window.dispatchEvent(new CustomEvent("ph-view-change", {
				detail: <ViewChangeData> {
					viewState: ViewsStack.views[ViewsStack.pos],
					newLoad: true,
				}
			}));
			return;
		}

		ViewsStack.views[ViewsStack.pos--].classList.add("hide");
		ViewsStack.views[ViewsStack.pos].classList.remove("hide");

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: ViewsStack.views[ViewsStack.pos],
				newLoad: false,
			}
		}));
	}

	static setNextIsReplace() {
		ViewsStack.isNextReplace = true;
	}

	static setCurrentStateTitle(title: string) {
		document.title = globalSettings.isIncognitoEnabled ? `Photon: ${ViewsStack.randomUrl()}` : title;
		history.state.title = title;
	}

	static nextState(): Ph_ViewState {
		return ViewsStack.views[ViewsStack.pos + 1] || null;
	}

	static clear() {
		const viewIds: string[] = Object.keys(ViewsStack.views);
		for (let i of viewIds) {
			if (i === ViewsStack.pos.toString())
				continue;
			ViewsStack.views[i].remove();
			delete ViewsStack.views[i];
		}
	}

	static position(): number {
		return ViewsStack.pos;
	}

	static makeHistoryState(title: string, url: string, posOffset: number): HistoryState {
		return {
			index: (ViewsStack.pos ?? -1) + posOffset,
			title: title,
			url: url,
			optionalData: null
		};
	}

	static hasPreviousLoaded(): boolean {
		return ViewsStack.pos !== null && ViewsStack.views[ViewsStack.pos - 1] !== undefined;
	}

	private static incognitoPush(state) {
		history.pushState(state, `Photon; ${ViewsStack.randomUrl()}`, ViewsStack.randomUrl());
	}

	private static incognitoReplace(state) {
		history.replaceState(state, `Photon; ${ViewsStack.randomUrl()}`, ViewsStack.randomUrl());
	}

	private static readonly allChars = "abcdefghijklmnopqrstuvxyz";
	private static randomUrl(): string {
		let randomSub = ["/", "r", "/"]
		for (let i = 0; i < 10; i++) {
			randomSub.push(ViewsStack.allChars[Math.floor(Math.random() * ViewsStack.allChars.length)]);
		}
		return randomSub.join("");
	}
}
