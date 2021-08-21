import { makeElement } from "../../../utils/utils";
import Ph_MarkdownForm from "../markdownForm/markdownForm";
import Ph_ModalPane from "../modalPane/modalPane";

export interface MultiBasicInfo {
	name: string,
	descriptionMd: string,
	visibility: "public" | "private"
}
/** @return if true: close modal window; else keep it open */
export type OnMultiSubmitCallback = (info: MultiBasicInfo) => boolean | Promise<boolean>;

export default class Ph_MultiCreateOrEdit extends Ph_ModalPane {
	private nameInput: HTMLInputElement;
	private descriptionInput: Ph_MarkdownForm;
	private multiVisibility: "public" | "private";
	private onSubmitCallback: OnMultiSubmitCallback;
	private submitBtn: HTMLButtonElement;

	constructor(titleText: string, actionText: string, onSubmitCallback: OnMultiSubmitCallback, existingInfo?: MultiBasicInfo ) {
		super();

		this.hide();

		this.classList.add("multiCreateOrEdit");
		this.onSubmitCallback = onSubmitCallback;

		if (!existingInfo)
			existingInfo = { name: "", descriptionMd: "", visibility: "private" };

		this.content.append(
			makeElement("h2", null, titleText),
			this.nameInput = makeElement("input", { type: "text", placeholder: "Multi Name" }) as HTMLInputElement,
			this.descriptionInput = new Ph_MarkdownForm("", false, "Description (Optional)"),
			makeElement("div", { class: "bottomBar" }, [
				makeElement("div", { class: "visibilitySelector" }, [
					makeElement("button", {
						class: "private " + (existingInfo.visibility === "private" ? "selected" : ""),
						onclick: this.onVisibilityChanged.bind(this)
					}, [ makeElement("img", { src: "/img/lock.svg" }), makeElement("span", null, "Private")]),
					makeElement("button", {
						class: "public " + (existingInfo.visibility === "public" ? "selected" : ""),
						onclick: this.onVisibilityChanged.bind(this)
					}, [ makeElement("img", { src: "/img/earth.svg" }), makeElement("span", null, "Public")]),
				]),
				this.submitBtn = makeElement("button", { class: "submit button", onclick: this.onSubmit.bind(this) }, actionText) as HTMLButtonElement
			])
		);

		this.nameInput.value = existingInfo.name;
		this.descriptionInput.textField.value = existingInfo.descriptionMd;
		this.multiVisibility = existingInfo.visibility;

		document.body.append(this);
	}

	onSubmit() {
		this.submitBtn.disabled = true;
		const result = this.onSubmitCallback({
			name: this.nameInput.value,
			descriptionMd: this.descriptionInput.textField.value,
			visibility: this.multiVisibility
		});
		if (result instanceof Promise) {
			result.then(newResult => {
				this.submitBtn.disabled = false;
				if (newResult)
					this.hide();
			});
		}
		else {
			this.submitBtn.disabled = false;
			if (result)
				this.hide();
		}
	}

	private onVisibilityChanged(e: UIEvent) {
		const btn = e.currentTarget as HTMLButtonElement;
		this.multiVisibility = btn.classList.contains("private") ? "private" : "public";
		btn.parentElement.$class("selected")[0].classList.remove("selected");
		btn.classList.add("selected");
	}
}

customElements.define("ph-multi-create-or-edit", Ph_MultiCreateOrEdit);
