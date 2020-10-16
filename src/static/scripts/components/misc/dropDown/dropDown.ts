import { PostSorting, SortPostsOrder, SortPostsTimeFrame } from "../../../utils/types.js";
import { Ph_Feed } from "../../feed/feed.js";
import Ph_UniversalFeed from "../../feed/universalFeed/universalFeed.js";
import Ph_DropDownEntry, { DropDownEntryParam } from "../dropDownEntry/dropDownEntry.js";

export default class Ph_DropDown extends HTMLElement {
	cancelMenuFuncRef: (e) => void;
	feed: Ph_Feed;
	isExpanded = false;

	constructor(entryParams: DropDownEntryParam[], toggleButton?: HTMLElement, parentEntry?: Ph_DropDownEntry) {
		super();

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.classList.add("dropDown");
		this.classList.add("dropDownArea");

		for (const param of entryParams) {
			this.appendChild(new Ph_DropDownEntry(param, this, parentEntry));
		}

		if (toggleButton)
			toggleButton.addEventListener("click", this.toggleMenu.bind(this));
	}

	toggleMenu() {
		if (this.isExpanded)
			this.closeMenu();
		else
			this.showMenu();
		
		this.isExpanded = !this.isExpanded;
	}

	showMenu() {
		this.classList.add("show");
		this.classList.remove("remove");
		setTimeout(() => window.addEventListener("click", this.cancelMenuFuncRef), 0);
	}
	
	closeMenu() {
		this.classList.remove("show");
		this.classList.add("remove");
		setTimeout(() => window.removeEventListener("click", this.cancelMenuFuncRef), 0);
	}
	
	cancelMenu(e) {
		if (!this.contains(e.target))
			this.closeMenu();
	}
}

customElements.define("ph-drop-down", Ph_DropDown);
