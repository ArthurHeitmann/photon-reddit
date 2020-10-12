import { RedditApiType } from "../../utils/types.js";

export abstract class Ph_Feed extends HTMLElement {
	absoluteFirst: string = null;
	beforeData: string = null;
	afterData: string = null;
	isLoading: boolean = false;
	clearPreviousAfterLoad: boolean;
	requestUrl: string;
	hasReachedEndOfFeed = false;

	constructor(feedData: RedditApiType, clearPreviousAfterLoad: boolean, requestUrl: string) {
		super();

		this.beforeData = feedData.data.before;
		this.afterData = feedData.data.after;
		if (this.afterData === null)
			this.hasReachedEndOfFeed = true;
		this.requestUrl = requestUrl;
		this.clearPreviousAfterLoad = clearPreviousAfterLoad;

		//wait for this element to be attached to a parent
		setTimeout(() => {
			let scrollElement = this.parentElement;
			while (!scrollElement.classList.contains("overflow-y-auto"))
				scrollElement = this.parentElement;

			scrollElement.addEventListener("scroll", e => this.onScroll(e), { passive: true });
		}, 0);

		// find first FeedItem, once it has been added
		const observer = new MutationObserver((mutationsList: MutationRecord[], observer) => {
			for (const mutation of mutationsList) {
				for (const addedNode of mutation.addedNodes) {
					if (addedNode["itemId"]) {
						this.absoluteFirst = addedNode["itemId"];
						observer.disconnect();
						return;
					}
				}
			}
		});
		observer.observe(this, { childList: true })
	}

	/**
	 * If less than 5 screen heights are left until the end of the feed, load new content
	 * 
	 * @param e 
	 */
	onScroll(e) {
		if (this.children.length <= 0 || this.isLoading)
			return;

		const last = this.children[this.childElementCount - 1];
		if (last.getBoundingClientRect().y < window.innerHeight * 2.5 && !this.hasReachedEndOfFeed)
			this.scrollAction(LoadPosition.After)
		const first = this.children[0];
		if (first && first.getBoundingClientRect().y > window.innerHeight * -2.5)
			this.scrollAction(LoadPosition.Before);
	}

	scrollAction(loadPosition: LoadPosition) {
		if (loadPosition === LoadPosition.Before && (this.beforeData === null || this.beforeData === this.absoluteFirst))
			return;

		this.isLoading = true;
		this.loadMore(loadPosition)
			.then(() => {
				if (this.clearPreviousAfterLoad)
					this.clearPrevious(loadPosition);
				this.isLoading = false;
			})
			.catch(() => this.isLoading = false);
	}

	clearPrevious(loadPosition: LoadPosition) {
		if (loadPosition === LoadPosition.Before) {
			let last = this.children[this.childElementCount - 1];
			while (last && last.getBoundingClientRect().y > window.innerHeight * 12) {
				last.remove();
				last = this.children[this.childElementCount - 1];
			}
			this.afterData = last["itemId"]
		}
		else if (loadPosition === LoadPosition.After) {
			let first = this.children[0];
			while (first && first.getBoundingClientRect().y < window.innerHeight * -12) {
				first.remove();
				first = this.children[0];
			}
			this.beforeData = first["itemId"];
		}
	}

	async abstract loadMore(loadPosition: LoadPosition): Promise<void>;

	async abstract setSorting(sortingMode): Promise<void>;
}

export enum LoadPosition {
	Before, After
}

export interface FeedItem {
	itemId: string;
}