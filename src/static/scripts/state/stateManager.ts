import { oath2Request } from "../api/api.js";
import Ph_Comment from "../components/comment/comment.js";
import Ph_Post from "../components/post/post.js";
import Ph_PostAndComments from "../components/postAndComments/postAndComments.js";
import Ph_PostsFeed from "../components/postsFeed/postsFeed.js";
import { $id } from "../utils/getElements.js";
import { RedditApiData, RedditApiType } from "../utils/types.js";
import ViewsStack from "./viewsStack.js";

export const viewsStack: ViewsStack = new ViewsStack();

window.onpopstate = (e: PopStateEvent) => {
	if (e.state > viewsStack.position())
		viewsStack.next();
	else
		viewsStack.prev();
	console.log(`hID ${e.state}`)
};


export function pushLinkToHistoryComb(pathAndQuery: string): void {
	const querySeparation = pathAndQuery.match(/([\w\/]+)(\?[\w&=]*)?/);
	let path = querySeparation[1] || "/";
	let query = querySeparation[2] || "?";
	pushLinkToHistorySep(path, query);
}

export async function pushLinkToHistorySep(path: string, query: string = "?"): Promise<void> {
	const urlParams = new URLSearchParams(query);
	const params: string[][] = [];
	for (const param of urlParams.entries())
		params.push(param);
	
	const requestData = await oath2Request(path, params);
	if (requestData["error"])
		throw new Error("Error making request to reddit");

	if (requestData instanceof Array) {		// --> [0]: post [1]: comments
		const newView = new Ph_PostAndComments(requestData, path + query);
		$id("feed").appendChild(newView);
		viewsStack.push(newView).next();
	}
	else {
		const newView = new Ph_PostsFeed(requestData, path + query);
		$id("feed").appendChild(newView);
		viewsStack.push(newView).next();
	}
}

// function addPosts(posts: RedditApiType) {
// 	for (const postData of posts.data.children) {
// 		currentFeed.appendChild(new Ph_Post(postData, true));
// 	}
// }

// function addComments(comments: RedditApiType) {
// 	for (const commentData of comments.data.children) {
// 		currentFeed.appendChild(new Ph_Comment(commentData, false));
// 	}
// }