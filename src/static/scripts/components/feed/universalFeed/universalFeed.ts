import { redditApiRequest } from "../../../api/api.js";
import { viewsStack } from "../../../state/stateManager.js";
import { splitPathQuery } from "../../../utils/utils.js";
import { PostSorting, RedditApiType, SortPostsOrder } from "../../../utils/types.js";
import Ph_Comment from "../../comment/comment.js";
import { LoadPosition, Ph_Feed } from "../../feed/feed.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Post from "../../post/post.js";
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
			try {													// TODO when no more errors happen, remove all try & catches
				this.appendChild(this.makeFeedItem(postData));
			}
			catch (e) {
				console.error(e);
				new Ph_Toast(Level.Error, `Error making feed item`);
			}
		}
	}

	makeFeedItem(itemData: RedditApiType): HTMLElement {
		switch (itemData.kind) {
			case "t3":
				return new Post(itemData, true);
			case "t1":
				return new Ph_Comment(itemData, false, true, null);
			default:
				new Ph_Toast(Level.Error, `Unknown feed item "${itemData.kind}"`);
				throw `What is this feed item? ${JSON.stringify(itemData, null, 4)}`;
		}
	}

	async loadMore(loadPosition) {
		const posts: RedditApiType = await redditApiRequest(this.requestUrl, [
			["before", loadPosition === LoadPosition.Before ? this.beforeData : "null"],
			["after",  loadPosition === LoadPosition.After  ? this.afterData : "null"],
		], false);

		if (loadPosition === LoadPosition.After) {
			for (const postData of posts.data.children) {
				try {
					this.appendChild(this.makeFeedItem(postData));
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.Error, `Error making feed item`);
				}
			}
			this.afterData = this.children[this.childElementCount - 1]["itemId"];
			if (this.afterData === null)
				this.hasReachedEndOfFeed = true;
		}
		else {
			for (const postData of posts.data.children.reverse()) {
				try {
					const newPost = this.appendChild(this.makeFeedItem(postData));
					this.header.insertAdjacentElement("afterend", newPost);
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.Error, `Error making feed item`);
				}
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
		
        const request: RedditApiType = await redditApiRequest(newUrl, [], false);
        if (request["error"]) {
        	new Ph_Toast(Level.Error, "Error making request to reddit");
            throw `Error making sort request: ${JSON.stringify(request)}`;
        }
		
        
		for (const item of request.data.children) {
			try {
				this.appendChild(this.makeFeedItem(item));
			}
			catch (e) {
				console.error(e);
				new Ph_Toast(Level.Error, `Error making feed item`);
			}
		}
		
	}
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
