
export default class Ph_FeedItem extends HTMLElement {
	itemId: string;

	constructor(isInFeed: boolean, itemId: string) {
		super();

		this.itemId = itemId;

		this.classList.add("feedItem");

		if (isInFeed)
			this.classList.add("isInFeed");
	}
}

customElements.define("ph-feed-item", Ph_FeedItem);
