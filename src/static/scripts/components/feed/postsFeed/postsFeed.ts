import { oath2Request } from "../../../api/api.js";
import { pushLinkToHistorySep, viewsStack } from "../../../state/stateManager.js";
import { splitPathQuery } from "../../../utils/conv.js";
import { HistoryState, PostSorting, RedditApiType, SortPostsOrder } from "../../../utils/types.js";
import { LoadPosition, Ph_Feed } from "../../feed/feed.js";
import Ph_Post from "../../post/post.js";
import Ph_PostsSorter from "../sorting/postsSorter/postsSorter.js";

export default class Ph_PostsFeed extends Ph_Feed {
	constructor(posts: RedditApiType, requestUrl: string) {
		super(posts, true, requestUrl);

		this.classList.add("postsFeed");

		const header = document.createElement("div");
		this.appendChild(header);
		header.className = "feedHeader";

		header.appendChild(new Ph_PostsSorter(this));

		for (const postData of posts.data.children) {
			this.appendChild(new Ph_Post(postData, true));
		}
	}

	async loadMore(loadPosition) {
		const posts: RedditApiType = await oath2Request(this.requestUrl, [
			["before", loadPosition === LoadPosition.Before ? this.beforeData : "null"],
			["after",  loadPosition === LoadPosition.After  ? this.afterData : "null"],
		]);

		if (loadPosition === LoadPosition.After) {
			for (const postData of posts.data.children) {
				this.appendChild(new Ph_Post(postData, true));
			}
			
			this.afterData = posts.data.after;
			if (this.afterData === null)
				this.hasReachedEndOfFeed = true;
		}
		else {
			for (const postData of posts.data.children.reverse()) {
				const newPost = new Ph_Post(postData, true);
				this.insertAdjacentElement("afterbegin", newPost);
			}

			this.beforeData = this.children[0]["itemId"];
		}
	}

	async setSorting(sortingMode: PostSorting): Promise<void> {
		let [path, query] = splitPathQuery(this.requestUrl);
		
		const pathEnding = path.match(/\w*\/?$/)[0];
		if (SortPostsOrder[pathEnding]) {
			path = path.replace(/\w*\/?$/, sortingMode.order);
		}
		else {
			path = path.replace(/\/?$/, "/");
			path += sortingMode.order;
		}
		
		// top and controversial can also be sorted by time
		const params = new URLSearchParams(query);
		if (sortingMode.order == SortPostsOrder.top || sortingMode.order == SortPostsOrder.controversial) {
			params.set("t", sortingMode.timeFrame);
		}
		else {
			params.delete("t");
		}

		const paramsStr = params.toString();
		const newUrl = path + (paramsStr ? `?${paramsStr}` : "");
		
		viewsStack.changeCurrentUrl(newUrl);

        let last = this.lastElementChild;
        while (last.className !== "feedHeader") {
            last.remove();
            last = this.lastElementChild;
		}
		
        const request: RedditApiType = await oath2Request(newUrl);
        if (request["error"]) {
            throw new Error(`Error making sort request: ${JSON.stringify(request)}`);
        }
		
        
		for (const post of request.data.children)
			this.appendChild(new Ph_Post(post, true));
		
	}
}

customElements.define("ph-posts-feed", Ph_PostsFeed);
