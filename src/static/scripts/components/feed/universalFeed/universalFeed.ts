import ViewsStack from "../../../historyState/viewsStack";
import {
	RedditApiObj,
	RedditCommentObj,
	RedditListingObj,
	RedditMessageObj,
	RedditPostData,
	RedditPostObj
} from "../../../types/redditTypes";
import {hasParams, sleep, throttle} from "../../../utils/utils";
import Ph_Comment from "../../comment/comment";
import Ph_Message from "../../message/message";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";
import Ph_Post from "../../post/post";
import Ph_FeedItem from "../feedItem/feedItem";
import RedditListingStream from "./redditListingStream";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {PhEvents} from "../../../types/Events";
import {Ph_ViewState} from "../../viewState/viewState";
import makeFeedHeaderElements from "./feedHeaderElements";
import PostsFocusStack from "./postsFocusStack";
import UniversalFeedView from "./universalFeedViews/universalFeedView";
import Ph_MultiColumnView from "./universalFeedViews/multiColumnView";
import {FeedDisplayType, PhotonSettings} from "../../global/photonSettings/settingsConfig";
import Ph_IndividualPostScroller from "./universalFeedViews/individualPostScroller";

interface FeedItemData {
	element: Ph_FeedItem;
	postMarkAsSeenTimeout?: any;
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
	private feedView: UniversalFeedView;

	/** Triggers once for posts if they are (almost) visible to initialize them. */
	private postInitIntObs: IntersectionObserver;
	/** Triggers for posts if they visible and marks them as read */
	private postSeenIntObs: IntersectionObserver;
	private postsFocusStack: PostsFocusStack;

	/** List of all item ids to avoid duplicates */
	private allLoadedIds: Set<string> = new Set();
	private allItems: FeedItemData[] = [];

