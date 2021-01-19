import { thisUser } from "../../../utils/globals.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../../utils/htmlStuff.js";
import Ph_Header from "../../global/header/header.js";

export default class Ph_UserDropDown extends HTMLElement {
	constructor() {
		super();

		this.className = "userDropDown";

		const dropDownButton = document.createElement("button");
		dropDownButton.innerText = "Subreddits";
		dropDownButton.addEventListener("click", this.toggle.bind(this));
		this.appendChild(dropDownButton);
		const dropDownArea = document.createElement("div");
		dropDownArea.appendChild(this.makeSubredditGroup([{ path: "/r/popular", name: "r/popular" }, { path: "/r/all", name: "r/all" }], "Reddit Feeds"));
		this.appendChild(dropDownArea);

		window.addEventListener("ph-ready", () => {
			dropDownButton.innerText = thisUser.name ? `u/${thisUser.name}` : "Subreddits";
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
		group.className = "subGroup";
		group.innerHTML = `<div class="name">${groupName}</div>`;
		subs.forEach(sub => group.insertAdjacentHTML("beforeend",
			`<div class="sub"><a href="${escADQ(sub.path)}">${escHTML(sub.name || sub.path)}</a></div>`));
		linksToSpa(group);
		return group;
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
