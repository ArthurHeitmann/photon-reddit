import { comment } from "../../api/api.js";
import { RedditApiType } from "../../utils/types.js";
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

		const commentTextField = document.createElement("textarea");
		commentTextField.className = "rawTextEditor";
		this.appendChild(commentTextField);
		const submitCommentBtn = document.createElement("button");
		this.appendChild(submitCommentBtn);
		submitCommentBtn.className = "submitBtn";
		submitCommentBtn.innerText = "Post Comment";
		submitCommentBtn.addEventListener("click", async () => {
			submitCommentBtn.disabled = true;
			let response;
			try {
				response = await comment(post, commentTextField.value);
			}
			catch (e) {
				console.error("Error making comment request");
				response = { json: { errors: [ "", e ] } }
			}
			submitCommentBtn.disabled = false;

			if (response.json.errors.length > 0) {
				console.error("Error posting comment");
				console.error(response);
				console.error(JSON.stringify(response));
				for (let error of response.json.errors)
					new Ph_Toast(Level.Error, error instanceof Array ? error.join(" ") : JSON.stringify(error));
				return;
			}

			commentTextField.value = "";
			comments.insertFirstComment(response.json.data.things[0]);
		});

		const comments = new Ph_CommentsFeed(data[1]);
		this.appendChild(comments);
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
