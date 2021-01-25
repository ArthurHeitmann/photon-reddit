import Ph_FeedInfo from "../../feed/feedInfo/feedInfo.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

export default class Ph_SubmitPostForm extends HTMLElement {
	subInput: HTMLDivElement;
	validIndicator: HTMLImageElement;
	subInfoButton: Ph_FeedInfo;
	titleInput: HTMLDivElement;
	linkUrlInput: HTMLDivElement;
	textInput: HTMLDivElement;
	submitButton: HTMLButtonElement;

	constructor() {
		super();

		this.className = "submitPost";

		this.subInput = this.makeTextInput("sub", "Subreddit or User Name");
		this.subInput.addEventListener("change", this.onSubChange.bind(this));
		this.validIndicator = document.createElement("img");
		this.validIndicator.className = "validStatus";
		this.subInput.appendChild(this.validIndicator);
		this.appendChild(this.subInput);

		this.titleInput = this.makeTextInput("", "Title");
		this.appendChild(this.titleInput);

		this.linkUrlInput = this.makeTextInput("", "Url");
		this.appendChild(this.linkUrlInput);

		this.textInput = this.makeTextInput("postthis.textInput", "Text", true);
		this.appendChild(this.textInput);

		this.submitButton = document.createElement("button");
		this.submitButton.innerText = "Submit";
		this.submitButton.className = "button";
		this.appendChild(this.submitButton);
		this.submitButton.addEventListener("click", () => {
			// const params = [];
			// params.push(["sr", this.subInput.value]);
			// params.push(["kind", textRadio.checked ? "self" : "link"]);
			// if (textRadio.checked)
			// 	params.push(["text", this.textInput.value]);
			// else
			// 	params.push(["url", this.linkUrlInput.value]);
			// params.push(["title", this.titleInput.value]);
			//
			// const r = redditApiRequest("/api/submit", params, true, { method: "POST" })
		})
	}

	private makeTextInput(className: string, placeHolderText: string, isTextArea: boolean = false): HTMLDivElement {
		const wrapper = document.createElement("div");
		wrapper.className = `phInput roundedL ${className}`;
		if (isTextArea)
			wrapper.classList.add("textarea");
		const input = document.createElement(!isTextArea ? "input" : "textarea");
		if (input instanceof HTMLInputElement)
			input.type = "text";
		input.placeholder = placeHolderText;
		wrapper.appendChild(input)
		return wrapper;
	}

	private onSubChange() {
		let subName = (this.subInput.$tag("input")[0] as HTMLInputElement).value;
		if (!/^(r|u|user)\//.test(subName)) {
			new Ph_Toast(Level.Error, `Community must start with "r/" or "u/" or "user/"`, { timeout: 3500 });
			return;
		}
		else if (!/^(r|u|user)\/[a-zA-z0-9_-]{3,21}$/.test(subName)) {
			new Ph_Toast(Level.Error, `Invalid community name`, { timeout: 3500 });
			return;
		}
		subName = subName.replace(/^\/?/, "/");
		subName = subName.replace(/\/?$/, "/");

	}
}

customElements.define("ph-submit-post-form", Ph_SubmitPostForm);
