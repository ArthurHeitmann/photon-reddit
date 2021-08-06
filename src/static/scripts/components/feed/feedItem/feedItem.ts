import { isElementInViewport } from "../../../utils/htmlStatics";
import { hasParams } from "../../../utils/utils";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";

export default class Ph_FeedItem extends Ph_PhotonBaseElement {
	itemId: string;
	link: string;
	isInFeed: boolean;
	hasBeenOrAlmostVisible = false;

	constructor(id: string, link: string, isInFeed: boolean) {
		super();
		if (!hasParams(arguments)) return;

		this.itemId = id;
		this.link = link;
		this.isInFeed = isInFeed;

		this.classList.add("feedItem");
		this.setAttribute("data-id", this.itemId);

		if (isInFeed) {
			this.classList.add("isInFeed");
		}
		if (link) {
			const backgroundLink = document.createElement("a");
			backgroundLink.className = "backgroundLink";
			backgroundLink.href = this.link;
			this.appendChild(backgroundLink);
		}

		const intersectionObserver = new IntersectionObserver(
			entries => {
				let isVisible = entries[0].intersectionRatio > .4;
				if (entries[0].intersectionRatio === 0 && isElementInViewport(this))		// when initializing this can be visible but the ration is 0
					isVisible = true;
				this.dispatchEvent(new CustomEvent(
					"ph-intersection-change",
					{ detail: isVisible }
				));
				if (!isVisible)
					return;

				if (!this.hasBeenOrAlmostVisible) {
					this.hasBeenOrAlmostVisible = true;
					this.dispatchEvent(new Event("ph-almost-visible"));
				}
				let next: Element = this;
				for (let i = 0; i < 5; i++) {
					next = next.nextElementSibling;
					if (!next)
						break;
					if (!(next instanceof Ph_FeedItem) || next.hasBeenOrAlmostVisible)
						continue;
					else if (next.offsetHeight === 0)
						i--;
					next.hasBeenOrAlmostVisible = true;
					next.dispatchEvent(new Event("ph-almost-visible"));
				}
				let prev: Element = this;
				for (let i = 0; i < 5; i++) {
					prev = prev.previousElementSibling;
					if (!prev)
						break;
					if (!(prev instanceof Ph_FeedItem) || prev.hasBeenOrAlmostVisible || prev.offsetHeight === 0)
						continue;
					else if (prev.offsetHeight === 0)
						i--;
					prev.hasBeenOrAlmostVisible = true;
					prev.dispatchEvent(new Event("ph-almost-visible"));
				}
			},
			{ threshold: .4 }
		);
		intersectionObserver.observe(this);
	}
}

customElements.define("ph-feed-item", Ph_FeedItem);
