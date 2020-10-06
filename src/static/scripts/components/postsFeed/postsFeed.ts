import { RedditApiType } from "../../utils/types.js";
import Ph_Post from "../post/post.js";

export default class Ph_PostsFeed extends HTMLElement {
	constructor(posts: RedditApiType) {
		super();

		this.className = "postsFeed";

		for (const postData of posts.data.children) {
			this.appendChild(new Ph_Post(postData, true));
		}
	}
}

customElements.define("ph-posts-feed", Ph_PostsFeed);