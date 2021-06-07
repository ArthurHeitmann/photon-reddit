import { hasParams } from "../../../utils/utils.js";
import Ph_DropDownArea from "./dropDownArea/dropDownArea.js";
import { DropDownEntryParam } from "./dropDownEntry/dropDownEntry.js";

/**
 * A drop down menu. Can have infinite sub drop downds
 */
export default class Ph_DropDown extends HTMLElement {
	toggleButton: HTMLButtonElement;

	/**
	 * @param entryParams parameters for the individual entries
	 * @param buttonLabel label the button that shows or hides the drop down
	 * @param dirX to what edge should the drop down stick
	 * @param dirY in what direction should the drop down expand
	 * @param sameLineY should the drop down overlap with the toggle button on the y axis
	 */
	constructor(entryParams: DropDownEntryParam[], buttonLabel: ButtonLabel, dirX: DirectionX, dirY: DirectionY, sameLineY: boolean) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("dropDown");

		this.toggleButton = document.createElement("button");
		this.toggleButton.className = "button dropDownButton";
		this.appendChild(this.toggleButton);
		this.setLabel(buttonLabel)

		const areaWrapper = document.createElement("div");
		areaWrapper.className = `areaWrapper ${dirX} ${dirY} ${sameLineY ? "sameLine" : ""}`;
		this.appendChild(areaWrapper);

		const dropDownArea = new Ph_DropDownArea(entryParams, this)
		areaWrapper.appendChild(dropDownArea);
		if (this.toggleButton)
			this.toggleButton.addEventListener("click", dropDownArea.toggleMenu.bind(dropDownArea));
	}

	setEntries(params: DropDownEntryParam[]) {
		(this.$class("dropDownArea")[0] as Ph_DropDownArea).setEntries(params, this);
	}

	setLabel(newLabel: ButtonLabel) {
		if (typeof newLabel == "string")
			this.toggleButton.innerText = newLabel;
		else if (newLabel instanceof HTMLElement) {
			this.toggleButton.innerText = "";
			this.toggleButton.appendChild(newLabel);
		}
	}

	getLabel(): HTMLElement {
		return this.toggleButton.firstElementChild as HTMLElement;
	}
}

/** To which edge should the drop down stick */
export enum DirectionX {
	left = "dirLeft", right = "dirRight"
}

/** In which direction should the drop down expand */
export enum DirectionY {
	top = "dirTop", bottom = "dirBottom"
}

export type ButtonLabel = HTMLElement | string;

customElements.define("ph-drop-down", Ph_DropDown);
