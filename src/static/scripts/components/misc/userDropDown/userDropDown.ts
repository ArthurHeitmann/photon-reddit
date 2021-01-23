import { viewsStack } from "../../../historyState/historyStateManager.js";
import { thisUser } from "../../../utils/globals.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../../utils/htmlStuff.js";
import Ph_Header from "../../global/header/header.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export default class Ph_UserDropDown extends HTMLElement {
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
				thisUser.multiReddits.map(multi => ({name: multi.display_name, path: multi.path})),
				"Custom Feeds"
			));
			dropDownArea.appendChild(this.makeSubredditGroup(
				thisUser.subreddits.map(sub => <SubGroupData> {name: sub, path: `/${sub}`}),
				"Subscribed"
			));
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
		function makeAction(imgSrc: string, tooltip: string, onClick: string | (() => void), linkInNewTab?: boolean): HTMLElement {
			let item: HTMLElement;
			if (typeof onClick === "string") {
				item = document.createElement("a");
				item.setAttribute("href", onClick);
				if (linkInNewTab)
					item.setAttribute("target", "_blank");
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
			"/about.html",
			true
		);
		actions.appendChild(aboutAction);

		return actions
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
