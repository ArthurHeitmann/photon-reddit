import ViewsStack from "../../../historyState/viewsStack";
import {
	RedditApiObj,
	RedditCommentObj,
	RedditListingObj,
	RedditMessageObj,
	RedditPostObj
} from "../../../types/redditTypes";
import {escHTML} from "../../../utils/htmlStatics";
import {hasParams} from "../../../utils/utils";
import Ph_Comment from "../../comment/comment";
import Ph_Message from "../../message/message";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";
import Ph_Post from "../../post/post";
import Ph_FeedItem from "../feedItem/feedItem";
import Ph_FeedItemPlaceholder from "../feedItem/feedItemPlaceholder";

export enum MessageSection {
	all = "inbox",
	unread = "unread",
	messages = "messages",
	commentReplies = "comments",
	postReplies = "selfreply",
	mentions = "mentions",
	sent = "sent"
}

/**
 * A list of reddit things (can be posts, comments, messages)
 *  - can be sorted
 *  - automatically loads more (and unloads old) when scrolling to the end
 */
export default class Ph_UniversalFeed extends HTMLElement {
	// absoluteFirst: string = null;
	// beforeData: string = null;
	// afterData: string = null;
	// isLoading: boolean = false;
	requestUrl: string;
	// hasReachedEndOfFeed = false;
	// isSearchFeed = false;
	private allPostFullNames: string[] = [];
	// private currentlyVisibleItem: Ph_FeedItem;
	// private currentlyVisibleItemScrollTop: number;
	// private lastWindowSize = [window.innerWidth, window.innerHeight]

