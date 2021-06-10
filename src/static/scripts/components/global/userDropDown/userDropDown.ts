import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { RedditApiType } from "../../../types/misc.js";
import { fakeSubreddits } from "../../../utils/consts.js";
import { ensurePageLoaded, thisUser } from "../../../utils/globals.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree, isElementIn, linksToSpa } from "../../../utils/htmlStuff.js";
import { hasHTML, numberToShort } from "../../../utils/utils.js";
import Ph_FeedLink from "../../link/feedLink/feedLink.js";
import Ph_Header from "../header/header.js";

/**
 * A Dropdown in the header with
 *  - quick actions
 *  - multireddits
 *  - subscribed subreddits
 */
export default class Ph_UserDropDown extends HTMLElement {
	unreadBadge: HTMLDivElement;

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.className = "userDropDown";

		const dropDownButton = document.createElement("button");
		dropDownButton.innerText = "Actions";
		dropDownButton.addEventListener("click", this.toggle.bind(this));
		this.append(dropDownButton);
		const dropDownArea = document.createElement("div");
		dropDownArea.append(this.makeActionBar());
		dropDownArea.append(this.makeSubredditGroup([ "r/popular", "r/all" ], "Reddit Feeds"));
		this.append(dropDownArea);

		window.addEventListener("click", e => {
			if (!isElementIn(this, e.target as HTMLElement))
				this.minimize();
		});
		ensurePageLoaded().then(() => {
			dropDownArea.append(this.makeSubredditGroup(
				thisUser.multiredditsData,
				"Custom Feeds"
			));
			dropDownArea.append(this.makeSubredditGroup(
				thisUser.subredditsData,
				"Subscribed"
			));
			this.setUnreadCount(thisUser.inboxUnread);
		});
	}

	private makeSubredditGroup(feedsData: (RedditApiType | string)[], groupName: string): HTMLElement {
		const group = document.createElement("div");
		group.className = "subGroup separated";
		group.innerHTML = `<div class="name">${groupName}</div>`;
		feedsData.forEach(feedData => group.append(new Ph_FeedLink(feedData)));
		linksToSpa(group);
		return group;
	}

	private makeActionBar(): HTMLElement {
		const actions = document.createElement("div");
		actions.className = "actionBar separated";
		function makeAction(imgSrc: string, tooltip: string, onClick: string | (() => void)): HTMLElement {
			let item: HTMLElement;
			if (typeof onClick === "string") {
				item = document.createElement("a");
				item.setAttribute("href", onClick);
			}
			else if (typeof onClick === "function") {
				item = document.createElement("button");
				item.addEventListener("click", onClick);
			}
			else
				throw "Wut?";
			item.classList.add("item");
			item.classList.add("transparentButtonAlt");
			item.setAttribute("data-tooltip", tooltip);
			item.innerHTML = `<img src="${escADQ(imgSrc)}" alt="${tooltip}">`
			return item;
		}
		// current user page
		const userPage = makeAction(
			"/img/user.svg",
			"My Profile",
			"/"
		) as HTMLAnchorElement;
		ensurePageLoaded().then(() => userPage.href = `/user/${thisUser.name}`);
		actions.append(userPage);
		// create post
		const postAction = makeAction(
			"/img/edit.svg",
			"Submit Post",
			"/submit"
		) as HTMLAnchorElement;
		window.addEventListener("ph-view-change", (e: CustomEvent) => {
				let submitUrl: string;
				const currentSubMatch: RegExpMatchArray = history.state.url.match(/\/r\/\w+/i);		// /r/sub
				if (currentSubMatch && !fakeSubreddits.includes(currentSubMatch[0].substr(3)))
					submitUrl = `${currentSubMatch}/submit`;
				else
					submitUrl = "/submit";
				postAction.href = submitUrl;
		});
		actions.append(postAction);
		// messages
		const inboxAction = makeAction(
			"/img/chat.svg",
			"Inbox",
			"/message/inbox"
		);
		this.unreadBadge = document.createElement("div");
		this.unreadBadge.className = "unreadBadge hide";
		inboxAction.append(this.unreadBadge);
		actions.append(inboxAction);
		// clear previous states
		const clearAction = makeAction(
			"/img/close.svg",
			"Unload Pages",
			() => ViewsStack.clear()
		);
		actions.append(clearAction);
		// about
		const aboutAction = makeAction(
			"/img/info.svg",
			"About",
			"/about"
		);
		actions.append(aboutAction);

		return actions
	}

	setUnreadCount(unreadCount: number) {
		this.unreadBadge.innerText = numberToShort(unreadCount);
		thisUser.inboxUnread = unreadCount;
		this.unreadBadge.classList.toggle("hide", unreadCount === 0)
	}

	minimize() {
		this.classList.remove("expanded");
	}

	toggle() {
		this.classList.toggle("expanded");
		if (this.classList.contains("expanded"))
			(elementWithClassInTree(this.parentElement, "header") as Ph_Header)?.minimizeAll([this]);
	}
}

interface SubGroupData {
	path: string,
	name: string,
}

customElements.define("ph-user-dropdown", Ph_UserDropDown);
