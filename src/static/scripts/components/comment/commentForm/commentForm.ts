import { comment } from "../../../api/api.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Votable from "../../misc/votable/votable.js";

export default class Ph_CommentForm extends HTMLElement {
	commentTextField: HTMLTextAreaElement;
	submitCommentBtn: HTMLButtonElement;

	constructor(votable: Votable) {
		super();

		this.classList.add("commentForm")

		this.commentTextField = document.createElement("textarea");
		this.commentTextField.className = "rawTextEditor";
		this.appendChild(this.commentTextField);

		this.submitCommentBtn = document.createElement("button");
		this.appendChild(this.submitCommentBtn);
		this.submitCommentBtn.className = "submitBtn";
		this.submitCommentBtn.innerText = "Post Comment";

		this.submitCommentBtn.addEventListener("click", async () => {
			this.submitCommentBtn.disabled = true;
			let response;
			try {
				response = await comment(votable, this.commentTextField.value);
			}
			catch (e) {
				console.error("Error making comment request");
				response = { json: { errors: [ "", e ] } }
			}
			this.submitCommentBtn.disabled = false;

			if (response.json.errors.length > 0) {
				console.error("Error posting comment");
				console.error(response);
				console.error(JSON.stringify(response));
				for (let error of response.json.errors)
					new Ph_Toast(Level.Error, error instanceof Array ? error.join(" | ") : JSON.stringify(error));
				return;
			}

			this.commentTextField.value = "";
			this.dispatchEvent(new CustomEvent("ph-comment-submitted", { detail: response.json.data.things[0] }))
		});
	}
}

customElements.define("ph-comment-form", Ph_CommentForm);
