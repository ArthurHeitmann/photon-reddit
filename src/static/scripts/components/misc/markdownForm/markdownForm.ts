import { parseMarkdown } from "../../../lib/markdownForReddit/markdown-for-reddit";
import { PhEvents } from "../../../types/Events";
import { linksToSpa } from "../../../utils/htmlStuff";
import { hasParams } from "../../../utils/utils";
import Ph_CurrentUserDisplay from "../currentUser/currentUser";

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
	 * @param placeholderText placeholder text in text field
	 */
	constructor(submitBtnText: string, hasCancelBtn: boolean, placeholderText: string = "") {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("markdownForm")

		const textArea = document.createElement("div");
		textArea.className = "textArea";
		this.append(textArea);
		this.textField = document.createElement("textarea");
		this.textField.className = "rawTextEditor";
		this.textField.setAttribute("placeholder", placeholderText);
		this.shadowTextField = this.textField.cloneNode(true) as HTMLTextAreaElement;
		this.textField.contentEditable = "true";
		this.textField.addEventListener("input", this.onTextInput.bind(this));
		textArea.append(this.textField);
		this.shadowTextField.classList.add("shadow");
		textArea.append(this.shadowTextField);
		this.markdownPreview = document.createElement("div");
		this.markdownPreview.className = "markdownPreview";
		textArea.append(this.markdownPreview);
		textArea.append(new Ph_CurrentUserDisplay());

		if (hasCancelBtn || submitBtnText) {
			const buttonsWrapper = document.createElement("div");
			buttonsWrapper.className = "buttonsWrapper";
			this.appendChild(buttonsWrapper);

			if (hasCancelBtn) {
				const cancelBtn = document.createElement("button");
				cancelBtn.className = "cancelBtn";
				cancelBtn.innerText = "Cancel";
				buttonsWrapper.appendChild(cancelBtn);

				cancelBtn.addEventListener("click", () => this.dispatchEvent(new Event(PhEvents.cancel)));
			}

			if (submitBtnText) {
				this.submitCommentBtn = document.createElement("button");
				buttonsWrapper.appendChild(this.submitCommentBtn);
				this.submitCommentBtn.className = "submitBtn";
				this.submitCommentBtn.innerText = submitBtnText;

				this.submitCommentBtn.addEventListener("click", () => this.dispatchEvent(new Event(PhEvents.submit)));
			}
		}

		setTimeout(this.updateHeight.bind(this), 0);
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
