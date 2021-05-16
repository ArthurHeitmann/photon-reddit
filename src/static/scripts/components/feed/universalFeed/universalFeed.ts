import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { RedditApiType } from "../../../types/misc.js";
import { escHTML, getLoadingIcon } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree } from "../../../utils/htmlStuff.js";
import { sleep, throttle, waitForFullScreenExit } from "../../../utils/utils.js";
import Ph_Comment from "../../comment/comment.js";
import Ph_Message from "../../message/message.js";
import { ButtonLabel } from "../../misc/dropDown/dropDown.js";
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
	mentions = "mentions",
	sent = "sent"
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
		if (/\/search\/?(\?.*)?$/i.test(requestUrl))
			this.isSearchFeed = true;

		// make feed specific header elements
		setTimeout(() => {
			const headerElements = [];
			const title = document.createElement("div");
			title.className = "feedTitle";
			let feedType: FeedType = FeedType.misc;
			let feedBaseUrl: string;
			if (/^\/?(\?.*)?$/.test(requestUrl) || /^\/r\/(all|popular|random|friends|mod)/i.test(requestUrl)) {	// home page or special subreddit
				feedType = FeedType.misc;
			}
			else if (/^\/r\/[^/]+/i.test(requestUrl)) {								// subreddit
				title.innerText = requestUrl.match(/r\/[^/?#]+/i)[0];		// /r/all/top --> r/all
				feedType = FeedType.subreddit;
				feedBaseUrl = requestUrl.match(/\/r\/[^/?#]+/i)[0];			// /r/all/top --> r/all
			}
			else if (/^\/(u|user)\/[^/]+\/m\/[^/]+/i.test(requestUrl)) {			// multi
				title.innerText = `Multireddit ${requestUrl.match(/\/m\/([^/?#]+)/i)[1]}`;		// /u/user/m/multi --> multi
				feedType = FeedType.multireddit;
				const matches = requestUrl.match(/\/(u|user)\/([^/]+)\/m\/([^/?#]+)/i)
				feedBaseUrl = `/user/${matches[2]}/m/${matches[3]}`;
			}
			else if (/^\/(u|user)\/[^/]+/i.test(requestUrl)) {						// user
				title.innerText = `u/${requestUrl.match(/\/(u|user)\/([^/?#]+)/i)[2]}`;
				feedType = FeedType.user;
				feedBaseUrl = `/user/${requestUrl.match(/\/(u|user)\/([^/?#]+)/i)[2]}`;
			}
			else if (/^\/message\//i.test(requestUrl))
				feedType = FeedType.messages;
			headerElements.push(title);
			if (Ph_FeedInfo.supportedFeedTypes.includes(feedType) && !feedBaseUrl.includes("+"))
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
				new Ph_Toast(Level.error, `Error making feed item`);
			}
		}
		this.checkIfFeedEmpty();
	}

	async setMessageSection([section]: MessageSection[], setLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement) {
		setLabel(getLoadingIcon());
		this.requestUrl = this.requestUrl.replace(/^(\/message)\/[^/#?]*/i, `$1/${section}`);	// /message/<old> --> /message/<new>
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
			new Ph_Toast(Level.error, "Error getting message section items");
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
				new Ph_Toast(Level.error, `Unknown feed item "${escHTML(itemData.kind)}"`);
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
			if (this.isLoading || this.hasReachedEndOfFeed || elementWithClassInTree(this.parentElement, "viewState").classList.contains("hide"))
				return;
			new Ph_Toast(
				Level.warning,
				"Empty feed. Try to load more?",
				{ timeout: 2000, onConfirm: () => this.onScroll(undefined, true), groupId: "emptyFeed" }
			);
			return;
		}
		let last = this.children[this.childElementCount - 1];
		while (last.classList.contains("hide") && last.previousElementSibling)
			last = last.previousElementSibling;
		if (last.getBoundingClientRect().y < window.innerHeight * 2.5 && !this.hasReachedEndOfFeed)
			this.scrollAction(LoadPosition.after);
		let first = this.children[0];
		while (first.classList.contains("hide") && first.nextElementSibling)
			first = first.nextElementSibling
		if (first && first.getBoundingClientRect().y > window.innerHeight * -2.5)
			this.scrollAction(LoadPosition.before);
	}

	scrollAction(loadPosition: LoadPosition) {
		if (loadPosition === LoadPosition.before && (this.beforeData === null || this.beforeData === this.absoluteFirst))
			return;
		if (loadPosition === LoadPosition.after && this.afterData === null)
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
		if (loadPosition === LoadPosition.before) {
			let removeElements: HTMLElement[] = [];
			let next = this.lastElementChild as HTMLElement;
			while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y > window.innerHeight * 7) && this.childElementCount > 1) {
				removeElements.push(next);
				next = next.nextElementSibling as HTMLElement;
			}
			if (removeElements.length === 0)
				return;
			if (removeElements.length === this.childElementCount)
				removeElements = removeElements.slice(1);

			for (const removeElement of removeElements)
				removeElement.remove();

			this.afterData = this.lastElementChild.getAttribute("data-id");
		}
		else if (loadPosition === LoadPosition.after) {
			// first collect all elements that are too far away and should be removed
			const removeElements: Element[] = [];
			let firstVisibleElement = this.children[0];
			while (firstVisibleElement && firstVisibleElement.classList.contains("hide"))
				firstVisibleElement = firstVisibleElement.nextElementSibling;
			let next = this.children[0];
			if (this.childElementCount <= 1)
				next = null;
			let possibleRemoveHidden: Element[] = [];
			while (next && next.classList.contains("hide")) {
				possibleRemoveHidden.push(next);
				next = next.nextElementSibling as Element;
			}
			while (next && (next.classList.contains("hide") || next.getBoundingClientRect().y < window.innerHeight * -5)) {
				removeElements.push(next);
				next = next.nextElementSibling as Element;
			}
			if (removeElements.length === 0)
				return;
			if (removeElements.includes(firstVisibleElement))
				removeElements.splice(0, 0, ...possibleRemoveHidden);
			if (removeElements.length === this.childElementCount)
				removeElements.splice(-1);

			// remove old elements and set scroll position approximately back to where it was before removal
			if (removeElements.length) {
				let firstSafeElement = removeElements[removeElements.length - 1].nextElementSibling;
				while (firstSafeElement && firstSafeElement.classList.contains("hide"))
					firstSafeElement = firstSafeElement.nextElementSibling;
				Ph_ViewState.getViewOf(this).saveScroll(firstSafeElement as HTMLElement);
				for (const elem of removeElements)
					elem.remove();
				Ph_ViewState.getViewOf(this).loadScroll();
			}
			this.beforeData = this.firstElementChild.getAttribute("data-id");
		}
	}

	async loadMore(loadPosition) {
		let param: string[];
		if (loadPosition === LoadPosition.after)
			param = ["after",  this.afterData];
		else
			param = ["before", this.beforeData];
		const posts: RedditApiType = await redditApiRequest(this.requestUrl, [param], false);

		if (await waitForFullScreenExit())
			await sleep(100);
		if (await this.ensureIsVisible())
			await sleep(100);

		if (loadPosition === LoadPosition.after) {
			for (const postData of posts.data.children) {
				if (!this.shouldAddFeedItem(postData))
					continue;
				try {
					this.appendChild(this.makeFeedItem(postData, posts.data.children.length));
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.error, `Error making feed item`);
				}
			}
			this.afterData = posts.data.after;
			if (this.afterData === null)
				this.hasReachedEndOfFeed = true;
		}
		else /* loadPosition === LoadPosition.after */ {
			Ph_ViewState.getViewOf(this).saveScroll(this.lastElementChild as HTMLElement);
			for (const postData of posts.data.children.reverse()) {
				try {
					const newPost = this.makeFeedItem(postData, posts.data.children.length);
					if (newPost instanceof Ph_Post)
						newPost.forceShowWhenSeen();
					this.insertAdjacentElement("afterbegin", newPost);
				}
				catch (e) {
					console.error(e);
					new Ph_Toast(Level.error, `Error making feed item`);
				}
			}
			Ph_ViewState.getViewOf(this).loadScroll();

			this.beforeData = posts.data.before;
		}

		this.checkIfFeedEmpty();
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
				new Ph_Toast(Level.error, `Error making feed item`);
			}
		}

		this.checkIfFeedEmpty();
	}

	checkIfFeedEmpty() {
		setTimeout(() => {
			if (this.hasReachedEndOfFeed)
				return;
			if (this.childElementCount === 0)
				return;
			if (this.offsetHeight > window.innerHeight)
				return;
			if (Ph_ViewState.getViewOf(this).classList.contains("hide"))
				return;
			new Ph_Toast(
				Level.warning,
				"Empty feed. Try to load more?",
				{ onConfirm: () => this.onScroll(undefined, true), groupId: "emptyFeed" }
			);
		}, 1000);
	}

	ensureIsVisible(timeoutMs: number = 1000 * 60): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const view = Ph_ViewState.getViewOf(this)
			if (!view.classList.contains("hide")) {
				resolve(false);
				return;
			}

			const obs = new MutationObserver(mutations => {
				if (view.classList.contains("hide"))
					return;
				obs.disconnect();
				clearTimeout(timeout);
				resolve(true);
			});
			obs.observe(view, { attributes: true })

			const timeout = setTimeout(() => {
				obs.disconnect();
				reject("timeout");
			}, timeoutMs);
		});
	}
}

enum LoadPosition {
	before, after
}

customElements.define("ph-universal-feed", Ph_UniversalFeed);
