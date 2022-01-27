/**
 * This files extends the functionality of ViewStack
 */

import {redditApiRequest} from "../api/redditApi";
import Ph_FeedInfoPage from "../components/feed/feedInfo/feedInfoPage";
import Ph_UniversalFeed from "../components/feed/universalFeed/universalFeed";
import Ph_MessageCompose from "../components/message/messageCompose/messageCompose";
import Ph_RandomHub from "../components/misc/randomHub/randomHub";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import Ph_About from "../components/photon/about/about";
import Ph_PostCrossposts from "../components/post/postCrossposts/postCrossPosts";
import PostDoubleLink from "../components/post/postDoubleLink/postDoubleLink";
import Ph_SubmitPostForm from "../components/post/submit/submitPostForm";
import Ph_PostAndComments, {PostCommentsListings} from "../components/postAndComments/postAndComments";
import Ph_CommentsViewStateLoader from "../components/viewState/commentsViewStateLoader/commentsViewStateLoader";
import {Ph_ViewState} from "../components/viewState/viewState";
import Ph_ViewStateLoader from "../components/viewState/viewStateLoader/viewStateLoader";
import Ph_Wiki from "../components/wiki/wiki";
import {$id} from "../utils/htmlStatics";
import {deepClone, exitFullscreen, extractHash, isFullscreen, makeElement, splitPathQuery} from "../utils/utils";
import ViewsStack from "./viewsStack";
import Users from "../components/multiUser/userManagement";

ViewsStack.setNextIsReplace();

