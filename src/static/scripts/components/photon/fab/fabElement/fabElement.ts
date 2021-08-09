import { linksToSpa } from "../../../../utils/htmlStuff";
import { makeElement } from "../../../../utils/utils";
import Ph_Fab from "../fab";

export type onClickAction = string | (() => boolean | void);
export enum FabElementSize {
	normal = "normal", small = "small"
}

export default class Ph_FabElement extends HTMLElement {
	icon: HTMLElement;
	angle: number;
	distance: number;

	constructor(imgSrc: string, onClick: onClickAction, onRemoved: (elem: Ph_FabElement) => void, angle: number = 0, distance = 10, size: FabElementSize = FabElementSize.normal) {
		super();

		this.classList.add("fabElement");
		this.classList.add(size);
		this.style.setProperty("--img", `url("${imgSrc}")`);
		this.angle = angle;
		this.distance = distance;
		this.calculateXY();

		if (size === FabElementSize.normal) {
			const editButton = makeElement("button", { "class": "subFab shadow-diffuse", "data-tooltip": "Edit" },
				[makeElement("img", { "src": "/img/edit.svg", "alt": "edit" })]);
			const moveButton = makeElement("button", { "class": "subFab shadow-diffuse", "data-tooltip": "Move" },
				[makeElement("img", { "src": "/img/drag.svg", "alt": "move" })]);
			const deleteButton = makeElement("button", { "class": "subFab shadow-diffuse", "data-tooltip": "Delete" },
				[makeElement("img", { "src": "/img/delete.svg", "alt": "delete" })]);
			this.append(moveButton, deleteButton, editButton);
		}

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
		this.angle = angle;
		this.distance = distance;
		this.calculateXY();
	}

	private calculateXY() {
		const x = Math.cos(this.angle * Math.PI / 180) * this.distance;
		const y = -Math.sin(this.angle * Math.PI / 180) * this.distance;

		this.style.setProperty("--x", `${x}rem`);
		this.style.setProperty("--y", `${y}rem`);
	}
}

customElements.define("ph-fab-element", Ph_FabElement);
