import { disableMainScroll, enableMainScroll } from "../../../utils/htmlStatics";
import { hasHTML } from "../../../utils/utils";

export default class Ph_ModalPane extends HTMLElement {
	content: HTMLDivElement;

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.classList.add("modalPane");

		this.addEventListener("click", e => e.target === e.currentTarget && this.hide());

		const contentWrapper = document.createElement("div");
		this.append(contentWrapper);

		const closeButton = document.createElement("button");
		closeButton.className = "closeButton transparentButton";
		closeButton.innerHTML = `<img src="/img/close.svg" alt="close" draggable="false">`;
		closeButton.addEventListener("click", this.hide.bind(this));
		contentWrapper.append(closeButton);

		this.content = document.createElement("div");
		this.content.classList.add("modalContent")
		contentWrapper.append(this.content);
	}

	show() {
		this.classList.remove("remove");
		disableMainScroll();
	}

	hide() {
		this.classList.add("remove");
		enableMainScroll();
	}
}
