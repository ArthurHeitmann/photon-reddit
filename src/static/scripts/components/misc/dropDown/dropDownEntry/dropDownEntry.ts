import { isElementIn } from "../../../../utils/htmlStuff.js";
import Ph_DropDown, { ButtonLabel } from "../dropDown.js";
import Ph_DropDownArea from "../dropDownArea/dropDownArea.js";

export default class Ph_DropDownEntry extends HTMLButtonElement {
	/** Each drop down entry has value. With nested drop downs this is includes the values of all preview drop downs */
	valueChain: any[];
	nextDropDown: Ph_DropDownArea = null;
	/** Content of this entry */
	label: HTMLDivElement;
	dropDown: Ph_DropDown;
	dropDownArea: Ph_DropDownArea;

	/**
	 * @param param determines content & behaviour of this entry
	 * @param dropDown
	 * @param dropDownArea
	 * @param parentEntry When nested, parentEntry has to be clicked to get to this entry
	 */
	constructor(param: DropDownEntryParam, dropDown: Ph_DropDown, dropDownArea: Ph_DropDownArea, parentEntry?: Ph_DropDownEntry) {
		super();

		this.dropDown = dropDown;
		this.dropDownArea = dropDownArea;
		this.classList.add("dropDownEntry");
		if (param.nonSelectable)
			this.classList.add("nonSelectable");

		if (parentEntry)
			this.valueChain = [...parentEntry.valueChain, param.value];
		else
			this.valueChain = [param.value];

		this.label = document.createElement("div");
		if (param.displayElement)
			this.label.appendChild(param.displayElement);
		else
			this.label.innerHTML = param.displayHTML;
		this.appendChild(this.label);

		if (param.nestedEntries && param.nestedEntries.length > 0) {
			const expandList = document.createElement("div");
			expandList.className = "nextMenuWrapper";
			expandList.innerHTML = `<img src="/img/rightArrow.svg" class="nextMenu" alt="next">`;
			this.appendChild(expandList);

			this.nextDropDown = new Ph_DropDownArea(param.nestedEntries, this.dropDown, this);
			if (this.isConnected)
				this.insertNextDropdown();
			this.nextDropDown.classList.add("remove");
		}

		if (param.nonSelectable !== true) {
			this.addEventListener("click", e => {
				// if inside this entry is a focused <input> ignore
				if (document.activeElement?.tagName === "INPUT" && isElementIn(this, document.activeElement as HTMLElement))
					return;
				// open next nesting level
				if (param.nestedEntries) {
					dropDownArea.closeMenu(true);
					this.nextDropDown.showMenu();
				}
				// call callback
				if (param.onSelectCallback) {
					const shouldBeOpen = param.onSelectCallback(
						this.valueChain,
						(newLabel) => this.dropDown.setLabel(newLabel),
						this.dropDown.getLabel(),
						this
					) || false;
					if (!shouldBeOpen || shouldBeOpen instanceof Promise)
						dropDownArea.closeMenu(true);
				}
			});
		}
	}

	connectedCallback() {
		if (this.nextDropDown && !this.nextDropDown.parentElement)
			this.insertNextDropdown();
	}

	insertNextDropdown() {
		this.dropDownArea.insertAdjacentElement("afterend", this.nextDropDown);
	}

	setText(text: string) {
		this.label.innerHTML = text;
	}
}

export interface DropDownEntryParam {
	/** innerHTML of the label, if empty displayElement has to be set */
	displayHTML?: string,
	/** child element of the label, if empty displayHTML has to be set */
	displayElement?: HTMLElement,
	/** the value associated with this entry, will be passed to onSelectCallback */
	value?: any,
	/**
	 * called when the user clicks on this entry (not if this expands to a nested drop down)
	 *
	 * @param valueChain values of this and all previous entries
	 * @return if true the dropdown should NOT be closed after the click, Promise is equal to false
	 */
	onSelectCallback?: (valueChain: any[], setButtonLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement, source: Ph_DropDownEntry) => boolean | Promise<any> | undefined,
	/** When clicking this entry don't execute an action, instead show the next nested drop down */
	nestedEntries?: DropDownEntryParam[],
	/** if true --> this entry will not be clickable */
	nonSelectable?: boolean
}

customElements.define("ph-drop-down-entry", Ph_DropDownEntry, { extends: "button" });
