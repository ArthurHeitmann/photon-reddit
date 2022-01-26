import ViewsStack from "../../../historyState/viewsStack";
import {
	RedditApiObj,
	RedditCommentObj,
	RedditListingObj,
	RedditMessageObj,
	RedditPostData,
	RedditPostObj
} from "../../../types/redditTypes";
import {escHTML, isElementInViewport} from "../../../utils/htmlStatics";
import {hasParams, makeElement, sleep, throttle} from "../../../utils/utils";
import Ph_Comment from "../../comment/comment";
import Ph_Message from "../../message/message";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";
import Ph_Post from "../../post/post";
import Ph_FeedItem from "../feedItem/feedItem";
import RedditListingStream from "./redditListingStream";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {PhEvents} from "../../../types/Events";
import {Ph_ViewState} from "../../viewState/viewState";
import makeFeedHeaderElements from "./feedHeaderElements";


/** Visibility of an item in an infinite scroller (IS) */
enum ItemISVisibility {
	visible, hidden, removed
}

enum RemovedItemPlaceholderPosition {
	top, bottom
}

/** State of an item in an infinite scroller (IS) */
interface ItemISState {
	element: Ph_FeedItem,
	visibility: ItemISVisibility,
	removedPlaceholderPosition?: RemovedItemPlaceholderPosition,
	removedPlaceholderHeight?: number,
	postMarkAsSeenTimeout?: any
}

/**
 * An infinite scroller (IS) for reddit things (posts, comments, messages).
 *
 * IS basic logic: Only minimal amount of items is kept in the DOM. Items have 3 visibility stages.
 * Initially they normally visible. Once they are more than 1 screen height away from the viewport they are hidden.
 * If they are more than 2 screen heights away from the viewport, they get removed from the DOM. To compensate for
 * the missing items' height, its height is added to a placeholder element.
 * The visibility state changes are detected with an IntersectionObservers.
 */
export default class Ph_UniversalFeed extends Ph_PhotonBaseElement {
	requestUrl: string;
	/** Loads more and more reddit things from an url (like /r/all) */
	private listingStream: RedditListingStream;

	/** Triggers once for posts if they are (almost) visible to initialize them. */
	private postInitIntObs: IntersectionObserver;
	/** Triggers for posts if they visible and marks them as read */
	private postSeenIntObs: IntersectionObserver;

	// infinite scroller stuff
	/** List of all item ids to avoid duplicates */
	private allLoadedIds: Set<string> = new Set();
	private allItems: ItemISState[] = [];
	private visToHidIntObs: IntersectionObserver;
	private hidToVisIntObs: IntersectionObserver;
	private hidToRemIntObs: IntersectionObserver;
	private remToHidIntObs: IntersectionObserver;
	private topPlaceholder: HTMLElement;
	private bottomPlaceholder: HTMLElement;
	private topPlaceholderHeight = 0;
	private bottomPlaceholderHeight = 0;

