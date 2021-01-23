import { viewsStack } from "../../../historyState/historyStateManager.js";
import { thisUser } from "../../../utils/globals.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../../utils/htmlStuff.js";
import { numberToShort } from "../../../utils/utils.js";
import Ph_Header from "../../global/header/header.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export default class Ph_UserDropDown extends HTMLElement {
	private unreadBadge: HTMLDivElement;
	constructor() {
		super();

		this.className = "userDropDown";

		const dropDownButton = document.createElement("button");
		dropDownButton.innerText = "Actions";
		dropDownButton.addEventListener("click", this.toggle.bind(this));
		this.appendChild(dropDownButton);
		const dropDownArea = document.createElement("div");
		dropDownArea.appendChild(this.makeActionBar());
		dropDownArea.appendChild(this.makeSubredditGroup([{ path: "/r/popular", name: "r/popular" }, { path: "/r/all", name: "r/all" }], "Reddit Feeds"));
		this.appendChild(dropDownArea);

		window.addEventListener("ph-ready", () => {
			dropDownArea.appendChild(this.makeSubredditGroup(
				thisUser.multireddits.map(multi => ({name: multi.display_name, path: multi.path})),
				"Custom Feeds"
			));
			dropDownArea.appendChild(this.makeSubredditGroup(
				thisUser.subreddits.map(sub => <SubGroupData> {name: sub, path: `/${sub}`}),
				"Subscribed"
			));
			this.setUnreadCount(thisUser.inboxUnread);
		});
	}

	private makeSubredditGroup(subs: SubGroupData[], groupName: string): HTMLElement {
		const group = document.createElement("div");
		group.className = "subGroup separated";
		group.innerHTML = `<div class="name">${groupName}</div>`;
		subs.forEach(sub => group.insertAdjacentHTML("beforeend",
			`<div class="sub"><a href="${escADQ(sub.path)}">${escHTML(sub.name || sub.path)}</a></div>`));
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
			item.setAttribute("data-tooltip", tooltip);
			item.innerHTML = `<img src="${escADQ(imgSrc)}" alt="${tooltip}">`
			return item;
		}
		// create post
		const postAction = makeAction(
			"/img/edit.svg",
			"Submit Post",
			() => new Ph_Toast(Level.Info, "Not yet supported", { timeout: 5000 })
		);
		actions.appendChild(postAction);
		// messages
		const inboxAction = makeAction(
			"/img/chat.svg",
			"Inbox",
			"/message/inbox"
		);
		this.unreadBadge = document.createElement("div");
		this.unreadBadge.className = "unreadBadge hide";
		inboxAction.appendChild(this.unreadBadge);
		actions.appendChild(inboxAction);
		// clear previous states
		const clearAction = makeAction(
			"/img/close.svg",
			"Clear History",
			() => viewsStack.clear()
		);
		actions.appendChild(clearAction);
		// about
		const aboutAction = makeAction(
			"/img/info.svg",
			"About",
			"/about"
		);
		actions.appendChild(aboutAction);

		return actions
	}

	setUnreadCount(unreadCount: number) {
		this.unreadBadge.innerText = numberToShort(unreadCount);
		if (unreadCount === 0)
			this.unreadBadge.classList.add("hide");
		else
			this.unreadBadge.classList.remove("hide");
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