	constructor(items: RedditListingObj<RedditApiObj>, requestUrl: string) {
		super();
		if (!hasParams(arguments)) return;

		this.requestUrl = requestUrl;
		this.classList.add("universalFeed");

		this.updateFeedViewType();

		const screenHeight = window.innerHeight;
		this.postInitIntObs = new IntersectionObserver(
			this.onPostInit.bind(this),
			{
				threshold: [0.1],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.postSeenIntObs = new IntersectionObserver(
			this.onPostSeen.bind(this),
			{
				threshold: [0.4],
				rootMargin: `0px 0px 0px 0px`
			}
		);
		this.postsFocusStack = new PostsFocusStack();

		this.listingStream = new RedditListingStream();
		this.listingStream.onNewItems = this.onNewItemsLoaded.bind(this);
		this.listingStream.onItemsCleared = this.onItemsCleared.bind(this);
		this.listingStream.onLoadingChange = this.onLoadingStateChange.bind(this);
		this.listingStream.onUrlChange = this.onUrlChange.bind(this);

		const onScrollRef = throttle(this.onScroll.bind(this), 750);
		this.addEventListener("wheel", onScrollRef, { passive: true });
		this.addEventListener("touchmove", onScrollRef, { passive: true });
		this.addWindowEventListener("scroll", onScrollRef, { passive: true });
		this.addEventListener(PhEvents.removed, () => window.removeEventListener("scroll", onScrollRef));
		this.addWindowEventListener("resize", this.onResize.bind(this));
		this.addWindowEventListener(PhEvents.settingsChanged, (e: CustomEvent) => {
			const changed = e.detail as PhotonSettings;
			this.onSettingsChanged(changed);
		});

		this.addEventListener(PhEvents.added, () => {
			this.listingStream.init(requestUrl, items);
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
				this.postsFocusStack.push(post);
				if (!Users.global.d.photonSettings.markSeenPosts || Users.global.hasPostsBeenSeen(post.data.name))
					return;
				item.postMarkAsSeenTimeout = setTimeout(() => {
					Users.global.markPostAsSeen(post.data.name);
				}, 500);
			}
			else {
				this.postsFocusStack.pop(post);
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
				this.allItems.push({ element: itemElement });

				this.feedView.addElement(itemElement);
			} catch (e) {
				console.error(e);
				new Ph_Toast(Level.error, "Error making feed item");
			}
		}

		this.checkIfEnoughPostsVisible();
	}

	private onItemsCleared() {
		for (const item of this.allItems) {
			this.postSeenIntObs.unobserve(item.element);
			this.postInitIntObs.unobserve(item.element);
			if (item.postMarkAsSeenTimeout)
				clearTimeout(item.postMarkAsSeenTimeout)
			item.element.isCleanupProtected = false;
		}
		this.allLoadedIds.clear();
		this.feedView.clear();
		document.scrollingElement.scrollTo(0, 0);
	}

	private updateFeedViewType() {
		switch (Users.global.d.photonSettings.feedDisplayType) {
			case FeedDisplayType.cards:
			case FeedDisplayType.compact:
			case FeedDisplayType.grid:
			case FeedDisplayType.gridCompact:
				const isSingleColumn = Users.global.d.photonSettings.feedDisplayType === FeedDisplayType.cards || Users.global.d.photonSettings.feedDisplayType === FeedDisplayType.compact;
				if (this.feedView instanceof Ph_IndividualPostScroller)
					Ph_ViewState.getViewOf(this).setHeaderElements(makeFeedHeaderElements(this.requestUrl, this.listingStream));
				if (this.feedView instanceof Ph_MultiColumnView)
					this.feedView.setIsSingleColumn(isSingleColumn);
				else {
					const oldView = this.feedView;
					this.feedView = new Ph_MultiColumnView(isSingleColumn);
					if (oldView) {
						this.feedView.fromOtherView(oldView);
						oldView.remove();
					}
					this.append(this.feedView)
				}
				break;
			case FeedDisplayType.individual:
				if (!(this.feedView instanceof Ph_IndividualPostScroller)) {
					const oldView = this.feedView;
					this.feedView = new Ph_IndividualPostScroller();
					if (oldView) {
						this.feedView.fromOtherView(oldView);
						oldView.remove();
					}
					this.append(this.feedView)
				}
				break;
		}

		if (!this.feedView.loadMoreCallback)
			this.feedView.loadMoreCallback = () => this.listingStream.loadMore();
		if (!this.feedView.onBackAreaClickCallback)
			this.feedView.onBackAreaClickCallback = this.onBackAreaClick.bind(this);
	}

	private onSettingsChanged(changed: PhotonSettings) {
		if (
			"feedDisplayType" in changed ||
			this.feedView instanceof Ph_MultiColumnView && this.feedView.columnCount > 1 && "feedWidth" in changed
		)
			this.updateFeedViewType();
	}

	private onResize() {
		this.feedView?.onResize();
	}

	private onUrlChange(newUrl: string) {
		this.requestUrl = newUrl;
	}

	private async checkIfEnoughPostsVisible() {
		await sleep(500);
		if (this.listingStream.hasReachedEnd())
			return;
		if (this.feedView.getElements().length === 0)
			return;
		if (this.scrollHeight > window.innerHeight)
			return;
		if (this.feedView instanceof Ph_IndividualPostScroller)
			return;
		if (Ph_ViewState.getViewOf(this).classList.contains("hide"))
			return;
		new Ph_Toast(
			Level.warning,
			"Not enough posts visible. Try to load more?",
			{
				timeout: 3500,
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
		this.feedView.onScroll();
	}

	private isVisible() {
		return this.isConnected && !Ph_ViewState.getViewOf(this).classList.contains("hide");
	}

	private makeFeedItem(itemData: RedditApiObj, totalItemCount: number): Ph_FeedItem {
		switch (itemData.kind) {
			case "t3":
				const post = new Ph_Post(itemData as RedditPostObj, { isInFeed: true, feedUrl: this.requestUrl});
				this.postInitIntObs.observe(post);
				this.postSeenIntObs.observe(post);
				return post;
			case "t1":
				return new Ph_Comment(itemData as RedditCommentObj, false, true);
			case "t4":
				return new Ph_Message(itemData as RedditMessageObj, totalItemCount !== 1);
			default:
				new Ph_Toast(Level.error, `Unknown feed item "${itemData.kind}"`);
				throw `What is this feed item? ${JSON.stringify(itemData, null, 4)}`;
		}
	}

	private onBackAreaClick() {
		if (!Users.global.d.photonSettings.emptyAreaClickGoesBack)
			return;
		if (!ViewsStack.hasPreviousLoaded())
			return;
		history.back();
	}

	cleanup() {
		for (const item of this.allItems) {
			item.element.isCleanupProtected = false;
			item.element.cleanup();
		}
		this.postsFocusStack.clear();
		super.cleanup();
	}
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
