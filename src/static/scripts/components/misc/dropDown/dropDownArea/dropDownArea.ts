import { hasParams } from "../../../../utils/utils";
import Ph_DropDown from "../dropDown";
import Ph_DropDownEntry, { DropDownEntryParam } from "../dropDownEntry/dropDownEntry";

/**
 * Contains one level of drop down entries
 */
export default class Ph_DropDownArea extends HTMLElement {
	parentEntry: Ph_DropDownEntry = null;
	isExpanded = false;
	cancelMenuFuncRef: (e) => void;

	constructor(entryParams: DropDownEntryParam[], dropDown: Ph_DropDown, parentEntry?: Ph_DropDownEntry) {
		super();
		if (!hasParams(arguments)) return;

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.classList.add("dropDownArea");
		this.classList.add("remove");

		if (parentEntry)
			this.parentEntry = parentEntry;

		this.setEntries(entryParams, dropDown);
	}

	setEntries(entryParams: DropDownEntryParam[], dropDown: Ph_DropDown) {
		this.innerText = "";

		for (const param of entryParams) {
			if (!param)
				continue;
			this.appendChild(new Ph_DropDownEntry(param, dropDown, this, this.parentEntry));
		}
	}

	toggleMenu() {
		if (this.isExpanded)
			this.closeMenu(false);
		else
			this.showMenu();
	}

	showMenu() {
		this.isExpanded = true;
		this.classList.add("show");
		this.classList.remove("remove");
		setTimeout(() => window.addEventListener("click", this.cancelMenuFuncRef), 0);
	}
	
	closeMenu(closeAllPrevious) {
		this.isExpanded = false;
		this.classList.remove("show");
		this.classList.add("remove");
		window.removeEventListener("click", this.cancelMenuFuncRef);
		if (this.parentEntry && !closeAllPrevious)
			(this.parentEntry.parentElement as Ph_DropDownArea).showMenu();
	}
	
	cancelMenu(e) {
		if (!this.contains(e.target))
			this.closeMenu(true);
		
		e.stopPropagation();
	}
}

customElements.define("ph-drop-down-area", Ph_DropDownArea);
