import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { thisUser } from "../../../utils/globals.js";
import { escHTML, getLoadingIcon } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../types/misc.js";
import { sleep, throttle, waitForFullScreenExit } from "../../../utils/utils.js";
import Ph_Comment from "../../comment/comment.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Message from "../../message/message.js";
import { DropDownEntryParam } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_Post from "../../post/post.js";
import { Ph_ViewState } from "../../viewState/viewState.js";
import Ph_FeedInfo, { FeedType } from "../feedInfo/feedInfo.js";
import Ph_SearchFeedSorter from "../sorting/searchFeedSorter.js";
import Ph_UniversalFeedSorter from "../sorting/universalFeedSorter.js";

export enum MessageSection {
	all = "inbox",
	unread = "unread",
	messages = "messages",
	commentReplies = "comments",
	postReplies = "selfreply",
	mentions = "mentions"
}

/**
 * A list of reddit things (can be posts, comments, messages)
 *  - can be sorted
 *  - automatically loads more (and unloads old) when scrolling to the end
 */
export default class Ph_UniversalFeed extends HTMLElement {
	absoluteFirst: string = null;
	beforeData: string = null;
	afterData: string = null;
	isLoading: boolean = false;
	requestUrl: string;
	hasReachedEndOfFeed = false;
	isSearchFeed = false;
	private allPostFullNames: string[] = [];

