import Ph_DropDown from "../dropDown.js";
import Ph_DropDownEntry, { DropDownEntryParam } from "../dropDownEntry/dropDownEntry.js";

/**
 * Contains one level of drop down entries
 */
export default class Ph_DropDownArea extends HTMLElement {
	parentEntry: Ph_DropDownEntry = null;
	isExpanded = false;
	cancelMenuFuncRef: (e) => void;

	constructor(entryParams: DropDownEntryParam[], dropDown: Ph_DropDown, parentEntry?: Ph_DropDownEntry) {
		super();

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.classList.add("dropDownArea");
		
		if (parentEntry)
			this.parentEntry = parentEntry;

		for (const param of entryParams) {
			this.appendChild(new Ph_DropDownEntry(param, this, parentEntry));
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
			(this.parentEntry.parentElement as Ph_DropDownArea).showMenu();
	}
	
	cancelMenu(e) {
		if (!this.contains(e.target))
			this.closeMenu();
		
		e.stopPropagation();
	}
}

customElements.define("ph-drop-down-area", Ph_DropDownArea);
