import { redditApiRequest } from "../../../api/redditApi.js";

export default class Ph_SubmitPostForm extends HTMLElement {
	constructor() {
		super();

		this.className = "flex f-direction-column";

		const subInput = document.createElement("input");
		subInput.type = "text";
		subInput.placeholder = "subreddit name";
		this.appendChild(subInput);

		const titleInput = document.createElement("input");
		titleInput.type = "text";
		titleInput.placeholder = "Post Tile";
		this.appendChild(titleInput);

		const linkRadio = document.createElement("input");
		linkRadio.type = "radio";
		linkRadio.name = "postType";
		linkRadio.value = "link";
		linkRadio.innerText = "Link";
		this.appendChild(linkRadio);

		const textRadio = document.createElement("input");
		textRadio.type = "radio";
		textRadio.name = "postType";
		textRadio.value = "link";
		textRadio.innerText = "Link";
		textRadio.checked = true;
		this.appendChild(textRadio);

		const linkUrlInput = document.createElement("input");
		linkUrlInput.type = "text";
		linkUrlInput.placeholder = "url";
		this.appendChild(linkUrlInput);

		const textInput = document.createElement("textarea");
		textInput.placeholder = "Text";
		this.appendChild(textInput);

		const submitButton = document.createElement("button");
		submitButton.innerText = "Submit";
		submitButton.className = "button";
		this.appendChild(submitButton);
		submitButton.addEventListener("click", () => {
			const params = [];
			params.push(["sr", subInput.value]);
			params.push(["kind", textRadio.checked ? "self" : "link"]);
			if (textRadio.checked)
				params.push(["text", textInput.value]);
			else 
				params.push(["url", linkUrlInput.value]);
			params.push(["title", titleInput.value]);
			
			const r = redditApiRequest("/api/submit", params, true, { method: "POST" })
		})
	}
}

customElements.define("ph-submit-post-form", Ph_SubmitPostForm);