	constructor(posts: RedditApiType, requestUrl: string) {
		super();

		this.beforeData = posts.data.before;
		this.afterData = posts.data.after;
		if (this.afterData === null)
			this.hasReachedEndOfFeed = true;
		this.requestUrl = requestUrl;

		const scrollChecker = throttle(this.onScroll.bind(this), 1000);
		document.scrollingElement.addEventListener("wheel", scrollChecker, { passive: true });
		document.scrollingElement.addEventListener("touchmove", scrollChecker, { passive: true });

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
		observer.observe(this, { childList: true });

		this.classList.add("universalFeed");
		if (/\/search\/?(\?.*)?$/.test(requestUrl))
			this.isSearchFeed = true;

		// make feed specific header elements
		setTimeout(() => {
			const headerElements = [];
			const title = document.createElement("div");
			title.className = "feedTitle";
			let feedType: FeedType = FeedType.misc;
			let feedBaseUrl: string;
			if (/^\/?(\?.*)?$/.test(requestUrl) || /^\/r\/(all|popular|random)/.test(requestUrl)) {	// home
				feedType = FeedType.misc;
			}
			else if (/^\/r\/[^/]+/.test(requestUrl)) {								// subreddit
				title.innerText = requestUrl.match(/r\/[^/?]+/)[0];
				feedType = FeedType.subreddit;
				feedBaseUrl = requestUrl.match(/\/r\/[^/?]+/)[0];
			}
			else if (/^\/(u|user)\/[^/]+\/m\/[^/]+/.test(requestUrl)) {				// multi
				title.innerText = `Multireddit ${requestUrl.match(/\/m\/([^/]+)/)[1]}`;
				feedType = FeedType.multireddit;
				const matches = requestUrl.match(/\/(u|user)\/([^/]+)\/m\/([^/]+)/)
				feedBaseUrl = `/user/${matches[2]}/m/${matches[3]}`;
			}
			else if (/^\/(u|user)\/[^/]+/.test(requestUrl)) {						// user
				title.innerText = `u/${requestUrl.match(/\/(u|user)\/([^/?]+)/)[2]}`;
				feedType = FeedType.user;
				feedBaseUrl = `/user/${requestUrl.match(/\/(u|user)\/([^/?]+)/)[2]}`;
			}
			else if (/^\/message\//.test(requestUrl))
				feedType = FeedType.messages;
			headerElements.push(title);
			if (Ph_FeedInfo.supportedFeedTypes.includes(feedType))
				headerElements.push(Ph_FeedInfo.getInfoButton(feedType, feedBaseUrl));
			if (feedType === FeedType.user) {
			}
			else if (feedType === FeedType.messages) {
				headerElements.push(...Ph_Message.getMessageFeedHeaderElements(this.setMessageSection.bind(this)));
			}
			if (this.isSearchFeed)
				headerElements.push(new Ph_SearchFeedSorter(this));
			else if (feedType !== FeedType.messages)
				headerElements.push(new Ph_UniversalFeedSorter(this, feedType, feedBaseUrl));
			(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
		}, 0);


		for (const postData of posts.data.children) {
			try {
				this.appendChild(this.makeFeedItem(postData, posts.data.children.length));
			}
			catch (e) {
				console.error(e);
				new Ph_Toast(Level.Error, `Error making feed item`);
			}
		}
	}

	async setMessageSection([section]: MessageSection[], setLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement) {
		setLabel(getLoadingIcon());
		this.requestUrl = this.requestUrl.replace(/^(\/message)\/[^\/]*/, `$1/${section}`);
		try {
			const sectionItems: RedditApiType = await redditApiRequest(
				this.requestUrl,
				[],
				false
			);
			this.beforeData = sectionItems.data.before;
			this.afterData = sectionItems.data.after;
			this.replaceChildren(sectionItems.data.children, sectionItems.data.before, sectionItems.data.after);
			ViewsStack.changeCurrentUrl(this.requestUrl);
			setLabel(section);
		} catch (e) {
			console.error("Error getting message section items");
			new Ph_Toast(Level.Error, "Error getting message section items");
			console.error(e);
			setLabel(initialLabel);
		}
	}

	makeFeedItem(itemData: RedditApiType, totalItemCount: number): HTMLElement {
		switch (itemData.kind) {
			case "t3":
				const post = new Ph_Post(itemData, true, this.requestUrl);
				if (!this.allPostFullNames.includes(post.fullName))
					this.allPostFullNames.push(post.fullName);
				return post;
			case "t1":
				return new Ph_Comment(itemData, false, true);
			case "t4":
				return new Ph_Message(itemData, totalItemCount !== 1);
			default:
				new Ph_Toast(Level.Error, `Unknown feed item "${escHTML(itemData.kind)}"`);
				throw `What is this feed item? ${JSON.stringify(itemData, null, 4)}`;
		}
	}

	shouldAddFeedItem(itemData: RedditApiType): boolean {
		return itemData.kind !== "t3" || !this.allPostFullNames.includes(itemData.data["name"]);
	}

	/**
	 * If less than N screen heights are left until the end of the feed, load new content
	 */
	onScroll(e: Event = undefined, skipEmptyCheck = false) {
		// stop if empty or is loading or for some reason close to empty (normal feed will have very large scrollHeight)
		if (!skipEmptyCheck && (this.children.length <= 0 || this.isLoading || this.scrollHeight < window.innerHeight)) {
			if (this.isLoading || elementWithClassInTree(this.parentElement, "viewState").classList.contains("hide"))
				return;
			new Ph_Toast(
				Level.Warning,
				"Empty feed. Try to load more?",
				{ timeout: 5000, onConfirm: () => this.onScroll(undefined, true) }
			);
			return;
		}
		let last = this.children[this.childElementCount - 1];
		while (last.classList.contains("hide") && last.previousElementSibling)
			last = last.previousElementSibling;
		if (last.getBoundingClientRect().y < window.innerHeight * 2.5 && !this.hasReachedEndOfFeed)
			this.scrollAction(LoadPosition.After);
		let first = this.children[0];
		while (first.classList.contains("hide") && first.nextElementSibling)
			first = first.nextElementSibling
		if (first && first.getBoundingClientRect().y > window.innerHeight * -2.5)
			this.scrollAction(LoadPosition.Before);
	}

	scrollAction(loadPosition: LoadPosition) {
		if (loadPosition === LoadPosition.Before && (this.beforeData === null || this.beforeData === this.absoluteFirst))
			return;
		if (loadPosition === LoadPosition.After && this.afterData === null)
			return;

		this.isLoading = true;
		this.loadMore(loadPosition)
			.then(() => {
				this.clearPrevious(loadPosition);
				this.isLoading = false;
			})
			.catch(() => this.isLoading = false);
	}

	clearPrevious(loadPosition: LoadPosition) {
		if (loadPosition === LoadPosition.Before) {
			const removeElements: HTMLElement[] = [];
			let next = this.lastElementChild as HTMLElement;
			while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y > window.innerHeight * 7) && this.childElementCount > 1) {
				removeElements.push(next);
				next = next.nextElementSibling as HTMLElement;
			}
			if (removeElements.length === 0)
				return;

			for (const removeElement of removeElements)
				removeElement.remove();

			this.afterData = this.lastElementChild.getAttribute("data-id");
		}
		else if (loadPosition === LoadPosition.After) {
			// firefox messes up the scroll position if you just remove all old elements, so we have to do this instead
			// first collect all elements that are too far away and should be removed
			const removeElements: HTMLElement[] = [];
			let next = this.children[0] as HTMLElement;
			while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y < window.innerHeight * -5) && this.childElementCount > 1) {
				removeElements.push(next);
				next = next.nextElementSibling as HTMLElement;
			}
			if (removeElements.length === 0)
				return;

