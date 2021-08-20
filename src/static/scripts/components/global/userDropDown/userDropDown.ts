import ViewsStack from "../../../historyState/viewsStack";
import { RedditApiType } from "../../../types/misc";
import { ensurePageLoaded, thisUser } from "../../../utils/globals";
import { elementWithClassInTree, isElementIn } from "../../../utils/htmlStuff";
import { hasHTML, isFakeSubreddit, makeElement, numberToShort } from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_Header from "../header/header";

/**
 * A Dropdown in the header with
 *  - quick actions
 *  - multireddits
 *  - subscribed subreddits
 */
export default class Ph_UserDropDown extends HTMLElement {
	unreadBadge: HTMLElement;

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.className = "userDropDown";

		const dropDownButton = makeElement("button", { onclick: this.toggle.bind(this) }, "Actions");
		this.append(dropDownButton);
		const dropDownArea = makeElement("div", null, [
			this.makeActionBar(),
			this.makeSubredditGroup([ "r/all", "r/popular" ], "Reddit Feeds")
		]);
		this.append(dropDownArea);

		window.addEventListener("click", e => {
			if (!isElementIn(this, e.target as HTMLElement))
				this.minimize();
		});
		ensurePageLoaded().then(() => {
			dropDownArea.append(this.makeSubredditGroup(
				thisUser.multiredditsData,
				"Multireddits"
			));
			dropDownArea.append(this.makeSubredditGroup(
				thisUser.subredditsData,
				"Subscribed"
			));
		});
	}

	private makeSubredditGroup(feedsData: (RedditApiType | string)[], groupName: string): HTMLElement {
		return makeElement("div", { class: "subGroup separated" }, [
			makeElement("div", { class: "name" }, groupName),
			...feedsData.map(feedData => new Ph_FeedLink(feedData))
		]);
	}

	private makeActionBar(): HTMLElement {
		const actions = makeElement("div", { class: "actionBar separated" });
		function makeAction(imgSrc: string, tooltip: string, onClick: string | (() => void)): HTMLElement {
			let item: HTMLElement;
			if (typeof onClick === "string")
				item = makeElement("a", { href: onClick });
			else if (typeof onClick === "function")
				item = makeElement("button", { onclick: onClick });
			else
				throw "Wut?";
			item.classList.add("item");
			item.classList.add("transparentButtonAlt");
			item.setAttribute("data-tooltip", tooltip);
			item.append(makeElement("img", { src: imgSrc, alt: tooltip }))
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
				if (currentSubMatch && !isFakeSubreddit(currentSubMatch[0].substr(3)))
					submitUrl = `${currentSubMatch}/submit`;
				else
					submitUrl = "/submit";
				postAction.href = submitUrl;
		});
		actions.append(postAction);
		// messages
		const inboxAction = makeAction(
			"/img/envelope.svg",
			"Inbox",
			"/message/inbox"
		);
		this.unreadBadge = makeElement("div", { class: "unreadBadge hide" });
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
