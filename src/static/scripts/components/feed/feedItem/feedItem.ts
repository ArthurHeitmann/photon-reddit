import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement.js";

export default class Ph_FeedItem extends Ph_PhotonBaseElement {
	itemId: string;
	link: string;
	isInFeed: boolean;

	constructor(id: string, link: string, isInFeed: boolean) {
		super();

		this.itemId = id;
		this.link = link;
		this.isInFeed = isInFeed;

		this.classList.add("feedItem");
		this.setAttribute("data-id", this.itemId);

		if (isInFeed) {
			this.classList.add("isInFeed");
			if (link) {
				const backgroundLink = document.createElement("a");
				backgroundLink.className = "backgroundLink";
				backgroundLink.href = this.link;
				this.appendChild(backgroundLink);
			}
		}
	}
}

customElements.define("ph-feed-item", Ph_FeedItem);
