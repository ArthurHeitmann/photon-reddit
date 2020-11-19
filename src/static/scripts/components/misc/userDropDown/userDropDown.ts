import { MultiReddit, thisUser } from "../../../utils/globals.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";

export default class Ph_UserDropDown extends HTMLElement {
	constructor() {
		super();

		this.className = "userDropDown";

		const dropDownButton = document.createElement("button");
		dropDownButton.innerText = "Subreddits";
		dropDownButton.addEventListener("click", () => this.classList.toggle("expanded"));
		this.appendChild(dropDownButton);
		const dropDownArea = document.createElement("div");
		dropDownArea.appendChild(this.makeSubredditGroup([{ path: "/r/popular", name: "r/popular" }, { path: "/r/all", name: "r/all" }], "Reddit Feeds"));
		this.appendChild(dropDownArea);

		window.addEventListener("ph-ready", () => {
			dropDownButton.innerText = `u/${thisUser.name}`;
			dropDownArea.appendChild(this.makeSubredditGroup(
				thisUser.multiReddits.map(multi => <SubGroupData> {name: multi.display_name, path: multi.path}),
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
			`<div class="sub"><a href="${sub.path}">${sub.name || sub.path}</a></div>`));
		linksToSpa(group);
		return group;
	}

	minimize() {
		this.classList.remove("expanded");
	}
}

interface SubGroupData {
	path: string,
	name: string,
}

customElements.define("ph-user-dropdown", Ph_UserDropDown);
