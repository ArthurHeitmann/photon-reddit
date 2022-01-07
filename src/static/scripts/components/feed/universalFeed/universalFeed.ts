import ViewsStack from "../../../historyState/viewsStack";
import {
	RedditApiObj,
	RedditCommentObj,
	RedditListingObj,
	RedditMessageObj,
	RedditPostObj
} from "../../../types/redditTypes";
import {escHTML, isElementInViewport} from "../../../utils/htmlStatics";
import {hasParams, makeElement, throttle} from "../../../utils/utils";
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
	removedPlaceholderHeight?: number
}

/**
 * A list of reddit things (can be posts, comments, messages)
 *  - can be sorted
 *  - automatically loads more (and unloads old) when scrolling to the end
 */
export default class Ph_UniversalFeed extends Ph_PhotonBaseElement {
	requestUrl: string;
	private allPostFullNames: string[] = [];
	private listingStream: RedditListingStream;

	// infinite scroller stuff
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
		window.addEventListener("resize", this.initializeIntersectionObservers.bind(this));

		this.listingStream = new RedditListingStream();
		this.listingStream.onNewItems = this.onNewItemsLoaded.bind(this);
		this.listingStream.onLoadingChange = this.onLoadingStateChange.bind(this);
		this.listingStream.init(requestUrl, items);

		const onScrollRef = throttle(this.onScroll.bind(this), 750);
		this.addEventListener("wheel", onScrollRef, { passive: true });
		this.addEventListener("touchmove", onScrollRef, { passive: true });
		window.addEventListener("scroll", onScrollRef, { passive: true });
		this.addEventListener(PhEvents.removed, () => window.removeEventListener("scroll", onScrollRef));
	}

	private onNewItemsLoaded(items: RedditApiObj[]) {
		console.time("new added");
		for (const item of items) {
			try {
				const itemElement = this.makeFeedItem(item, items.length);
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
		console.timeEnd("new added");
	}

	private onLoadingStateChange(isLoading: boolean) {
		this.classList.toggle("isLoading", isLoading);
	}

	private onScroll() {
		if (!this.isVisible())
			return;
		const distanceToBottom = document.scrollingElement.scrollHeight - document.scrollingElement.scrollTop - window.innerHeight;
		if (distanceToBottom < window.innerHeight * 1.5)
			this.listingStream.loadMore();
	}

	// item visibility logic

	private isVisible() {
		return this.isConnected && !Ph_ViewState.getViewOf(this).classList.contains("hide");
	}

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

			const element = entry.target as HTMLElement;

			// update state (hide the element)
			this.allItems.find(item => item.element === element).visibility = ItemISVisibility.hidden;
			element.classList.add("isHidden");

			// update observers for new bounds
			this.visToHidIntObs.unobserve(element);
			this.hidToVisIntObs.observe(element);
			this.hidToRemIntObs.observe(element);

		}
	}

	private onHidToVis(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't inside of bounds
			if (!(entry.intersectionRatio > 0 && entry.isIntersecting) || !entry.boundingClientRect.height && !entry.boundingClientRect.width)
				continue;

			const element = entry.target as HTMLElement;

			// update state (show the element)
			this.allItems.find(item => item.element === element).visibility = ItemISVisibility.visible;
			element.classList.remove("isHidden");

			// update observers for new bounds
			this.hidToVisIntObs.unobserve(element);
			this.hidToRemIntObs.unobserve(element);
			this.visToHidIntObs.observe(element);
		}
	}

	private onHidToRem(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			if (!(entry.intersectionRatio === 0 && !entry.isIntersecting) || !entry.boundingClientRect.height && !entry.boundingClientRect.width)
				continue;

			const element = entry.target as HTMLElement;
			const itemState = this.allItems.find(item => item.element === element);

			const itemStyle = getComputedStyle(element);
			const itemHeight = Math.round(entry.boundingClientRect.height + parseFloat(itemStyle.marginTop) + parseFloat(itemStyle.marginBottom));
			const placeholderPosition = entry.boundingClientRect.top > 0
				? RemovedItemPlaceholderPosition.bottom
				: RemovedItemPlaceholderPosition.top;
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
	}

	private onRemToHid(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		const entry = entries[0];
		if (!(entry.intersectionRatio > 0 && entry.isIntersecting) || entry.boundingClientRect.height === 0)
			return;

		const placeholderPosition = entry.target === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	private forceOnRemToHid(e: InputEvent) {
		const placeholderPosition = e.currentTarget === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	private popPlaceholderItems(postion: RemovedItemPlaceholderPosition) {
		const placeholder = postion === RemovedItemPlaceholderPosition.top
			? this.topPlaceholder
			: this.bottomPlaceholder;

		let shouldDoNextRun = true;
		do {
			const itemState = postion === RemovedItemPlaceholderPosition.top
				? this.allItems.slice().reverse().find(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
				: this.allItems.find(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.bottom);
			if (!itemState)
				return;
			const element = itemState.element;

			itemState.visibility = ItemISVisibility.hidden;
			if (itemState.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
				this.topPlaceholderHeight -= itemState.removedPlaceholderHeight;
			else
				this.bottomPlaceholderHeight -= itemState.removedPlaceholderHeight;
			this.updatePlaceholderHeight(itemState.removedPlaceholderPosition)
			itemState.removedPlaceholderPosition = undefined;
			itemState.removedPlaceholderHeight = undefined;
			element.classList.add("isHidden");
			if (postion === RemovedItemPlaceholderPosition.top)
				placeholder.after(element);
			else
				placeholder.before(element);

			this.hidToVisIntObs.observe(element);
			this.hidToRemIntObs.observe(element);
			shouldDoNextRun = false;
			this.remToHidIntObs.unobserve(placeholder);
			this.remToHidIntObs.observe(placeholder);
			const newEntries = this.remToHidIntObs.takeRecords();
			if (newEntries.length > 0) {
				shouldDoNextRun = true;
			}
		} while (shouldDoNextRun);
	}

	makeFeedItem(itemData: RedditApiObj, totalItemCount: number): Ph_FeedItem {
		switch (itemData.kind) {
			case "t3":
				const post = new Ph_Post(itemData as RedditPostObj, true, this.requestUrl);
				if (!this.allPostFullNames.includes(post.data.name))
					this.allPostFullNames.push(post.data.name);
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

	onBackAreaClick(e: MouseEvent) {
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
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
