import { comment } from "../../../../api/redditApi";
import { FullName } from "../../../../types/votable";
import { escHTML } from "../../../../utils/htmlStatics";
import { hasParams } from "../../../../utils/utils";
import Ph_Toast, { Level } from "../../toast/toast";
import Ph_MarkdownForm from "../markdownForm";

export default class Ph_CommentForm extends Ph_MarkdownForm {
	constructor(thing: FullName, hasCancelBtn: boolean) {
		super("Submit comment", hasCancelBtn);
		if (!hasParams(arguments)) return;

		this.addEventListener("ph-submit", async () => {
			this.submitCommentBtn.disabled = true;
			let response;
			try {
				response = await comment(thing, this.textField.value);
			}
			catch (e) {
				console.error("Error making comment request");
				response = { json: { errors: [ "", e ] } }
			}
			this.submitCommentBtn.disabled = false;

			if (response.json.errors.length > 0) {
				console.error("Error editing comment");
				console.error(response);
				console.error(JSON.stringify(response));
				for (const error of response.json.errors)
					new Ph_Toast(Level.error, error instanceof Array ? error.join(" | ") : escHTML(JSON.stringify(error)));
				return;
			}

			this.clear();
			this.textField.dispatchEvent(new Event("input"));
			this.dispatchEvent(new CustomEvent("ph-comment-submitted", { detail: response.json.data.things[0] }))
		})
	}
}

customElements.define("ph-comment-form", Ph_CommentForm);
