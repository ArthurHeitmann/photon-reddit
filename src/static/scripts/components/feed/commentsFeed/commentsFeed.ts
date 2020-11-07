import { RedditApiType } from "../../../utils/types.js";
import Ph_Comment from "../../comment/comment.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_Post from "../../post/ph_Post.js";

export default class Ph_CommentsFeed extends HTMLElement {
	postFullName: string;

	constructor(comments: RedditApiType, post: Ph_Post) {
		super();

		this.classList.add("commentsFeed");

		for (const commentData of comments.data.children) {
			try {
				this.appendChild(new Ph_Comment(commentData, false, false, post));
			}
			catch (e) {
				console.error("Error making root comment");
				console.error(e);
				new Ph_Toast(Level.Error, "Error making comment");
			}
		}
	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);
