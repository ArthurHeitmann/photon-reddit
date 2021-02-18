/**
 * Not actually markdown yet, just plain text (but hopefully in the future)
 */
export default class Ph_MarkdownForm extends HTMLElement {
	textField: HTMLTextAreaElement;
	shadowTextField: HTMLTextAreaElement;
	submitCommentBtn: HTMLButtonElement;

	constructor(submitBtnText: string, hasCancelBtn: boolean) {
		super();

		this.classList.add("markdownForm")

		this.textField = document.createElement("textarea");
		this.textField.className = "rawTextEditor";
		this.shadowTextField = this.textField.cloneNode(true) as HTMLTextAreaElement;
		this.textField.contentEditable = "true";
		this.textField.addEventListener("input", this.onTextInput.bind(this));
		this.appendChild(this.textField);
		this.shadowTextField.classList.add("shadow");
		this.appendChild(this.shadowTextField);

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

		this.submitCommentBtn = document.createElement("button");
		buttonsWrapper.appendChild(this.submitCommentBtn);
		this.submitCommentBtn.className = "submitBtn";
		this.submitCommentBtn.innerText = submitBtnText;

		this.submitCommentBtn.addEventListener("click", () => this.dispatchEvent(new Event("ph-submit")));
	}

	onTextInput() {
		this.shadowTextField.value = this.textField.value;
		this.textField.style.setProperty("--textarea-height", `calc(${this.shadowTextField.scrollHeight}px + 1.5rem)`)
	}
}

customElements.define("ph-markdown-form", Ph_MarkdownForm);