	constructor(items: RedditListingObj<RedditApiObj>, requestUrl: string) {
		super();
		if (!hasParams(arguments)) return;

		this.requestUrl = requestUrl;
		this.classList.add("universalFeed");

		for (const itemData of items.data.children) {
			try {
				const itemElement = this.makeFeedItem(itemData, items.data.children.length);
				new Ph_FeedItemPlaceholder(itemElement);
				this.append(itemElement);
			} catch (e) {
				console.error(e);
				new Ph_Toast(Level.error, "Error making feed item");
			}
		}

		// this.beforeData = posts.data.before;
		// this.afterData = posts.data.after;
		// if (this.afterData === null)
		// 	this.hasReachedEndOfFeed = true;
		// this.requestUrl = requestUrl;
		//
		// const scrollChecker = throttle(this.onScroll.bind(this), 1000);
		// this.addEventListener("wheel", scrollChecker, { passive: true });
		// this.addEventListener("touchmove", scrollChecker, { passive: true });
		// (new ResizeObserver(this.onResize.bind(this))).observe(this);
		// this.addEventListener("click", this.onBackAreaClick.bind(this));
		//
		// // find first FeedItem, once it has been added
		// const observer = new MutationObserver((mutationsList: MutationRecord[], observer) => {
		// 	for (const mutation of mutationsList) {
		// 		for (const addedNode of mutation.addedNodes as NodeListOf<Ph_FeedItem>) {
		// 			if (addedNode.itemId) {
		// 				this.absoluteFirst = addedNode.itemId;
		// 				this.currentlyVisibleItem = addedNode;
		// 				this.currentlyVisibleItemScrollTop = addedNode.getBoundingClientRect().top;
		// 				observer.disconnect();
		// 				return;
		// 			}
		// 		}
		// 	}
		// });
		// observer.observe(this, { childList: true });
		//
		// this.classList.add("universalFeed");
		// if (/\/search\/?(\?.*)?$/i.test(requestUrl))
		// 	this.isSearchFeed = true;
		//
		// // make feed specific header elements
		// setTimeout(() => {
		// 	const headerElements = [];
		// 	const title = document.createElement("div");
		// 	title.className = "feedTitle";
		// 	let feedType: FeedType = FeedType.misc;
		// 	let feedBaseUrl = requestUrl;
		// 	if (/^\/?(\?.*)?$/.test(requestUrl) || new RegExp(`^/r/(${fakeSubreddits.join("|")})($|/|\\?|#)`, "i").test(requestUrl)) {	// home page or special subreddit
		// 		feedType = FeedType.misc;
		// 	}
		// 	else if (/^\/r\/[^/]+/i.test(requestUrl)) {								// subreddit
		// 		title.innerText = requestUrl.match(/r\/[^/?#]+/i)[0];		// /r/all/top --> r/all
		// 		feedType = FeedType.subreddit;
		// 		feedBaseUrl = requestUrl.match(/\/r\/[^/?#]+/i)[0];			// /r/all/top --> r/all
		// 	}
		// 	else if (/^\/(u|user)\/[^/]+\/m\/[^/]+/i.test(requestUrl)) {			// multi
		// 		title.innerText = `Multireddit ${requestUrl.match(/\/m\/([^/?#]+)/i)[1]}`;		// /u/user/m/multi --> multi
		// 		feedType = FeedType.multireddit;
		// 		const matches = requestUrl.match(/\/(u|user)\/([^/]+)\/m\/([^/?#]+)/i)
		// 		feedBaseUrl = `/user/${matches[2]}/m/${matches[3]}`;
		// 	}
		// 	else if (/^\/(u|user)\/[^/]+/i.test(requestUrl)) {						// user
		// 		title.innerText = `u/${requestUrl.match(/\/(u|user)\/([^/?#]+)/i)[2]}`;
		// 		feedType = FeedType.user;
		// 		feedBaseUrl = `/user/${requestUrl.match(/\/(u|user)\/([^/?#]+)/i)[2]}`;
		// 	}
		// 	else if (/^\/message\//i.test(requestUrl))
		// 		feedType = FeedType.messages;
		// 	headerElements.push(title);
		// 	if (Ph_FeedInfo.supportedFeedTypes.includes(feedType) && !feedBaseUrl.includes("+"))
		// 		headerElements.push(FeedInfoFactory.getInfoButton(feedType, feedBaseUrl));
		// 	if (feedType === FeedType.user) {
		// 	}
		// 	else if (feedType === FeedType.messages) {
		// 		headerElements.push(...Ph_Message.getMessageFeedHeaderElements(this.setMessageSection.bind(this)));
		// 	}
		// 	if (this.isSearchFeed)
		// 		headerElements.push(new Ph_SearchFeedSorter(this));
		// 	else if (feedType !== FeedType.messages)
		// 		headerElements.push(new Ph_UniversalFeedSorter(this, feedType, feedBaseUrl));
		// 	(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
		// }, 0);
		//
		//
		// for (const postData of posts.data.children) {
		// 	try {
		// 		this.appendChild(this.makeFeedItem(postData, posts.data.children.length));
		// 	}
		// 	catch (e) {
		// 		console.error(e);
		// 		new Ph_Toast(Level.error, `Error making feed item`);
		// 	}
		// }
		// if (posts.data.children.length === 0) {
		// 	this.innerHTML = `<h1>Nothing here</h1>`
		// }
		// this.checkIfFeedEmpty();
	}

