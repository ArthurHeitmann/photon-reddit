import Ph_DropDown, { ButtonLabel } from "../dropDown.js";
import Ph_DropDownArea from "../dropDownArea/dropDownArea.js";

export default class Ph_DropDownEntry extends HTMLButtonElement {
	/** Each drop down entry has value. With nested drop downs this is includes the values of all preview drop downs */
	valueChain: any[];
	nextDropDown: Ph_DropDownArea = null;
	/** Content of this entry */
	label: HTMLDivElement;
	dropDown: Ph_DropDown;

	/**
	 * @param param determines content & behaviour of this entry
	 * @param dropDown
	 * @param dropDownArea
	 * @param parentEntry When nested, parentEntry has to be clicked to get to this entry
	 */
	constructor(param: DropDownEntryParam, dropDown: Ph_DropDown, dropDownArea: Ph_DropDownArea, parentEntry?: Ph_DropDownEntry) {
		super();

		this.dropDown = dropDown;
		this.classList.add("dropDownEntry");

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
			expandList.innerHTML = `<img src="/img/rightArrow.svg" class="nextMenu" alt="next">`;
			this.appendChild(expandList);

			this.nextDropDown = new Ph_DropDownArea(param.nestedEntries, null, this);
			setTimeout(() => dropDownArea.insertAdjacentElement("afterend", this.nextDropDown), 0);
			this.nextDropDown.classList.add("remove");
		}

		this.addEventListener("click", () => {
			if (param.nestedEntries) {
				this.nextDropDown.showMenu();
				dropDownArea.closeMenu();
			}
			else if (param.onSelectCallback) {
				param.onSelectCallback(
					this.valueChain,
					(newLabel) => this.dropDown.setLabel(newLabel),
					this.dropDown.getLabel(),
					this
				);
				dropDownArea.closeMenu(true);
			}
		});
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
	 */
	onSelectCallback?: (valueChain: any[], setButtonLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement, source: Ph_DropDownEntry) => void,
	/** When clicking this entry don't execute an action, instead show the next nested drop down */
	nestedEntries?: DropDownEntryParam[]
}

customElements.define("ph-drop-down-entry", Ph_DropDownEntry, { extends: "button" });
