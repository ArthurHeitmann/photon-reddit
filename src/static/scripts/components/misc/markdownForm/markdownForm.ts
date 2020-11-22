export default class Ph_MarkdownForm extends HTMLElement {
	commentTextField: HTMLTextAreaElement;
	submitCommentBtn: HTMLButtonElement;

	constructor(submitBtnText: string, hasCancelBtn: boolean) {
		super();

		this.classList.add("markdownForm")

		this.commentTextField = document.createElement("textarea");
		this.commentTextField.className = "rawTextEditor";
		this.appendChild(this.commentTextField);

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
}

customElements.define("ph-markdown-form", Ph_MarkdownForm);
