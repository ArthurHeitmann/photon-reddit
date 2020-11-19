import { thisUser } from "../../../utils/globals.js";
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
		dropDownArea.appendChild(this.makeSubredditGroup(["r/popular", "r/all"], "Reddit Feeds"));
		this.appendChild(dropDownArea);

		window.addEventListener("ph-ready", () => {
			dropDownButton.innerText = `u/${thisUser.name}`;
			dropDownArea.appendChild(this.makeSubredditGroup(thisUser.subreddits, "Subscribed"))
		});
	}

	private makeSubredditGroup(subs: string[], groupName: string): HTMLElement {
		const group = document.createElement("div");
		group.className = "subGroup";
		group.innerHTML = `<div class="name">${groupName}</div>`;
		subs.forEach(sub => group.insertAdjacentHTML("beforeend",
			`<div class="sub"><a href="/${sub}">${sub}</a></div>`));
		linksToSpa(group);
		return group;
	}

	minimize() {
		this.classList.remove("expanded");
	}
}

customElements.define("ph-user-dropdown", Ph_UserDropDown);
