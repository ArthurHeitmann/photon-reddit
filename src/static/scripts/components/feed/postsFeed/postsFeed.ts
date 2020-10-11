import { oath2Request } from "../../../api/api.js";
import { HistoryState, RedditApiType } from "../../../utils/types.js";
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
				// window.scrollBy(0, newPost.getBoundingClientRect().height);
			}

			this.beforeData = this.children[0]["itemId"];
		}
	}
}

customElements.define("ph-posts-feed", Ph_PostsFeed);
