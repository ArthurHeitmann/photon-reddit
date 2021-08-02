import { isElementIn } from "../../../../utils/htmlStuff.js";
import { hasParams } from "../../../../utils/utils.js";
import Ph_DropDown, { ButtonLabel } from "../dropDown.js";
import Ph_DropDownArea from "../dropDownArea/dropDownArea.js";

export default class Ph_DropDownEntry extends HTMLElement {
	/** Each drop down entry has value. With nested drop downs this is includes the values of all preview drop downs */
	valueChain: any[];
	nextDropDown: Ph_DropDownArea = null;
	/** Content of this entry */
	label: HTMLDivElement;
	dropDown: Ph_DropDown;
	dropDownArea: Ph_DropDownArea;
	parentEntry: Ph_DropDownEntry = null;
	labelImg: HTMLElement;

	/**
	 * @param param determines content & behaviour of this entry
	 * @param dropDown
	 * @param dropDownArea
	 * @param parentEntry When nested, parentEntry has to be clicked to get to this entry
	 */
	constructor(param: DropDownEntryParam, dropDown: Ph_DropDown, dropDownArea: Ph_DropDownArea, parentEntry?: Ph_DropDownEntry) {
		super();
		if (!hasParams(arguments)) return;

		this.dropDown = dropDown;
		this.dropDownArea = dropDownArea;
		this.classList.add("dropDownEntry");
		if (param.nonSelectable)
			this.classList.add("nonSelectable");

		if (parentEntry) {
			this.valueChain = [...parentEntry.valueChain, param.value];
			this.parentEntry = parentEntry;
		}
		else
			this.valueChain = [param.value];

		this.labelImg = document.createElement("div");
		this.labelImg.className = "labelImg";
		if (param.labelImgUrl) {
			this.append(this.labelImg);
			this.setLabelImg(param.labelImgUrl);
		}

		this.label = document.createElement("div");
		this.label.className = "label";
		if (param.label instanceof  HTMLElement)
			this.label.append(param.label);
		else
			this.label.innerText = param.label;
		this.append(this.label);

		if (param.nestedEntries && param.nestedEntries.length > 0) {
			const expandList = document.createElement("div");
			expandList.className = "nextMenuWrapper";
			this.append(expandList);

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
					const shouldBeOpen = param.onSelectCallback(<DropDownActionData> {
						valueChain: this.valueChain,
						setButtonLabel: (newLabel) => this.dropDown.setLabel(newLabel),
						initialLabel: this.dropDown.getLabel(),
						source: this
					})
						|| false;
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

	setLabel(text: ButtonLabel) {
		if (text instanceof HTMLElement) {
			this.label.innerText = "";
			this.label.appendChild(text);
		}
		else
			this.label.innerText = text;
	}

	setLabelImg(url: string) {
		if (!this.labelImg.isConnected)
			this.insertAdjacentElement("afterbegin", this.labelImg);
		this.labelImg.style.setProperty("--img-url", `url("${url}")`);
	}
}

export interface DropDownEntryParam {
	labelImgUrl?: string,
	/** innerText or HTMLElement of the label */
	label?: string | HTMLElement,
	/** the value associated with this entry, will be passed to onSelectCallback */
	value?: any,
	/**
	 * called when the user clicks on this entry (not if this expands to a nested drop down)
	 *
	 * @param valueChain values of this and all previous entries
	 * @return if true the dropdown should NOT be closed after the click, Promise is equal to false
	 */
	onSelectCallback?: (data: DropDownActionData) => boolean | Promise<any> | void,
	/** When clicking this entry don't execute an action, instead show the next nested drop down */
	nestedEntries?: DropDownEntryParam[],
	/** if true --> this entry will not be clickable */
	nonSelectable?: boolean
}

export interface DropDownActionData {
	valueChain: any[],
	setButtonLabel: (newLabel: ButtonLabel) => void,
	initialLabel: HTMLElement,
	source: Ph_DropDownEntry
}

customElements.define("ph-drop-down-entry", Ph_DropDownEntry);
