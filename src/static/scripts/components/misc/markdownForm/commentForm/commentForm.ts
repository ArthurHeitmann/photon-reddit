import { comment } from "../../../../api/api.js";
import Ph_Toast, { Level } from "../../toast/toast.js";
import Votable from "../../votable/votable.js";
import Ph_MarkdownForm from "../markdownForm.js";

export default class Ph_CommentForm extends Ph_MarkdownForm {
	constructor(votable: Votable, hasCancelBtn: boolean) {
		super("Submit comment", hasCancelBtn);

		this.addEventListener("ph-submit", async () => {
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
		})
	}
}

customElements.define("ph-comment-form", Ph_CommentForm);
