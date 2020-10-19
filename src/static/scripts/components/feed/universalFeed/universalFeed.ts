import { oath2Request } from "../../../api/api.js";
import { viewsStack } from "../../../state/stateManager.js";
import { splitPathQuery } from "../../../utils/conv.js";
import { PostSorting, RedditApiType, SortPostsOrder } from "../../../utils/types.js";
import Ph_Comment from "../../comment/comment.js";
import { LoadPosition, Ph_Feed } from "../../feed/feed.js";
import Ph_Post from "../../post/post.js";
import Ph_PostsSorter from "../sorting/postsSorter/postsSorter.js";

export default class Ph_UniversalFeed extends Ph_Feed {
	header: HTMLDivElement;

	constructor(posts: RedditApiType, requestUrl: string) {
		super(posts, true, requestUrl);

		this.classList.add("universalFeed");

		this.header = document.createElement("div");
		this.appendChild(this.header);
		this.header.className = "feedHeader";

		this.header.appendChild(new Ph_PostsSorter(this));

		for (const postData of posts.data.children) {
			this.appendChild(this.makeFeedItem(postData));
		}
	}

	makeFeedItem(itemData: RedditApiType): HTMLElement {
		switch (itemData.kind) {
			case "t3":
				return new Ph_Post(itemData, true);
			case "t1":
				return new Ph_Comment(itemData, false, true);
			default:
				throw new Error(`What is this feed item? ${JSON.stringify(itemData, null, 4)}`);
				;
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
			
			this.afterData = this.children[this.childElementCount - 1]["itemId"];
			if (this.afterData === null)
				this.hasReachedEndOfFeed = true;
		}
		else {
			for (const postData of posts.data.children.reverse()) {
				const newPost = new Ph_Post(postData, true);
				this.header.insertAdjacentElement("afterend", newPost);
			}

			this.beforeData = this.children[1]["itemId"];
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
		
        
		for (const item of request.data.children)
			this.appendChild(this.makeFeedItem(item));
		
	}
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);