			// remove old elements and set scroll position approximately back to where it was before removal
			const viewScrollTop = document.scrollingElement.scrollTop;
			const elementMarginTop = parseFloat(getComputedStyle(removeElements[0]).marginTop);
			let removedHeight = 0;
			for (const removeElement of removeElements) {
				if (!removeElement.classList.contains("hide"))
					removedHeight += removeElement.getBoundingClientRect().height + elementMarginTop * 2;
				removeElement.remove();
			}
			const newTop = viewScrollTop - removedHeight;
			document.scrollingElement.scrollTo({ top: newTop });
			// setTimeout(() => {
				// if (Math.abs(document.scrollingElement.scrollTop - newTop) < 50)
				// 	return;
				// document.scrollingElement.scrollTo({ top: newTop });
				// console.log("fixing");
			// }, 1000);
			this.beforeData = this.firstElementChild.getAttribute("data-id");
		}
	}

	async loadMore(loadPosition) {
		const posts: RedditApiType = await redditApiRequest(this.requestUrl, [
			["before", loadPosition === LoadPosition.Before ? this.beforeData : "null"],
			["after",  loadPosition === LoadPosition.After  ? this.afterData : "null"],
		], false);

		if (await waitForFullScreenExit())
			await sleep(100);

		if (loadPosition === LoadPosition.After) {
			for (const postData of posts.data.children) {
				if (!this.shouldAddFeedItem(postData))
					continue;
				try {
					this.appendChild(this.makeFeedItem(postData, posts.data.children.length));
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.Error, `Error making feed item`);
				}
			}
			this.afterData = posts.data.after;
			if (this.afterData === null)
				this.hasReachedEndOfFeed = true;
		}
		else {
			// scroll logic from clearPrevious() loadPosition === LoadPosition.After
			const viewScrollTop = document.scrollingElement.scrollTop;
			const elementMarginTop = parseFloat(getComputedStyle(this.children[0]).marginTop);
			let addedHeight = 0;
			for (const postData of posts.data.children.reverse()) {
				try {
					const newPost = this.makeFeedItem(postData, posts.data.children.length);
					if (newPost instanceof Ph_Post)
						newPost.forceShowWhenSeen();
					this.insertAdjacentElement("afterbegin", newPost);
					addedHeight += newPost.getBoundingClientRect().height + elementMarginTop * 2;
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.Error, `Error making feed item`);
				}
			}
			document.scrollingElement.scrollTo({ top: viewScrollTop + addedHeight - elementMarginTop });

			this.beforeData = posts.data.before;
		}
	}

	replaceChildren(posts: RedditApiType[], beforeData: string, afterData: string) {
		this.innerText = "";
		this.allPostFullNames = [];
		this.beforeData = beforeData;
		this.afterData = afterData;
		document.scrollingElement.scrollTo(0, 0);

		for (const item of posts) {
			try {
				this.appendChild(this.makeFeedItem(item, posts.length));
			}
			catch (e) {
				console.error(e);
				new Ph_Toast(Level.Error, `Error making feed item`);
			}
		}
	}
}

enum LoadPosition {
	Before, After
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
