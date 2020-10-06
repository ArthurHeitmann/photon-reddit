import { RedditApiType } from "../../utils/types.js";
import Ph_Post from "../post/post.js";
import { Ph_ViewState } from "../viewState/viewState.js";

export default class Ph_PostsFeed extends Ph_ViewState {
	constructor(posts: RedditApiType, url: string) {
		super({}, "Title", url);

		this.className = "postsFeed";

		for (const postData of posts.data.children) {
			this.appendChild(new Ph_Post(postData, true));
		}
	}
}

customElements.define("ph-posts-feed", Ph_PostsFeed);