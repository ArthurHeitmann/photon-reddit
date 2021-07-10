import { parseMarkdown } from "../../../lib/markdownForReddit/markdown-for-reddit.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { hasParams } from "../../../utils/utils.js";

/**
 * Not actually markdown yet, just plain text (but hopefully in the future)
 */
export default class Ph_MarkdownForm extends HTMLElement {
	textField: HTMLTextAreaElement;
	shadowTextField: HTMLTextAreaElement;
	submitCommentBtn: HTMLButtonElement;
	markdownPreview: HTMLElement;

	/**
	 * @param submitBtnText if empty no submit button
	 * @param hasCancelBtn
	 */
	constructor(submitBtnText: string, hasCancelBtn: boolean) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("markdownForm")

		const textArea = document.createElement("div");
		textArea.className = "textArea";
		this.append(textArea);
		this.textField = document.createElement("textarea");
		this.textField.className = "rawTextEditor";
		this.shadowTextField = this.textField.cloneNode(true) as HTMLTextAreaElement;
		this.textField.contentEditable = "true";
		this.textField.addEventListener("input", this.onTextInput.bind(this));
		textArea.appendChild(this.textField);
		this.shadowTextField.classList.add("shadow");
		textArea.appendChild(this.shadowTextField);
		this.markdownPreview = document.createElement("div");
		this.markdownPreview.className = "markdownPreview";
		textArea.append(this.markdownPreview);

		const buttonsWrapper = document.createElement("div");
		buttonsWrapper.className = "buttonsWrapper";
		this.appendChild(buttonsWrapper)

		if (hasCancelBtn) {
			const cancelBtn = document.createElement("button");
			cancelBtn.className = "cancelBtn";
			cancelBtn.innerText = "Cancel";
			buttonsWrapper.appendChild(cancelBtn);

			cancelBtn.addEventListener("click", () => this.dispatchEvent(new Event("ph-cancel")));
		}

		if (submitBtnText) {
			this.submitCommentBtn = document.createElement("button");
			buttonsWrapper.appendChild(this.submitCommentBtn);
			this.submitCommentBtn.className = "submitBtn";
			this.submitCommentBtn.innerText = submitBtnText;

			this.submitCommentBtn.addEventListener("click", () => this.dispatchEvent(new Event("ph-submit")));
		}

		setTimeout(this.onTextInput.bind(this), 0);
	}

	clear() {
		this.textField.value = "";
		this.updateHeight();
	}

	onTextInput() {
		this.updateHeight();
		this.displayMarkdownPreview();
	}

	updateHeight() {
		this.shadowTextField.value = this.textField.value;
		this.textField.style.setProperty("--textarea-height", `calc(${this.shadowTextField.scrollHeight}px + 1.5rem)`)
	}

	displayMarkdownPreview() {
		this.markdownPreview.innerHTML = parseMarkdown(this.textField.value);
		linksToSpa(this.markdownPreview);
	}
}

customElements.define("ph-markdown-form", Ph_MarkdownForm);