window.addEventListener("popstate", (e: PopStateEvent) => {
	// don't change history state when going back & in fullscreen (the user probably just wanted to exit fullscreen)
	if (isFullscreen()) {
		exitFullscreen();
		if (e.state.index <= ViewsStack.getPosition()) {
			// works only when previous history state has same domain
			e.preventDefault();
			history.forward();
			return;
		}
	}
	if (!e.state) {		// new page load || click on link with # || something weird
		if (!location.hash)
			return;
		const newState = deepClone(ViewsStack.getCurrentState().state);
		newState.url = newState.url.replace(/(#.*)?$/, location.hash)
		ViewsStack.replaceHistoryState(newState);
	}
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

window.onbeforeunload = () => {
	if (Users.global.d.photonSettings.beforeExitConfirmation)
		return "Are you sure you want to Exit?";
};

/** Whether a new history state should be inserted before or after the current one */
export enum PushType {
	pushAfter, pushBefore
}

enum PostHintState {
	noHint, postNoComments, postAndComments
}

/** Use this function to redirect to a SPA link and the url could contain a query part */
export async function pushLinkToHistoryComb(pathAndQuery: string, pushType: PushType = PushType.pushAfter, postHint?: PostDoubleLink): Promise<void> {
	const [path, query] = splitPathQuery(pathAndQuery);
	await pushLinkToHistorySep(path, query, pushType, postHint);
}

/** Use this function to redirect to a SPA link and the url doesn't contain a query part */
export async function pushLinkToHistorySep(path: string, query: string = "?", pushType: PushType = PushType.pushAfter, postHint?: PostDoubleLink): Promise<void> {
	// don't load new page if next history state has same url
	const nextState = ViewsStack.getNextState();
	if (nextState && nextState.state.url == (path + query)) {
		history.forward();
		return;
	}

	const historyState = ViewsStack.makeHistoryState(path, path + query, pushType === PushType.pushAfter ? 1 : -1);
	let postHintState: PostHintState;
	let stateLoader: Ph_ViewState;
	if (postHint && postHint.commentsViewStateLoader) {
		stateLoader = postHint.commentsViewStateLoader;
		postHintState = PostHintState.postAndComments;
	}
	else if (postHint) {
		stateLoader = new Ph_CommentsViewStateLoader(historyState, postHint);
		postHintState = PostHintState.postNoComments;
	}
	else {
		stateLoader = new Ph_ViewStateLoader(historyState);
		postHintState = PostHintState.noHint;
	}

	if (pushType === PushType.pushAfter)
		ViewsStack.pushAfter(stateLoader);
	else if (pushType === PushType.pushBefore)
		ViewsStack.pushBefore(stateLoader);

	if (postHintState === PostHintState.postAndComments) {
		ViewsStack.setCurrentStateTitle(`${postHint.post.data.title} - Photon`);
		return;
	}

	// convert query string to key value string[][]
	const urlParams = new URLSearchParams(query);
	const params: string[][] = [];
	for (const param of urlParams.entries())
		params.push(param);

	// maybe handle special unusual paths instead
	if (handleSpecialPaths(path, params, stateLoader)) {
		goToHash();
		return;
	}

	// make request to reddit
	const requestData = await redditApiRequest(path, params, false);
	if (requestData["error"]) {
		if (requestData["reason"] && /^\/r\/[^#?/]+(\/\w+)?\/?$/i.test(path))
			stateLoader.error(new Ph_FeedInfoPage(path));
		else
			stateLoader.error();
		new Ph_Toast(Level.error, "Error making request to reddit");
		throw `Error making request to reddit (${path}, ${JSON.stringify(params)})`;
	}

	let newTabTitle: string = null;
	try {
		if (postHintState === PostHintState.postNoComments) {
			stateLoader.finishWith(requestData);
			newTabTitle = `${postHint.post.data.title} - Photon`;
		}
		// result is a posts comments or post crosspost list
		else if (requestData instanceof Array) {
			if (requestData[1].data.children[0]?.kind === "t3")		// --> [0]: post [1]: post, [...]: post
				stateLoader.finishWith(new Ph_PostCrossposts(requestData));
			else													// --> [0]: post [1]: comments
				stateLoader.finishWith(new Ph_PostAndComments(requestData as PostCommentsListings));
			newTabTitle = `${requestData[0].data.children[0].data.title} - Photon`;
		}
		// result is some sort of generic feed
		else if (requestData.kind === "Listing") {
			stateLoader.finishWith(new Ph_UniversalFeed(requestData, path + query));
		}
		// result is a wiki page
		else if (requestData.kind === "wikipage") {
			stateLoader.finishWith(new Ph_Wiki(requestData));
			newTabTitle = `${path.match(/r\/[^/?#]+/i)[0]} Wiki - Photon`;
		}
		// some sort of error
		else if (requestData["message"] && requestData["reason"]) {
			stateLoader.finishWith(makeElement("div", null, [
				makeElement("p", null, requestData["message"]),
				makeElement("p", null, requestData["reason"]),
			]));
		} else {
			stateLoader.error();
		}
	} catch (e) {
		stateLoader.error();
	}

	if (newTabTitle !== null) {
		ViewsStack.setStateTitle(stateLoader, newTabTitle);
	}

	goToHash();
}

/** if url has a hash to an element, scroll it into view */
function goToHash() {
	const hash = extractHash(history.state.url);
	if (hash)
		$id(hash.slice(1))?.scrollIntoView();
}

function handleSpecialPaths(path: string, query: string[][], stateLoader: Ph_ViewState): boolean {
	// /about
	if (/^\/about(#.*)?$/i.test(path)) {
		stateLoader.finishWith(new Ph_About());
		return true;
	}
	// /submit or /r/sub/submit
	else if (/^(\/r\/[^/]+)?\/submit/i.test(path)) {
		stateLoader.finishWith(new Ph_SubmitPostForm());
		return true;
	}
	// /r/random or /r/randnsfw or /r/sub/random
	else if (/^\/r\/((random|randnsfw)|([^/?#]+\/random))([/#?].*)?$/i.test(path)) {
		const url = path + (query.length ? "?" + (new URLSearchParams(query).toString()) : "");
		stateLoader.finishWith(new Ph_RandomHub(url));
		return true;
	}
	// /message/compose
	else if (/^\/message\/compose/i.test(path)) {
		const receiver = query.find(param => param[0] === "to")?.[1];
		const subject = query.find(param => param[0] === "subject")?.[1];
		const message = query.find(param => param[0] === "message")?.[1];
		stateLoader.finishWith(new Ph_MessageCompose({ receiver, subject, message }));
		return true;
	}
	// subreddit about page
	else if (/^\/[^/]+\/[^/?#]+\/(about|rules)/.test(path)) {
		stateLoader.finishWith(new Ph_FeedInfoPage(path));
		const community = path.match(/^\/[^/]+\/([^/?#]+)/)[1];
		ViewsStack.setCurrentStateTitle(`${community} - About`);
		return true;
	}
	return false;
}
