import { Ph_Feed } from "../../feed/feed.js";
import Ph_DropDownEntry, { DropDownEntryParam } from "../dropDownEntry/dropDownEntry.js";

export default class Ph_DropDown extends HTMLElement {
	cancelMenuFuncRef: (e) => void;
	feed: Ph_Feed;
	isExpanded = false;
	parentEntry: Ph_DropDownEntry = null;
	toggleButton: HTMLButtonElement;

	constructor(entryParams: DropDownEntryParam[], toggleButtonText?: string, parentEntry?: Ph_DropDownEntry) {
		super();

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.classList.add("dropDown");

		if (typeof toggleButtonText === "string") {
			this.toggleButton = document.createElement("button");
			this.toggleButton.className = "button dropDownButton";
			this.toggleButton.innerText = toggleButtonText;
			this.toggleButton.addEventListener("click", this.toggleMenu.bind(this));
			this.appendChild(this.toggleButton);
		}

		const dropDownArea = document.createElement("div");
		dropDownArea.classList.add("dropDownArea");
		this.appendChild(dropDownArea);
		if (parentEntry)
			this.parentEntry = parentEntry;

		for (const param of entryParams) {
			dropDownArea.appendChild(new Ph_DropDownEntry(param, this, parentEntry));
		}
	}

	toggleMenu() {
		if (this.isExpanded)
			this.closeMenu();
		else
			this.showMenu();
	}

	showMenu() {
		this.isExpanded = true;
		this.classList.add("show");
		this.classList.remove("remove");
		setTimeout(() => window.addEventListener("click", this.cancelMenuFuncRef), 0);
	}
	
	closeMenu(closeAllPrevious = false) {
		this.isExpanded = false;
		this.classList.remove("show");
		this.classList.add("remove");
		window.removeEventListener("click", this.cancelMenuFuncRef);
		if (this.parentEntry && !closeAllPrevious)
			(this.parentEntry.parentElement.parentElement as Ph_DropDown).showMenu();
	}
	
	cancelMenu(e) {
		if (!this.contains(e.target))
			this.closeMenu();
		
		e.stopPropagation();
	}
}

customElements.define("ph-drop-down", Ph_DropDown);
