import { comment } from "../../api/api.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_Comment from "../comment/comment.js";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Post from "../post/post.js";

export default class Ph_PostAndComments extends HTMLElement {
	constructor(data: RedditApiType[]) {
		super();

		this.classList.add("postAndComments");

		let post;
		try {
			this.appendChild(post = new Post(data[0].data.children[0], false));
		}
		catch (e) {
			console.error("Error making post in comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error making post");
		}

		if (!post.isLocked) {
			const commentForm = new Ph_CommentForm(post, false);
			this.appendChild(commentForm);
			commentForm.addEventListener("ph-comment-submitted",
				(e: CustomEvent) => comments.insertAdjacentElement("afterbegin", new Ph_Comment(e.detail, false, false, post)));
		}

		const comments = new Ph_CommentsFeed(data[1], post);
		this.appendChild(comments);

		const commentLinkMatches = location.pathname.match(new RegExp(post.permalink + "(\\w*)"));
		if (commentLinkMatches && commentLinkMatches.length > 1 && commentLinkMatches[1]) {
			comments.$css(`[data-id=${commentLinkMatches[1]}]`)[0].classList.add("highlight");
			comments.insertParentLink(post.permalink, "Load all comments");
		}
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