	// async setMessageSection(data: DropDownActionData) {
	// 	const section = data.valueChain[0] as MessageSection;
	// 	data.setButtonLabel(getLoadingIcon());
	// 	this.requestUrl = this.requestUrl.replace(/^(\/message)\/[^/#?]*/i, `$1/${section}`);	// /message/<old> --> /message/<new>
	// 	try {
	// 		const sectionItems: RedditListingObj<RedditMessageObj> = await redditApiRequest(
	// 			this.requestUrl,
	// 			[],
	// 			false
	// 		);
	// 		this.beforeData = sectionItems.data.before;
	// 		this.afterData = sectionItems.data.after;
	// 		this.replaceItems(sectionItems.data.children, sectionItems.data.before, sectionItems.data.after);
	// 		ViewsStack.changeCurrentUrl(this.requestUrl);
	// 		data.setButtonLabel(section);
	// 	} catch (e) {
	// 		console.error("Error getting message section items");
	// 		new Ph_Toast(Level.error, "Error getting message section items");
	// 		console.error(e);
	// 		data.setButtonLabel(data.initialLabel);
	// 	}
	// }

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
	//
	// shouldAddFeedItem(itemData: RedditApiObj): boolean {
	// 	return itemData.kind !== "t3" || !this.allPostFullNames.includes((itemData.data as RedditPostData).name);
	// }
	//
	// /**
	//  * If less than N screen heights are left until the end of the feed, load new content
	//  */
	// onScroll(e: Event = undefined, skipEmptyCheck = false) {
	// 	// stop if empty or is loading or for some reason close to empty (normal feed will have very large scrollHeight)
	// 	if (!skipEmptyCheck && (this.children.length <= 0 || this.isLoading || this.scrollHeight < window.innerHeight)) {
	// 		if (this.isLoading || this.hasReachedEndOfFeed || elementWithClassInTree(this.parentElement, "viewState").classList.contains("hide"))
	// 			return;
	// 		new Ph_Toast(
	// 			Level.warning,
	// 			"Not enough posts visible. Try to load more?",
	// 			{ timeout: 2000, onConfirm: () => this.onScroll(undefined, true), groupId: "emptyFeed" }
	// 		);
	// 		return;
	// 	}
	//
	// 	this.storeCurrentlyVisibleItem();
	//
	// 	let last = this.children[this.childElementCount - 1];
	// 	while (last.classList.contains("hide") && last.previousElementSibling)
	// 		last = last.previousElementSibling;
	// 	if (last.getBoundingClientRect().y < window.innerHeight * 2.5 && !this.hasReachedEndOfFeed)
	// 		this.scrollAction(LoadPosition.after);
	// 	let first = this.children[0];
	// 	while (first.classList.contains("hide") && first.nextElementSibling)
	// 		first = first.nextElementSibling
	// 	if (first && first.getBoundingClientRect().y > window.innerHeight * -2.5)
	// 		this.scrollAction(LoadPosition.before);
	// }
	//
	// scrollAction(loadPosition: LoadPosition) {
	// 	if (loadPosition === LoadPosition.before && (this.beforeData === null || this.beforeData === this.absoluteFirst))
	// 		return;
	// 	if (loadPosition === LoadPosition.after && this.afterData === null)
	// 		return;
	//
	// 	this.isLoading = true;
	// 	this.loadMore(loadPosition)
	// 		.then(() => {
	// 			this.clearPrevious(loadPosition);
	// 			this.isLoading = false;
	// 		})
	// 		.catch(() => this.isLoading = false);
	// }
	//
	// clearPrevious(loadPosition: LoadPosition) {
	// 	if (loadPosition === LoadPosition.before) {
	// 		let removeElements: HTMLElement[] = [];
	// 		let next = this.lastElementChild as HTMLElement;
	// 		while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y > window.innerHeight * 7) && this.childElementCount > 1) {
	// 			removeElements.push(next);
	// 			next = next.nextElementSibling as HTMLElement;
	// 		}
	// 		if (removeElements.length === 0)
	// 			return;
	// 		if (removeElements.length === this.childElementCount)
	// 			removeElements = removeElements.slice(1);
	//
	// 		for (const removeElement of removeElements)
	// 			removeElement.remove();
	//
	// 		this.afterData = this.lastElementChild.getAttribute("data-id");
	// 	}
	// 	else if (loadPosition === LoadPosition.after) {
	// 		// first collect all elements that are too far away and should be removed
	// 		const removeElements: Element[] = [];
	// 		let firstVisibleElement = this.children[0];
	// 		while (firstVisibleElement && firstVisibleElement.classList.contains("hide"))
	// 			firstVisibleElement = firstVisibleElement.nextElementSibling;
	// 		let next = this.children[0];
	// 		if (this.childElementCount <= 1)
	// 			next = null;
	// 		let possibleRemoveHidden: Element[] = [];
	// 		while (next && next.classList.contains("hide")) {
	// 			possibleRemoveHidden.push(next);
	// 			next = next.nextElementSibling as Element;
	// 		}
	// 		while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y < window.innerHeight * -5)) {
	// 			removeElements.push(next);
	// 			next = next.nextElementSibling as Element;
	// 		}
	// 		if (removeElements.length === 0)
	// 			return;
	// 		if (removeElements.includes(firstVisibleElement))
	// 			removeElements.splice(0, 0, ...possibleRemoveHidden);
	// 		if (removeElements.length === this.childElementCount)
	// 			removeElements.splice(-1);
	//
	// 		// remove old elements and set scroll position approximately back to where it was before removal
	// 		if (removeElements.length) {
	// 			let firstSafeElement = removeElements[removeElements.length - 1].nextElementSibling;
	// 			while (firstSafeElement && firstSafeElement.classList.contains("hide"))
	// 				firstSafeElement = firstSafeElement.nextElementSibling;
	// 			Ph_ViewState.getViewOf(this).saveScroll(firstSafeElement as HTMLElement);
	// 			for (const elem of removeElements)
	// 				elem.remove();
	// 			Ph_ViewState.getViewOf(this).loadScroll();
	// 		}
	// 		this.beforeData = this.firstElementChild.getAttribute("data-id");
	// 	}
	// }
	//
	// async loadMore(loadPosition) {
	// 	let param: string[];
	// 	if (loadPosition === LoadPosition.after)
	// 		param = ["after",  this.afterData];
	// 	else
	// 		param = ["before", this.beforeData];
	// 	const posts: RedditListingObj<RedditApiObj> = await redditApiRequest(this.requestUrl, [param], false);
	//
	// 	if (await waitForFullScreenExit())
	// 		await sleep(100);
	// 	if (await this.ensureIsVisible())
	// 		await sleep(100);
	//
	// 	if (loadPosition === LoadPosition.after) {
	// 		for (const postData of posts.data.children) {
	// 			if (!this.shouldAddFeedItem(postData))
	// 				continue;
	// 			try {
	// 				this.appendChild(this.makeFeedItem(postData, posts.data.children.length));
	// 			}
	// 			catch (e) {
	// 				console.error(e);
	// 				new Ph_Toast(Level.error, `Error making feed item`);
	// 			}
	// 		}
	// 		this.afterData = posts.data.after;
	// 		if (this.afterData === null)
	// 			this.hasReachedEndOfFeed = true;
	// 	}
	// 	else /* loadPosition === LoadPosition.after */ {
	// 		Ph_ViewState.getViewOf(this).saveScroll(this.lastElementChild as HTMLElement);
	// 		for (const postData of posts.data.children.reverse()) {
	// 			try {
	// 				const newPost = this.makeFeedItem(postData, posts.data.children.length);
	// 				if (newPost instanceof Ph_Post)
	// 					newPost.forceShowWhenSeen();
	// 				this.insertAdjacentElement("afterbegin", newPost);
	// 			}
	// 			catch (e) {
	// 				console.error(e);
	// 				new Ph_Toast(Level.error, `Error making feed item`);
	// 			}
	// 		}
	// 		Ph_ViewState.getViewOf(this).loadScroll();
	//
	// 		this.beforeData = posts.data.before;
	// 	}
	//
	// 	this.checkIfFeedEmpty();
	// }
	//
	// replaceItems(posts: RedditApiObj[], beforeData: string, afterData: string) {
	// 	this.innerText = "";
	// 	this.allPostFullNames = [];
	// 	this.beforeData = beforeData;
	// 	this.afterData = afterData;
	// 	this.hasReachedEndOfFeed = !Boolean(afterData);
	// 	document.scrollingElement.scrollTo(0, 0);
	//
	// 	for (const item of posts) {
	// 		try {
	// 			this.appendChild(this.makeFeedItem(item, posts.length));
	// 		}
	// 		catch (e) {
	// 			console.error(e);
	// 			new Ph_Toast(Level.error, `Error making feed item`);
	// 		}
	// 	}
	//
	// 	this.checkIfFeedEmpty();
	// }
	//
	// checkIfFeedEmpty() {
	// 	setTimeout(() => {
	// 		if (this.hasReachedEndOfFeed)
	// 			return;
	// 		if (this.childElementCount === 0)
	// 			return;
	// 		if (this.offsetHeight > window.innerHeight)
	// 			return;
	// 		if (Ph_ViewState.getViewOf(this).classList.contains("hide"))
	// 			return;
	// 		new Ph_Toast(
	// 			Level.warning,
	// 			"Not enough posts visible. Try to load more?",
	// 			{ onConfirm: () => this.onScroll(undefined, true), groupId: "emptyFeed" }
	// 		);
	// 	}, 1000);
	// }
	//
	// ensureIsVisible(timeoutMs: number = 1000 * 60): Promise<boolean> {
	// 	return new Promise((resolve, reject) => {
	// 		const view = Ph_ViewState.getViewOf(this)
	// 		if (!view.classList.contains("hide")) {
	// 			resolve(false);
	// 			return;
	// 		}
	//
	// 		const obs = new MutationObserver(mutations => {
	// 			if (view.classList.contains("hide"))
	// 				return;
	// 			obs.disconnect();
	// 			clearTimeout(timeout);
	// 			resolve(true);
	// 		});
	// 		obs.observe(view, { attributes: true })
	//
	// 		const timeout = setTimeout(() => {
	// 			obs.disconnect();
	// 			reject("timeout");
	// 		}, timeoutMs);
	// 	});
	// }
	//
	// storeCurrentlyVisibleItem() {
	// 	function getItemVisibility(item: Element): { viewportHeight: number, height: number, topOffset: number } {
	// 		const bounds = item.getBoundingClientRect();
	// 		return {
	// 			viewportHeight: clamp(bounds.bottom, 0, window.innerHeight) - clamp(bounds.top, 0, window.innerHeight),
	// 			height: bounds.height,
	// 			topOffset: bounds.top
	// 		}
	// 	}
	//
	// 	// check if the previously visible item is still visible
	// 	const currentVisibility = getItemVisibility(this.currentlyVisibleItem);
	// 	if (currentVisibility.viewportHeight > 0) {
	// 		this.currentlyVisibleItemScrollTop = currentVisibility.topOffset;
	// 		return;
	// 	}
	// 	this.currentlyVisibleItem = <Ph_FeedItem> Array.from(this.children).find(e => getItemVisibility(e).viewportHeight > 0) ?? this.currentlyVisibleItem;
	// 	this.currentlyVisibleItemScrollTop = getItemVisibility(this.currentlyVisibleItem).topOffset;
	// }
	//
	// onResize(entries: ResizeObserverEntry[]) {
	// 	if (this.children.length <= 1
	// 		||window.innerWidth === this.lastWindowSize[0] && window.innerHeight === this.lastWindowSize[1]
	// 		|| (entries[0].contentBoxSize?.[0]?.blockSize ?? entries[0].contentBoxSize?.["blockSize"] ?? this.offsetWidth) === 0)
	// 		return;
	// 	this.lastWindowSize = [window.innerWidth, window.innerHeight];
	// 	const scrollTopDiff = this.currentlyVisibleItem.getBoundingClientRect().top - this.currentlyVisibleItemScrollTop;
	// 	document.scrollingElement.scrollBy(0, scrollTopDiff);
	// 	this.currentlyVisibleItemScrollTop = this.currentlyVisibleItem.getBoundingClientRect().top;
	// }

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

// enum LoadPosition {
// 	before, after
// }

customElements.define("ph-universal-feed", Ph_UniversalFeed);
