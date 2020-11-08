import { comment } from "../../api/api.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_Comment from "../comment/comment.js";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_Post from "../post/ph_Post.js";

export default class Ph_PostAndComments extends HTMLElement {
	constructor(data: RedditApiType[]) {
		super();

		this.classList.add("postAndComments");

		let post;
		try {
			this.appendChild(post = new Ph_Post(data[0].data.children[0], false));
		}
		catch (e) {
			console.error("Error making post in comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error making post");
		}

		const commentForm = new Ph_CommentForm(post, false);
		this.appendChild(commentForm);
		commentForm.addEventListener("ph-comment-submitted",
			(e: CustomEvent) => comments.insertAdjacentElement("afterbegin", new Ph_Comment(e.detail, false, false, post)));

		const comments = new Ph_CommentsFeed(data[1], post);
		this.appendChild(comments);

		const commentLink: string =  location.pathname.match(new RegExp(post.permalink + "(\\w*)"))[1];
		if (commentLink) {
			comments.querySelector(`[data-id=${commentLink}]`).classList.add("highlight");
			comments.insertParentLink(post.permalink, "Load all comments");
		}
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
