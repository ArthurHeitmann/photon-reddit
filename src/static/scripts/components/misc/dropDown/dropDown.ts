import Ph_DropDownArea from "./dropDownArea/dropDownArea.js";
import { DropDownEntryParam } from "./dropDownEntry/dropDownEntry.js";

/**
 * A drop down menu. Can have infinite sub drop downds
 */
export default class Ph_DropDown extends HTMLElement {
	toggleButton: HTMLButtonElement;

	/**
	 * @param entryParams parameters for the individual entries
	 * @param toggleButtonHTML innerHTML of the button that shows or hides the drop down
	 * @param dirX to what edge should the drop down stick
	 * @param dirY in what direction should the drop down expand
	 * @param sameLineY should the drop down overlap with the toggle button on the y axis
	 */
	constructor(entryParams: DropDownEntryParam[], toggleButtonHTML: string, dirX: DirectionX, dirY: DirectionY, sameLineY: boolean) {
		super();

		this.classList.add("dropDown");

		if (typeof toggleButtonHTML === "string") {
			this.toggleButton = document.createElement("button");
			this.toggleButton.className = "button dropDownButton";
			this.toggleButton.innerHTML = toggleButtonHTML;
			this.appendChild(this.toggleButton);
		}

		const areaWrapper = document.createElement("div");
		areaWrapper.className = `areaWrapper ${dirX} ${dirY} ${sameLineY ? "sameLine" : ""}`;
		this.appendChild(areaWrapper);

		const dropDownArea = new Ph_DropDownArea(entryParams, this)
		areaWrapper.appendChild(dropDownArea);
		if (this.toggleButton)
			this.toggleButton.addEventListener("click", dropDownArea.toggleMenu.bind(dropDownArea));
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

customElements.define("ph-drop-down", Ph_DropDown);
