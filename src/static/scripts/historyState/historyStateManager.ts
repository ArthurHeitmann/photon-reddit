import { redditApiRequest } from "../api/redditApi.js";
import Ph_UniversalFeed from "../components/feed/universalFeed/universalFeed.js";
import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import Ph_PostAndComments from "../components/postAndComments/postAndComments.js";
import Ph_ViewStateLoader from "../components/viewState/viewStateLoader/viewStateLoader.js";
import Ph_Wiki from "../components/wiki/wiki.js";
import { $id } from "../utils/htmlStatics.js";
import { splitPathQuery } from "../utils/utils.js";
import ViewsStack from "./viewsStack.js";

export const viewsStack: ViewsStack = new ViewsStack();
viewsStack.setNextIsReplace();

window.addEventListener("popstate", (e: PopStateEvent) => {
	if (document.fullscreenElement) {
		// works when previous history state has same domain
		e.preventDefault();
		document.exitFullscreen();
		return;
	}
	if (!e.state)
		return
	if (e.state.index > viewsStack.position()) {
		for(let i = e.state.index - viewsStack.position(); i > 0; --i) 
			viewsStack.forward(true);
	}
	else if (e.state.index < viewsStack.position()) {
		for(let i = viewsStack.position() - e.state.index; i > 0; --i) 
			viewsStack.back();
	}
	else {
		// new Ph_Toast(Level.Error, "Weird navigation error");
		// throw "Equal historyState";
	}
});

// TODO Make this an option
// window.onbeforeunload = () => {
// 	return "Are you sure you want to Exit?";
// };

export enum PushType {
	PushAfter, PushBefore
}

export function pushLinkToHistoryComb(pathAndQuery: string, pushType: PushType = PushType.PushAfter): void {
	const [path, query] = splitPathQuery(pathAndQuery);
	pushLinkToHistorySep(path, query, pushType);
}

export async function pushLinkToHistorySep(path: string, query: string = "?", pushType: PushType = PushType.PushAfter): Promise<void> {
	const stateLoader: Ph_ViewStateLoader = new Ph_ViewStateLoader(viewsStack.makeHistoryState(
		path, path + query, 1
	));

	const nextState = viewsStack.nextState();
	if (nextState && nextState.state.url == (path + query)) {
		history.forward();
		return;
	}

	if (pushType === PushType.PushAfter)
		viewsStack.pushAfter(stateLoader);
	else if (pushType === PushType.PushBefore)
		viewsStack.pushBefore(stateLoader);


	const urlParams = new URLSearchParams(query);
	const params: string[][] = [];
	for (const param of urlParams.entries())
		params.push(param);

	const requestData = await redditApiRequest(path, params, false);
	if (requestData["error"]) {
		stateLoader.error()
		new Ph_Toast(Level.Error, "Error making request to reddit");
		throw `Error making request to reddit (${path}, ${JSON.stringify(params)})`;
	}

	if (requestData instanceof Array) {		// --> [0]: post [1]: comments
		stateLoader.finishWith(new Ph_PostAndComments(requestData));
		viewsStack.setCurrentStateTitle(`Photon: ${requestData[0]["data"]["children"][0]["data"]["title"]}`);
	}
	else if (requestData["kind"]) {
		if (requestData["kind"] === "Listing") {
			stateLoader.finishWith(new Ph_UniversalFeed(requestData, path + query));
			viewsStack.setCurrentStateTitle(`Photon:  ${(path.length > 3) ? path.slice(1) : "Home"}`);
		}
		else if (requestData["kind"] === "wikipage") {
			stateLoader.finishWith(new Ph_Wiki(requestData));
			viewsStack.setCurrentStateTitle(`Photon: ${path.match(/r\/[^/]+/)[0]} Wiki`);
		}
	}

	if (location.hash)
		$id(location.hash.slice(1)).scrollIntoView();
}
