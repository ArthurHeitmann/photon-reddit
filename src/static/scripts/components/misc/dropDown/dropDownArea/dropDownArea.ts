import {hasParams} from "../../../../utils/utils";
import Ph_DropDown from "../dropDown";
import Ph_DropDownEntry, {DropDownEntryParam} from "../dropDownEntry/dropDownEntry";

/**
 * Contains one level of drop down entries
 */
export default class Ph_DropDownArea extends HTMLElement {
	private parentEntry: Ph_DropDownEntry = null;
	private isExpanded = false;
	private cancelMenuFuncRef: (e) => void;
	private isInitialized = false;
	private params: DropDownEntryParam[] = [];
	private dropdown: Ph_DropDown;

	constructor(entryParams: DropDownEntryParam[], dropDown: Ph_DropDown, parentEntry?: Ph_DropDownEntry) {
		super();
		if (!hasParams(arguments)) return;

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.classList.add("dropDownArea");
		this.classList.add("remove");

		if (parentEntry)
			this.parentEntry = parentEntry;
		this.params = entryParams;
		this.dropdown = dropDown;
	}

	setEntries(entryParams: DropDownEntryParam[]) {
		this.params = entryParams;
		if (this.isInitialized)
			this.initializeParams(entryParams);
	}

	addEntries(entryParams: DropDownEntryParam[]) {
		this.params.push(...entryParams);
		if (this.isInitialized) {
			for (const param of entryParams)
				this.initializeParam(param);
		}
	}

	removeParam(entryParam: DropDownEntryParam) {
		const paramIndex = this.params.findIndex(p => p === entryParam);
		if (paramIndex === -1)
			return;
		this.params.splice(paramIndex, 1);
		if (this.isInitialized)
			this.children[paramIndex].remove();
	}

	updateParam(entryParam: DropDownEntryParam) {
		const paramIndex = this.params.findIndex(p => p === entryParam);
		if (paramIndex === -1)
			return;
		if (this.isInitialized)
			(this.children[paramIndex] as Ph_DropDownEntry)?.updateParam(entryParam);
	}

	private initializeParams(entryParams: DropDownEntryParam[]) {
		this.innerText = "";

		for (const param of entryParams) {
			if (!param)
				continue;
			this.appendChild(new Ph_DropDownEntry(param, this.dropdown, this, this.parentEntry));
		}
	}

	private initializeParam(entryParam: DropDownEntryParam) {
		this.innerText = "";
		if (!entryParam)
			return;
		this.appendChild(new Ph_DropDownEntry(entryParam, this.dropdown, this, this.parentEntry));
	}

	private checkInitialization() {
		if (this.isInitialized)
			return;

		this.initializeParams(this.params);
		this.isInitialized = true;
		this.dropdown = null;
	}

	toggleMenu() {
		if (this.isExpanded)
			this.closeMenu(false);
		else
			this.showMenu();
	}

	showMenu() {
		this.checkInitialization();

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
