import { Ph_Feed } from "../../feed/feed.js";
import Ph_DropDownArea from "./dropDownArea/dropDownArea.js";
import Ph_DropDownEntry, { DropDownEntryParam } from "./dropDownEntry/dropDownEntry.js";

export default class Ph_DropDown extends HTMLElement {
	feed: Ph_Feed;
	toggleButton: HTMLButtonElement;

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

export enum DirectionX {
	left = "dirLeft", center = "dirCenter", right = "dirRight"
}

export enum DirectionY {
	top = "dirTop", center = "dirCenter", bottom = "dirBottom"
}

customElements.define("ph-drop-down", Ph_DropDown);
