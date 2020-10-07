import { oath2Request } from "../api/api.js";
import Ph_PostAndComments from "../components/postAndComments/postAndComments.js";
import Ph_PostsFeed from "../components/postsFeed/postsFeed.js";
import { Ph_ViewState } from "../components/viewState/viewState.js";
import Ph_ViewStateLoader from "../components/viewStateLoader/viewStateLoader.js";
import ViewsStack from "./viewsStack.js";

export const viewsStack: ViewsStack = new ViewsStack();


window.onpopstate = (e: PopStateEvent) => {
	// if (e.state && e.state.title)
		// document.title = e.state.title;

	if (e.state.index > viewsStack.position()) {
		for(let i = e.state.index - viewsStack.position(); i > 0; --i) 
			viewsStack.forward();
	}
	else if (e.state.index < viewsStack.position()) {
		for(let i = viewsStack.position() - e.state.index; i > 0; --i) 
			viewsStack.back();
	}
	else
		throw new Error("Equal state");
};

export enum PushType {
	PushAfter, PushBefore
}

export function pushLinkToHistoryComb(pathAndQuery: string, pushType: PushType = PushType.PushAfter): void {
	const querySeparation = pathAndQuery.match(/([\w\/]+)(\?[\w&=]*)?/);
	let path = querySeparation[1] || "/";
	let query = querySeparation[2] || "?";
	pushLinkToHistorySep(path, query, pushType);
}

let isInitialPush = true;
export async function pushLinkToHistorySep(path: string, query: string = "?", pushType: PushType = PushType.PushAfter): Promise<void> {
	const stateLoader: Ph_ViewStateLoader = new Ph_ViewStateLoader(viewsStack.makeHistoryState(
		path, path + query, 1
	));

	if (pushType === PushType.PushAfter)
		viewsStack.pushAfter(stateLoader, isInitialPush);
	else if (pushType === PushType.PushBefore)
		viewsStack.pushBefore(stateLoader);

	if (isInitialPush) isInitialPush = false;

	const urlParams = new URLSearchParams(query);
	const params: string[][] = [];
	for (const param of urlParams.entries())
		params.push(param);

	const requestData = await oath2Request(path, params);
	if (requestData["error"])
		throw new Error("Error making request to reddit");

	if (requestData instanceof Array) {		// --> [0]: post [1]: comments
		stateLoader.finishWith(new Ph_PostAndComments(requestData));
		viewsStack.setCurrentStateTitle(`Photon: ${requestData[0]["data"]["children"][0]["data"]["title"]}`);
	}
	else {
		stateLoader.finishWith(new Ph_PostsFeed(requestData));
		viewsStack.setCurrentStateTitle(`Photon:  ${(path.length > 3) ? path.slice(1) : "Home"}`);
	}
}