import { RedditApiType } from "../../utils/types.js";
import Ph_Comment from "../comment/comment.js";

export default class Ph_CommentsFeed extends HTMLElement {
	constructor(comments: RedditApiType) {
		super();

		this.className = "commentsFeed";
		
		for (const commentData of comments.data.children) {
			this.appendChild(new Ph_Comment(commentData, false));
		}
	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);