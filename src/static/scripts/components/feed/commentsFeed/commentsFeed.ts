import { RedditApiType } from "../../../utils/types.js";
import Ph_Comment from "../../comment/comment.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

export default class Ph_CommentsFeed extends HTMLElement {
	postFullName: string;

	constructor(comments: RedditApiType, postFullName: string) {
		super();

		this.classList.add("commentsFeed");
		this.postFullName = postFullName;

		for (const commentData of comments.data.children) {
			try {
				this.appendChild(new Ph_Comment(commentData, false, false, postFullName));
			}
			catch (e) {
				console.error("Error making root comment");
				console.error(e);
				new Ph_Toast(Level.Error, "Error making comment");
			}
		}
	}

	insertFirstComment(commentData: RedditApiType) {
		this.insertAdjacentElement("afterbegin", new Ph_Comment(commentData, false, false, this.postFullName));
	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);
