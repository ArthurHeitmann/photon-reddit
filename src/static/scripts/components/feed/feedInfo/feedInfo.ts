import { classInElementTree } from "../../../utils/htmlStuff.js";
import { FeedType } from "../universalFeed/universalFeed.js";

export default class Ph_FeedInfo extends HTMLElement {
	hideRef: (e: MouseEvent) => void;

	constructor(feedType: FeedType, feedUrl: string) {
		super();

		this.hideRef = e => classInElementTree(e.target as HTMLElement, "feedInfo") || this.hide();
		this.className = "feedInfo remove";

		document.body.appendChild(this);
	}

	makeShowInfoButton(): HTMLElement {
		const button = document.createElement("button");
		button.className = "showInfo";
		button.innerHTML = `<img src="/img/info.svg">`;
		button.addEventListener("click", this.toggle.bind(this));
		return button;
	}

	toggle() {
		if (this.classList.contains("remove"))
			this.show();
		else
			this.hide();
	}

	show() {
		this.classList.remove("remove");
		setTimeout(() => window.addEventListener("click", this.hideRef), 0);
	}

	hide() {
		this.classList.add("remove");
		window.removeEventListener("click", this.hideRef);
	}
}

customElements.define("ph-feed-info", Ph_FeedInfo);