	constructor(items: RedditListingObj<RedditApiObj>, requestUrl: string) {
		super();
		if (!hasParams(arguments)) return;

		this.requestUrl = requestUrl;
		this.classList.add("universalFeed");
		this.addEventListener("click", this.onBackAreaClick.bind(this));

		this.topPlaceholder = makeElement("div", { class: "itemPlaceholder" });
		this.bottomPlaceholder = makeElement("div", { class: "itemPlaceholder" });
		this.topPlaceholder.addEventListener("mousemove", this.forceOnRemToHid.bind(this));
		this.topPlaceholder.addEventListener("mouseenter", this.forceOnRemToHid.bind(this));
		this.bottomPlaceholder.addEventListener("mousemove", this.forceOnRemToHid.bind(this));
		this.bottomPlaceholder.addEventListener("mouseenter", this.forceOnRemToHid.bind(this));
		this.append(this.topPlaceholder)
		this.append(this.bottomPlaceholder);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.top);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);

		this.initializeIntersectionObservers();
		this.addWindowEventListener("resize", this.onResize.bind(this));
		const screenHeight = window.innerHeight;
		this.postInitIntObs =  new IntersectionObserver(
			this.onPostInit.bind(this),
			{
				threshold: [0.1],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.postSeenIntObs =  new IntersectionObserver(
			this.onPostSeen.bind(this),
			{
				threshold: [0.4],
				rootMargin: `0px 0px 0px 0px`
			}
		);

		this.listingStream = new RedditListingStream();
		this.listingStream.onNewItems = this.onNewItemsLoaded.bind(this);
		this.listingStream.onItemsCleared = this.onItemsCleared.bind(this);
		this.listingStream.onLoadingChange = this.onLoadingStateChange.bind(this);
		this.listingStream.onUrlChange = this.onUrlChange.bind(this);
		this.listingStream.init(requestUrl, items);

		const onScrollRef = throttle(this.onScroll.bind(this), 750);
		this.addEventListener("wheel", onScrollRef, { passive: true });
		this.addEventListener("touchmove", onScrollRef, { passive: true });
		this.addWindowEventListener("scroll", onScrollRef, { passive: true });
		this.addEventListener(PhEvents.removed, () => window.removeEventListener("scroll", onScrollRef));

		this.addEventListener(PhEvents.added, () => {
				Ph_ViewState.getViewOf(this).setHeaderElements(makeFeedHeaderElements(this.requestUrl, this.listingStream));
		}, { once: true });
	}

	private onPostInit(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			if (entry.intersectionRatio < 0.1)
				continue;
			const post = entry.target as Ph_Post;
			post.initPostBody();
			this.postInitIntObs.unobserve(entry.target);
		}
	}

	private onPostSeen(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const post = entry.target as Ph_Post;
			const item = this.allItems.find(item => item.element === post);
			if (entry.intersectionRatio >= 0.4) {
				post.onIsOnScreen();
				if (!Users.global.d.photonSettings.markSeenPosts || Users.global.hasPostsBeenSeen(post.data.name))
					return;
				item.postMarkAsSeenTimeout = setTimeout(() => {
					Users.global.markPostAsSeen(post.data.name);
				}, 500);
			}
			else {
				post.onIsOffScreen();
				if (item.postMarkAsSeenTimeout)
					clearTimeout(item.postMarkAsSeenTimeout);
			}
		}
	}

	private onNewItemsLoaded(items: RedditApiObj[]) {
		for (const item of items) {
			try {
				if (item.kind === "t3" && this.allLoadedIds.has((item.data as RedditPostData).name))
					continue;
				const itemElement = this.makeFeedItem(item, items.length);
				this.allLoadedIds.add(itemElement.itemId);
				const itemIsState: ItemISState = {
					element: itemElement,
					visibility: ItemISVisibility.visible
				};
				this.allItems.push(itemIsState);
				if (Math.round(Math.abs(this.bottomPlaceholderHeight)) < 10) {
					this.bottomPlaceholder.previousSibling.after(itemElement);
					this.observeItem(itemIsState);
				}
				else {
					this.bottomPlaceholder.after(itemElement);
					const elementHeight = itemElement.offsetHeight + 25;
					this.bottomPlaceholderHeight += elementHeight;
					this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);
					itemElement.remove();
					itemIsState.visibility = ItemISVisibility.removed;
					itemIsState.removedPlaceholderPosition = RemovedItemPlaceholderPosition.bottom;
					itemIsState.removedPlaceholderHeight = elementHeight;
				}
			} catch (e) {
				console.error(e);
				new Ph_Toast(Level.error, "Error making feed item");
			}
		}

		this.checkIfEnoughPostsVisible();
	}

	private onItemsCleared() {
		for (const item of this.allItems) {
			this.visToHidIntObs.unobserve(item.element);
			this.hidToVisIntObs.unobserve(item.element);
			this.hidToRemIntObs.unobserve(item.element);
			this.remToHidIntObs.unobserve(item.element);
			this.postSeenIntObs.unobserve(item.element);
			this.postInitIntObs.unobserve(item.element);
			if (item.postMarkAsSeenTimeout)
				clearTimeout(item.postMarkAsSeenTimeout)
			item.element.isCleanupProtected = false;
			item.element.remove();
		}
		this.allItems = [];
		this.allLoadedIds.clear();
		this.topPlaceholderHeight = 0;
		this.bottomPlaceholderHeight = 0;
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.top);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);
		document.scrollingElement.scrollTo(0, 0);
	}

	private onUrlChange(newUrl: string) {
		this.requestUrl = newUrl;
	}

	private async checkIfEnoughPostsVisible() {
		await sleep(500);
		if (this.listingStream.hasReachedEnd())
			return;
		if (this.childElementCount === 0)
			return;
		if (this.scrollHeight > window.innerHeight)
			return;
		if (Ph_ViewState.getViewOf(this).classList.contains("hide"))
			return;
		new Ph_Toast(
			Level.warning,
			"Not enough posts visible. Try to load more?",
			{
				timeout: 2500,
				groupId: `notEnoughPosts_${this.requestUrl}`,
				onConfirm: () => this.listingStream.loadMore()
			}
		);
	}

	private onLoadingStateChange(isLoading: boolean) {
		this.classList.toggle("isLoading", isLoading);
	}

	/** On scroll check if close to end of feed. If yes, load more items from listingStream */
	private onScroll() {
		if (!this.isVisible())
			return;
		const distanceToBottom = document.scrollingElement.scrollHeight - document.scrollingElement.scrollTop - window.innerHeight;
		if (distanceToBottom < window.innerHeight * 1.5)
			this.listingStream.loadMore();
	}

	/** Reinitialize IntersectionObservers on resize, because they should be relative to the screen height, but are
	 * constructed with pixels. */
	private onResize() {
		if (!this.isVisible())
			return;
		this.initializeIntersectionObservers();
	}

	// item visibility logic

	private isVisible() {
		return this.isConnected && !Ph_ViewState.getViewOf(this).classList.contains("hide");
	}

	/** Construct IS related IntersectionObservers relative to screen height and observe feed items. */
	private initializeIntersectionObservers() {
		const screenHeight = window.innerHeight;

		this.visToHidIntObs?.disconnect();
		this.visToHidIntObs = new IntersectionObserver(
			this.onVisToHid.bind(this),
			{
				threshold: [0],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.hidToVisIntObs?.disconnect();
		this.hidToVisIntObs = new IntersectionObserver(
			this.onHidToVis.bind(this),
			{
				threshold: [0, 0.8],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.hidToRemIntObs?.disconnect();
		this.hidToRemIntObs = new IntersectionObserver(
			this.onHidToRem.bind(this),
			{
				threshold: [0],
				rootMargin: `${screenHeight * 2 + 50}px 0px ${screenHeight * 2 + 50}px 0px`
			}
		);
		this.remToHidIntObs?.disconnect();
		this.remToHidIntObs = new IntersectionObserver(
			this.onRemToHid.bind(this),
			{
				threshold: Array(5).fill(0).map((_, i) => i * 0.1),
				rootMargin: `${screenHeight * 2}px 0px ${screenHeight * 2}px 0px`
			}
		);

		for (const item of this.allItems)
			this.observeItem(item);
		this.remToHidIntObs.observe(this.topPlaceholder);
		this.remToHidIntObs.observe(this.bottomPlaceholder);
	}

	private observeItem(item: ItemISState) {
		switch (item.visibility) {
			case ItemISVisibility.visible:
				this.visToHidIntObs.observe(item.element);
				break;
			case ItemISVisibility.hidden:
				this.hidToRemIntObs.observe(item.element);
				this.hidToVisIntObs.observe(item.element);
				break;
		}
	}

	private updatePlaceholderHeight(position: RemovedItemPlaceholderPosition) {
		if (position === RemovedItemPlaceholderPosition.top)
			this.topPlaceholder.style.setProperty("--height", `${this.topPlaceholderHeight.toFixed(2)}px`)
		else if (position === RemovedItemPlaceholderPosition.bottom)
			this.bottomPlaceholder.style.setProperty("--height", `${this.bottomPlaceholderHeight.toFixed(2)}px`)
		else
			throw "impossible!"
	}

	/** If an items is more than 1 screen height away from the viewport, it is hidden and hid --> X observers are applied */
	private onVisToHid(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't outside of bounds
			if (
				!(entry.intersectionRatio === 0 && !entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width && isElementInViewport(entry.target)
			) {
				continue;
			}

			// update state (hide the element)
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.hidden;
					element.classList.add("isHidden");

					// update observers for new bounds
					this.visToHidIntObs.unobserve(element);
					this.hidToVisIntObs.observe(element);
					this.hidToRemIntObs.observe(element);
				}
			)

		}
	}

	/** If an items is less than 1 screen height away from the viewport, it is visible and vis --> X observers are applied */
	private onHidToVis(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't inside of bounds
			if (
				!(entry.intersectionRatio > 0 && entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width
			) {
				continue;
			}

			// update state (show the element)
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.visible;
					element.classList.remove("isHidden");

					// update observers for new bounds
					this.hidToVisIntObs.unobserve(element);
					this.hidToRemIntObs.unobserve(element);
					this.visToHidIntObs.observe(element);
				}
			)
		}
	}

	/** If an items is more than 2 screen height away from the viewport, it is removed from the DOM,
	 * and it's height is added to a placeholder element. No observers are applied. Observers are already applied to placeholders. */
	private onHidToRem(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't inside of bounds
			if (
				!(entry.intersectionRatio === 0 && !entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width
			) {
				continue;
			}

			// determine placeholder position to which the items' height will be added
			const placeholderPosition = entry.boundingClientRect.top > 0
				? RemovedItemPlaceholderPosition.bottom
				: RemovedItemPlaceholderPosition.top;
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					const itemHeight = this.getItemHeight(element);
					itemState.removedPlaceholderHeight = itemHeight;
					itemState.removedPlaceholderPosition = placeholderPosition;
					if (placeholderPosition === RemovedItemPlaceholderPosition.top)
						this.topPlaceholderHeight += itemHeight;
					else
						this.bottomPlaceholderHeight += itemHeight;
					this.updatePlaceholderHeight(placeholderPosition)

					itemState.visibility = ItemISVisibility.removed;
					element.remove();
					element.classList.remove("isHidden");

					this.hidToVisIntObs.unobserve(element);
					this.hidToRemIntObs.unobserve(element);
				}
			)
		}
	}

	/** If a placeholder is less than 2 screen height away from the viewport, items are added back to the DOM and their
	 * old height is removed from the placeholder. And hid --> X observers are applied */
	private onRemToHid(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		const entry = entries[0];
		// continue if item isn't inside of bounds
		if (
			!(entry.intersectionRatio > 0 && entry.isIntersecting) ||
			entry.boundingClientRect.height === 0
		) {
			return;
		}

		const placeholderPosition = entry.target === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	/** IntersectionObservers are sometimes unreliable, therefore force transition on certain events */
	private forceOnRemToHid(e: InputEvent) {
		const placeholderPosition = e.currentTarget === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	/** Items are added back to the DOM and its old height is removed from the placeholder, until the placeholder is
	 * more than 2 screen heights away. And hid --> X observers are applied */
	private popPlaceholderItems(postion: RemovedItemPlaceholderPosition) {
		const placeholder = postion === RemovedItemPlaceholderPosition.top
			? this.topPlaceholder
			: this.bottomPlaceholder;

		let shouldDoNextRun = true;
		// do while placeholder is less than 2 screen heights away
		do {
			const itemIndex = postion === RemovedItemPlaceholderPosition.top
				// last item in top placeholder
				? this.allItems.length - 1 - this.allItems.slice().reverse().findIndex(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
				// first item in bottom placeholder
				: this.allItems.findIndex(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.bottom);
			if (itemIndex === -1)
				return;

			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.hidden;
					// If items height is 0 when removing and > 0 when adding back, and it's in the top placeholder
					// the scroll position will jump around in firefox, so it needs to be compensated
					const shouldTryFixScroll = postion === RemovedItemPlaceholderPosition.top && itemState.removedPlaceholderHeight === 0;
					const beforeTopScroll = document.scrollingElement.scrollTop;

					if (itemState.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
						this.topPlaceholderHeight -= itemState.removedPlaceholderHeight;
					else
						this.bottomPlaceholderHeight -= itemState.removedPlaceholderHeight;
					this.updatePlaceholderHeight(itemState.removedPlaceholderPosition)
					delete itemState.removedPlaceholderPosition;
					delete itemState.removedPlaceholderHeight;
					element.classList.add("isHidden");
					if (postion === RemovedItemPlaceholderPosition.top)
						placeholder.after(element);
					else
						placeholder.before(element);

					if (shouldTryFixScroll) {
						// if needed, scroll by height/scroll difference
						const newHeight = this.getItemHeight(element);
						const scrollDiff = document.scrollingElement.scrollTop - beforeTopScroll;
						if (newHeight > 0 && Math.abs(newHeight - scrollDiff) > 10)
							document.scrollingElement.scrollBy(0, newHeight - scrollDiff);
					}

					this.hidToVisIntObs.observe(element);
					this.hidToRemIntObs.observe(element);
				},
				true
			)
			// re-trigger observer and see if it's still intersecting
			this.remToHidIntObs.unobserve(placeholder);
			this.remToHidIntObs.observe(placeholder);
			const newEntries = this.remToHidIntObs.takeRecords();
			shouldDoNextRun = newEntries.length > 0;
		} while (shouldDoNextRun);
	}

	private getItemHeight(element: HTMLElement): number {
		let itemHeight = element.offsetHeight;
		if (itemHeight > 0) {
			const itemStyle = getComputedStyle(element);
			itemHeight += parseFloat(itemStyle.marginTop) + parseFloat(itemStyle.marginBottom);
		}
		return Math.round(itemHeight);
	}

	/** Apply state transition function to item and its hidden (display: none, because of settings like hide nsfw, hide seen, filters)
	 * neighbours. Transition is applied to hidden items, because they otherwise don't interact with the intersection observers. */
	private changeStateForItemAndHiddenNeighbours(
		itemIndex: number,
		changeState: (itemState: ItemISState, element: HTMLElement) => void,
		isReversed = false
	) {
		const sameVisibility = this.allItems[itemIndex].visibility;
		let firstI = itemIndex;
		while (this.isItemHiddenNeighbour(firstI - 1, sameVisibility))
			firstI--;
		let lastI = itemIndex;
		while (this.isItemHiddenNeighbour(lastI + 1, sameVisibility))
			lastI++;

		if (isReversed) {
			for (let i = lastI; i >= firstI; i--)
				changeState(this.allItems[i], this.allItems[i].element);
		}
		else {
			for (let i = firstI; i < lastI + 1; i++)
				changeState(this.allItems[i], this.allItems[i].element);
		}
	}

	private isItemHiddenNeighbour(index: number, targetVisibility: ItemISVisibility): boolean {
		return this.allItems[index]?.visibility === targetVisibility && (
			this.allItems[index]?.element.classList.contains("remove") ||
			this.allItems[index]?.removedPlaceholderHeight < 1
		);
	}

	private makeFeedItem(itemData: RedditApiObj, totalItemCount: number): Ph_FeedItem {
		switch (itemData.kind) {
			case "t3":
				const post = new Ph_Post(itemData as RedditPostObj, true, this.requestUrl);
				this.postInitIntObs.observe(post);
				this.postSeenIntObs.observe(post);
				return post;
			case "t1":
				return new Ph_Comment(itemData as RedditCommentObj, false, true);
			case "t4":
				return new Ph_Message(itemData as RedditMessageObj, totalItemCount !== 1);
			default:
				new Ph_Toast(Level.error, `Unknown feed item "${escHTML(itemData.kind)}"`);
				throw `What is this feed item? ${JSON.stringify(itemData, null, 4)}`;
		}
	}

	private onBackAreaClick(e: MouseEvent) {
		if (!Users.global.d.photonSettings.emptyAreaClickGoesBack)
			return;
		if (e.currentTarget !== e.target || !ViewsStack.hasPreviousLoaded())
			return;
		const style = getComputedStyle(this);
		const paddingLeft = parseInt(style.paddingLeft);
		const paddingRight = parseInt(style.paddingRight);
		if (e.clientX + 25 > paddingLeft && e.clientX - 25 < window.innerWidth - paddingRight)
			return;
		history.back();
	}

	cleanup() {
		for (const item of this.allItems) {
			item.element.isCleanupProtected = false;
			item.element.cleanup();
		}
		super.cleanup();
	}
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
