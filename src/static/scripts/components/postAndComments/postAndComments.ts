import { RedditApiType } from "../../utils/types.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_Post from "../post/ph_Post.js";

export default class Ph_PostAndComments extends HTMLElement {
	constructor(data: RedditApiType[]) {
		super();

		this.classList.add("postAndComments");

		try {
			this.appendChild(new Ph_Post(data[0].data.children[0], false));
		}
		catch (e) {
			console.error("Error making post in comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error making post");
		}
		this.appendChild( new Ph_CommentsFeed(data[1]));
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
