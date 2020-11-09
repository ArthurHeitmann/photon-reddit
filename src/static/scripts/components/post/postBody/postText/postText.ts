import { elementWithClassInTree, linksToInlineImages } from "../../../../utils/htmlStuff.js";

export default class Ph_PostText extends HTMLElement {
	maxHeightInVh: number;
	expandButton: HTMLButtonElement;
	textWrapper: HTMLDivElement;

	constructor(bodyHtml: string) {
		super();

		this.className = "postText";

		this.textWrapper = document.createElement("div");
		this.textWrapper.innerHTML = bodyHtml;
		linksToInlineImages(this.textWrapper);
		this.appendChild(this.textWrapper);

		setTimeout(() => {
			if (this.isOverflowing() && elementWithClassInTree(this.parentElement, "isInFeed")) {
				this.classList.add("expandableText");
				this.maxHeightInVh = .3;
				this.updateMaxHeightStyle();

				this.expandButton = document.createElement("button");
				this.expandButton.classList.add("expandButton");
				this.expandButton.innerHTML = `<img src="/img/downArrow.svg" draggable="false">`;
				this.expandButton.addEventListener("click", this.expand.bind(this));
				this.appendChild(this.expandButton);
			}
		}, 0);
	}

	updateMaxHeightStyle() {
		this.style.setProperty("--max-height", `${this.maxHeightInVh * 100}vh`);
	}

	expand() {
		this.maxHeightInVh += .25;
		this.updateMaxHeightStyle();

		if (!this.isOverflowing()) {
			this.expandButton.remove();
			this.style.setProperty("--max-height", `max-content`);
			this.classList.remove("expandableText");
		}
	}

	isOverflowing(): boolean {
		return this.textWrapper.scrollHeight - this.textWrapper.offsetHeight > 15;
	}
}

customElements.define("ph-post-text", Ph_PostText);
