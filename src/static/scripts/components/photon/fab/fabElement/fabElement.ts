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
	cordX: number;
	cordY: number;
	onRemovedCallback: (elem: Ph_FabElement) => void;
	onMouseMoveCallback: (e: MouseEvent) => void;
	onMouseUpCallback: (e: MouseEvent) => void;
	dragStartX: number;
	dragStartY: number;
	dragTarget: Ph_FabElement;
	dragTargetEnterCallback: () => void;
	dragTargetLeaveCallback: () => void;

	constructor(imgSrc: string, onClick: onClickAction, onRemoved: (elem: Ph_FabElement) => void, angle: number = 0, distance = 10, size: FabElementSize = FabElementSize.normal) {
		super();

		this.classList.add("fabElement");
		this.classList.add(size);
		this.style.setProperty("--img", `url("${imgSrc}")`);
		this.onRemovedCallback = onRemoved;
		this.angle = angle;
		this.distance = distance;
		this.calculateXY();

		if (size === FabElementSize.normal) {
			const editButton = makeElement("button", { "class": "subFab shadow-diffuse" },
				[makeElement("img", { "src": "/img/edit.svg", "alt": "edit" })]);
			const moveButton = makeElement("button", { "class": "subFab shadow-diffuse" },
				[makeElement("img", { "src": "/img/drag.svg", "alt": "move", "draggable": "false" })]);
			moveButton.addEventListener("mousedown", this.startDrag.bind(this));
			this.onMouseMoveCallback = this.onMouseMove.bind(this);
			this.onMouseUpCallback = this.endDrag.bind(this);
			const deleteButton = makeElement("button", { "class": "subFab shadow-diffuse" },
				[makeElement("img", { "src": "/img/delete.svg", "alt": "delete" })]);
			deleteButton.addEventListener("click", this.delete.bind(this));
			this.append(moveButton, deleteButton, editButton);
		}

		this.icon = makeElement(typeof onClick === "string" ? "a" : "button", { "class": "icon clickable", draggable: "false" });
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

	delete() {
		this.remove();
		this.onRemovedCallback(this);
		this.onRemovedCallback = null;
	}

	startDrag(e: MouseEvent) {
		this.classList.add("draggable");
		Ph_Fab.getRoot(this).setIsDragging(true, this);
		window.addEventListener("mousemove", this.onMouseMoveCallback);
		window.addEventListener("mouseup", this.onMouseUpCallback);
		this.dragStartX = e.clientX;
		this.dragStartY = e.clientY;
	}

	endDrag(e: MouseEvent) {
		this.classList.remove("draggable");
		Ph_Fab.getRoot(this).setIsDragging(false, this);
		window.removeEventListener("mousemove", this.onMouseMoveCallback);
		window.removeEventListener("mouseup", this.onMouseUpCallback);
		if (this.dragTarget) {
			Ph_Fab.getRoot(this).swap2FabElements(this, this.dragTarget);
			this.dragTarget.classList.remove("dragTarget");
			this.dragTarget = null;
		}
		Ph_Fab.getRoot(this).recalculatePositions();
	}

	onMouseMove(e: MouseEvent) {
		const deltaX = e.clientX - this.dragStartX;
		const deltaY = e.clientY - this.dragStartY;
		this.style.setProperty("--x", `calc(${this.cordX}rem + ${deltaX}px)`);
		this.style.setProperty("--y", `calc(${this.cordY}rem + ${-deltaY}px)`);
	}

	reportTargetStatus(target: Ph_FabElement, isPossibleTarget: boolean) {
		if (target === this)
			return;
		if (!isPossibleTarget && this.dragTarget === target) {
			this.dragTarget?.classList.remove("dragTarget");
			this.dragTarget = null;
		}
		else if (isPossibleTarget) {
			this.dragTarget = target;
			this.dragTarget?.classList.add("dragTarget");
		}
	}

	setIsDraggableTarget(isTarget: boolean, dragged: Ph_FabElement) {
		if (isTarget) {
			this.addEventListener("mouseenter", this.dragTargetEnterCallback =
				() => dragged.reportTargetStatus(this, true));
			this.addEventListener("mouseleave", this.dragTargetLeaveCallback =
				() => dragged.reportTargetStatus(this, false));
		}
		else {
			this.removeEventListener("mouseenter", this.dragTargetEnterCallback);
			this.removeEventListener("mouseleave", this.dragTargetLeaveCallback);
		}
	}

	setAngleAndDistance(angle: number, distance: number) {
		this.angle = angle;
		this.distance = distance;
		this.calculateXY();
	}

	private calculateXY() {
		this.cordX = Math.cos(this.angle * Math.PI / 180) * this.distance;
		this.cordY = -Math.sin(this.angle * Math.PI / 180) * this.distance;

		this.style.setProperty("--x", `${this.cordX}rem`);
		this.style.setProperty("--y", `${this.cordY}rem`);
	}
}

customElements.define("ph-fab-element", Ph_FabElement);
