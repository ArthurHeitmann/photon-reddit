/**
 * This files extends the functionality of ViewStack
 */

import { redditApiRequest } from "../api/redditApi.js";
import Ph_UniversalFeed from "../components/feed/universalFeed/universalFeed.js";
import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import Ph_About from "../components/photon/about/about.js";
import Ph_SubmitPostForm from "../components/post/submit/submitPostForm.js";
import Ph_PostAndComments from "../components/postAndComments/postAndComments.js";
import Ph_ViewStateLoader from "../components/viewState/viewStateLoader/viewStateLoader.js";
import Ph_Wiki from "../components/wiki/wiki.js";
import { $id } from "../utils/htmlStatics.js";
import { extractHash, splitPathQuery } from "../utils/utils.js";
import ViewsStack from "./viewsStack.js";

ViewsStack.setNextIsReplace();

window.addEventListener("popstate", (e: PopStateEvent) => {
	// don't change history state when going back & in fullscreen (the user probably just wanted to exit fullscreen)
	if (document.fullscreenElement) {
		document.exitFullscreen();
		if (e.state.index <= ViewsStack.getPosition()) {
			// works only when previous history state has same domain
			e.preventDefault();
			history.forward();
			return;
		}
	}
	if (!e.state)		// something weird
		return
	// forward
	if (e.state.index > ViewsStack.getPosition()) {
		for(let i = e.state.index - ViewsStack.getPosition(); i > 0; --i)
			ViewsStack.forward(true);
	}
	// back
	else if (e.state.index < ViewsStack.getPosition()) {
		for(let i = ViewsStack.getPosition() - e.state.index; i > 0; --i)
			ViewsStack.back();
	}
});

// TODO Make this an option
// window.onbeforeunload = () => {
// 	return "Are you sure you want to Exit?";
// };

/** Whether a new history state should be inserted before or after the current one */
export enum PushType {
	PushAfter, PushBefore
}

/** Use this function to redirect to a SPA link and the url could contain a query part */
export function pushLinkToHistoryComb(pathAndQuery: string, pushType: PushType = PushType.PushAfter): void {
	const [path, query] = splitPathQuery(pathAndQuery);
	pushLinkToHistorySep(path, query, pushType);
}

/** Use this function to redirect to a SPA link and the url doesn't contain a query part */
export async function pushLinkToHistorySep(path: string, query: string = "?", pushType: PushType = PushType.PushAfter): Promise<void> {
	// don't load new page if next history state has same url
	const nextState = ViewsStack.getNextState();
	if (nextState && nextState.state.url == (path + query)) {
		history.forward();
		return;
	}

	const stateLoader: Ph_ViewStateLoader = new Ph_ViewStateLoader(
		ViewsStack.makeHistoryState(path, path + query)
	);

	if (pushType === PushType.PushAfter)
		ViewsStack.pushAfter(stateLoader);
	else if (pushType === PushType.PushBefore)
		ViewsStack.pushBefore(stateLoader);


	// convert query string to key value string[][]
	const urlParams = new URLSearchParams(query);
	const params: string[][] = [];
	for (const param of urlParams.entries())
		params.push(param);

	// maybe handle special unusual paths instead
	if (handleSpecialPaths(path, params, stateLoader))
		return;

	// make request to reddit
	const requestData = await redditApiRequest(path, params, false);
	if (requestData["error"]) {
		stateLoader.error()
		new Ph_Toast(Level.Error, "Error making request to reddit");
		throw `Error making request to reddit (${path}, ${JSON.stringify(params)})`;
	}

	// result is a posts comments
	if (requestData instanceof Array) {		// --> [0]: post [1]: comments
		stateLoader.finishWith(new Ph_PostAndComments(requestData));
		ViewsStack.setCurrentStateTitle(`Photon: ${requestData[0]["data"]["children"][0]["data"]["title"]}`);
	}
	// result is something else
	else if (requestData["kind"]) {
		// result is some sort of generic feed
		if (requestData["kind"] === "Listing") {
			stateLoader.finishWith(new Ph_UniversalFeed(requestData, path + query));
			ViewsStack.setCurrentStateTitle(`Photon: ${(path.length > 3) ? path.slice(1) : "Home"}`);
		}
		// result is a wiki page
		else if (requestData["kind"] === "wikipage") {
			stateLoader.finishWith(new Ph_Wiki(requestData));
			ViewsStack.setCurrentStateTitle(`Photon: ${path.match(/r\/[^/]+/)[0]} Wiki`);
		}
	}

	// if url has a hash to an element, scroll it into view
	const hash = extractHash(history.state.url);
	if (hash)
		$id(hash.slice(1)).scrollIntoView();
}

function handleSpecialPaths(path: string, query: string[][], stateLoader: Ph_ViewStateLoader): boolean {
	if (/^\/about$/.test(path)) {
		stateLoader.finishWith(new Ph_About());
		return true;
	}
	else if (/^(\/r\/[^/]+)?\/submit/.test(path)) {
		stateLoader.finishWith(new Ph_SubmitPostForm());
		return true;
	}
	return false;
}
