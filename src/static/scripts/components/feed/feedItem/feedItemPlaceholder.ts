import Ph_FeedItem from "./feedItem";

export default class Ph_FeedItemPlaceholder {
	private relatedItem: Ph_FeedItem;
	private hasBeenVisibleOnce = false;

	constructor(relatedItem: Ph_FeedItem) {
		// super();

		this.relatedItem = relatedItem;
		// this.classList.add("feedItemPlaceholder");
		// this.classList.add("feedItem");
		// if (relatedItem.classList.contains("isInFeed"))
		// 	this.classList.add("isInFeed");
		// observe self
		// (new IntersectionObserver(
		// 	this.onThisViewResize.bind(this),
		// 	{
		// 		threshold: [0, 0.1, 1],
		// 		rootMargin: "1000px 0px 1000px 0px"
		// 	}
		// )).observe(this);
		// observe related item
		(new IntersectionObserver(
			this.onItemViewResize.bind(this),
			{
				threshold: [0, 1],
				rootMargin: "10px 0px 500px 10px"
			}
		)).observe(relatedItem);
	}

	// private onThisViewResize(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
	// 	// console.log("this", entries[0].intersectionRatio, this.relatedItem);
	// 	if (entries[0].intersectionRatio > 0 && !this.relatedItem.isConnected && this.isConnected) {
	// 		// console.log("showing", this.relatedItem, this);
	// 		this.after(this.relatedItem);
	// 		this.remove();
	// 	}
	// }

	private onItemViewResize(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
		// console.log("item", entries[0].intersectionRatio, this.relatedItem);

		// // ensure item has been on screen before removing it
		// if (entries[0].intersectionRatio > 0 && !this.hasBeenVisibleOnce) {
		// 	this.hasBeenVisibleOnce = true;
		// }
		if (entries[0].intersectionRatio > 0) {
			this.relatedItem.classList.remove("outOfView")
		}
		// replace item with placeholder if item is not on screen (and in the DOM)
		if (entries[0].intersectionRatio === 0 && this.relatedItem.isConnected) {
			// console.log("hiding", this.relatedItem, this);
			const targetHeight = this.relatedItem.offsetHeight;
			this.relatedItem.classList.add("outOfView")
			this.relatedItem.style.setProperty("--placeholder-height", `${targetHeight}px`);
			// this.style.height = `${targetHeight}px`;
			// this.relatedItem.after(this);
			// this.relatedItem.remove();
		}
	}
}

// customElements.define("ph-feed-item-placeholder", Ph_FeedItemPlaceholder);
