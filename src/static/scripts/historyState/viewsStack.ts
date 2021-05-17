/**
 * Used for interacting with the history
 *  - going back & forward
 *  - added & removing elements from the history
 */

import { globalSettings } from "../components/global/photonSettings/photonSettings.js";
import { Ph_ViewState } from "../components/viewState/viewState.js";
import { HistoryState } from "../types/misc.js";
import { $tag } from "../utils/htmlStatics.js";
import { pushLinkToHistoryComb, PushType } from "./historyStateManager.js";

interface ViewType {
	/** index will technically be stored as a string, but that shouldn't affect anything */
	[index: number]: Ph_ViewState,
}

export interface ViewChangeData {
	viewState: Ph_ViewState,
	newLoad: boolean
}

// TODO eventually fix the following (rare occurrence): when reloading the page and going back/forward multiple pages
// at once (right click on the back/forwards arrows in the browser) all pages in between will not
// load properly and all be the same

export default class ViewsStack {
	/** all loaded views */
	private static views: ViewType = {};
	/** current index in views */
	private static pos: number = null;
	/** to this element view elements will be appended */
	static attachmentPoint: HTMLElement = $tag("main")[0];
	/** if true: the next pushAfter will replace the current history state */
	private static isNextReplace: boolean;

	/** Pushes a history state after the current one & appends view state to DOM */
	static pushAfter(state: Ph_ViewState): void {
		// if there are history states after the current one they will be cut off & removed, therefore remove the views
		for (let i = ViewsStack.pos + 1; ViewsStack.views[i] !== undefined; ++i) {
			ViewsStack.views[i].remove();
			delete ViewsStack.views[i];
		}

		if (ViewsStack.pos !== null) {
			ViewsStack.views[ViewsStack.pos].saveScroll();
			ViewsStack.views[ViewsStack.pos].classList.add("hide");
		}
		else
			// if page has been reloaded or similar, retrieve the previous historyState
			ViewsStack.pos = (history.state && history.state.index ? history.state.index - 1 : -1);

		ViewsStack.attachmentPoint.appendChild(state);
		state.classList.remove("hide");
		state.loadScroll();

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

	/** Pushes a history state before the current one & appends view state to DOM */
	static pushBefore(state: Ph_ViewState) {
		if (ViewsStack.pos == null)
			throw "First cannot be inserted using insertBefore";
		if (ViewsStack.views[ViewsStack.pos - 1] !== undefined)
			throw "inserting before element! An element already exists at that position";

		ViewsStack.views[ViewsStack.pos].insertAdjacentElement("beforebegin", state);
		ViewsStack.views[ViewsStack.pos].saveScroll();
		ViewsStack.views[ViewsStack.pos].classList.add("hide");
		--ViewsStack.pos;
		ViewsStack.views[ViewsStack.pos] = state;
	}

	/** Replaces the currently displayed url in the browser */
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

	/** go to next view state; load it if not loaded */
	static forward(isFromPopStateEvent = false) {
		if (ViewsStack.views[ViewsStack.pos + 1] == undefined) {	// probably a page reload,
			if (isFromPopStateEvent)								// need to create html elements
				ViewsStack.setNextIsReplace();
			pushLinkToHistoryComb(history.state.url);
			return;
		}

		ViewsStack.views[ViewsStack.pos].saveScroll();
		ViewsStack.views[ViewsStack.pos++].classList.add("hide");
		ViewsStack.views[ViewsStack.pos].classList.remove("hide");
		ViewsStack.views[ViewsStack.pos].loadScroll();

		window.dispatchEvent(new CustomEvent("ph-view-change", {
			detail: <ViewChangeData> {
				viewState: ViewsStack.views[ViewsStack.pos],
				newLoad: false,
			}
		}));
	}

	/** go to previous view state; load it if not loaded */
	static back() {
		if (ViewsStack.views[ViewsStack.pos - 1] == undefined) {						// probably a page reload,
			pushLinkToHistoryComb(history.state.url, PushType.pushBefore);				// need to create html elements
			window.dispatchEvent(new CustomEvent("ph-view-change", {
				detail: <ViewChangeData> {
					viewState: ViewsStack.views[ViewsStack.pos],
					newLoad: true,
				}
			}));
			return;
		}

		ViewsStack.views[ViewsStack.pos].saveScroll();
		ViewsStack.views[ViewsStack.pos--].classList.add("hide");
		ViewsStack.views[ViewsStack.pos].classList.remove("hide");
		ViewsStack.views[ViewsStack.pos].loadScroll();

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

	/** Changes the title of the browser tab & history state */
	static setCurrentStateTitle(title: string) {
		document.title = globalSettings.isIncognitoEnabled ? `${ViewsStack.randomUrl()} - Photon` : title;
		history.state.title = title;
	}

	static getNextState(): Ph_ViewState {
		return ViewsStack.views[ViewsStack.pos + 1] || null;
	}

	/** Remove all view state from the DOM, except for the currently active one */
	static clear() {
		const viewIds: string[] = Object.keys(ViewsStack.views);
		for (const i of viewIds) {
			if (i === ViewsStack.pos.toString())
				continue;
			ViewsStack.views[i].remove();
			delete ViewsStack.views[i];
		}
	}

	static removeViewState(view: Ph_ViewState) {
		const foundView = Object.entries(ViewsStack.views)
			.find(([_, v]) => v === view);
		if (!foundView[1])
			throw "View is not loaded";
		const i = foundView[0];
		ViewsStack.views[i].remove();
		delete ViewsStack.views[i];
	}

	static getPosition(): number {
		return ViewsStack.pos;
	}

	static makeHistoryState(title: string, url: string, posOffset: number = 1): HistoryState {
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
