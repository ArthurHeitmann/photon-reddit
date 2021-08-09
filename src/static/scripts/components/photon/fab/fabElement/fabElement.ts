import { linksToSpa } from "../../../../utils/htmlStuff";
import { makeElement } from "../../../../utils/utils";
import Ph_Fab from "../fab";

export type onClickAction = string | (() => boolean | void);
export enum FabElementSize {
	normal = "normal", small = "small"
}

export default class Ph_FabElement extends HTMLElement {
	icon: HTMLElement;

	constructor(imgSrc: string, onClick: onClickAction, onRemoved: (elem: Ph_FabElement) => void, angle: number = 0, distance = 10, size: FabElementSize = FabElementSize.normal) {
		super();

		this.classList.add("fabElement");
		this.classList.add(size);
		this.style.setProperty("--img", `url("${imgSrc}")`);
		this.style.setProperty("--angle", `${angle}`);
		this.style.setProperty("--distance", `${distance}rem`);

		this.icon = makeElement(typeof onClick === "string" ? "a" : "button", { "class": "icon clickable shadow-diffuse" });
		this.append(this.icon);
		if (typeof onClick === "string") {
			this.icon.setAttribute("href", onClick);
			linksToSpa(this);
		}
		this.icon.addEventListener("click", () => this.onClickWrapper(onClick));
	}

	onClickWrapper(onClick: onClickAction) {
		if (!this.icon.classList.contains("clickable"))
			return;
		let closeAfterClick = true;
		if (typeof onClick === "function")
			closeAfterClick = onClick() !== true;
		if (closeAfterClick)
			Ph_Fab.getRoot(this)?.hide();
	}

	setAngleAndDistance(angle: number, distance: number) {
		this.style.setProperty("--angle", `${angle}`);
		this.style.setProperty("--distance", `${distance}rem`);
	}
}

customElements.define("ph-fab-element", Ph_FabElement);
