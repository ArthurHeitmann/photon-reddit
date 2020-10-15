import { RedditApiType } from "../../../utils/types.js";

export default class Ph_FeedItem extends HTMLElement {
	itemId: string;
	link: string;

	constructor(itemData: RedditApiType, isInFeed: boolean) {
		super();

		this.itemId = itemData.data["name"];
		this.link = itemData.data["permalink"];

		this.classList.add("feedItem");

		if (isInFeed) {
			this.classList.add("isInFeed");
			const backgroundLink = document.createElement("a");
			backgroundLink.className = "backgroundLink";
			backgroundLink.href = this.link;
			this.appendChild(backgroundLink);
		}

	}
}

customElements.define("ph-feed-item", Ph_FeedItem);
