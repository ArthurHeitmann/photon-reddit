import { disableMainScroll, enableMainScroll, nonDraggableElement } from "../../../../utils/htmlStatics";
import { elementWithClassInTree, linksToSpa } from "../../../../utils/htmlStuff";
import { bufferedMouseLeave, clientXOfEvent, clientYOfEvent, makeElement } from "../../../../utils/utils";
import Ph_Fab from "../fab";
import { FabPreset, FunctionActions } from "../fabElementConfig";
import Ph_FabElementEditPane from "../fabElementEditPane/fabElementEditPane";

export type OnClickAction = string | (() => boolean | void);
export enum FabElementSize {
	normal = "normal", small = "small"
}

export default class Ph_FabElement extends HTMLElement {
	activePreset: FabPreset;
	iconWrapper: HTMLElement;
	editPane: Ph_FabElementEditPane;
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

	constructor(onRemoved: (elem: Ph_FabElement) => void, imgSrc?: string, onClick?: OnClickAction, angle: number = 0, distance = 10, size: FabElementSize = FabElementSize.normal) {
		super();

		this.classList.add("fabElement");
		this.classList.add(size);
		this.setIcon(imgSrc);
		this.onRemovedCallback = onRemoved;
		this.angle = angle;
		this.distance = distance;
		this.calculateXY();

		if (size === FabElementSize.normal) {
			this.editPane = new Ph_FabElementEditPane(this);
			const editButton = makeElement("button", { class: "subFab shadow-diffuse", onclick: () => {
				this.classList.add("editPaneOpen");
				this.editPane.show();
			}},
				[makeElement("img", { "src": "/img/edit.svg", "alt": "edit" })]);
			bufferedMouseLeave(this, 400, () => {
				this.classList.remove("editPaneOpen");
				this.editPane.hide();
			});
			const moveButton = makeElement("button", { class: "subFab shadow-diffuse", onmousedown: this.startDrag.bind(this) },
				[nonDraggableElement(makeElement("img", { "src": "/img/drag.svg", "alt": "move", "draggable": "false" }) as HTMLImageElement)]);
			moveButton.addEventListener("touchstart", this.startDrag.bind(this), { passive: true })
			this.onMouseMoveCallback = this.onMouseMove.bind(this);
			this.onMouseUpCallback = this.endDrag.bind(this);
			const deleteButton = makeElement("button", { class: "subFab shadow-diffuse", onclick: this.delete.bind(this) },
				[makeElement("img", { "src": "/img/delete.svg", "alt": "delete" })]);
			this.append(moveButton, deleteButton, editButton);
			this.append(this.editPane);
		}

		this.iconWrapper = makeElement("div", { class: "iconWrapper" });
		this.append(this.iconWrapper);
		this.setAction(onClick);
	}

	onClickWrapper(onClick: OnClickAction) {
		let closeAfterClick = true;
		if (typeof onClick === "function")
			closeAfterClick = onClick() !== true;
		if (closeAfterClick)
			Ph_Fab.getRoot(this)?.hide();
	}

	delete() {
		this.remove();
		this.onRemovedCallback?.(this);
		this.onRemovedCallback = null;
	}

	setIcon(imgSrc: string) {
		this.style.setProperty("--img", `url("${imgSrc}")`);
	}

	loadPreset(preset: FabPreset) {
		if (!this.activePreset) {
			this.activePreset = preset;
			this.editPane.setActivePreset(preset);
		}
		else
			this.activePreset = preset;
		this.setIcon(preset.icon.url);
		this.setAction(preset.action.type === "url" ? preset.action.action : FunctionActions[preset.action.action])
	}

	setAction(action: OnClickAction) {
		this.iconWrapper.innerText = "";
		const actionElement = nonDraggableElement(makeElement(
			typeof action === "string" ? "a" : "button",
			{ class: "icon", draggable: "false" }
		));
		this.iconWrapper.append(actionElement);
		this.iconWrapper.onclick = () => this.onClickWrapper(action);
		if (typeof action === "string") {
			actionElement.setAttribute("href", action);
			linksToSpa(actionElement);
		}
	}

	startDrag(e: MouseEvent | TouchEvent) {
		this.classList.add("draggable");
		Ph_Fab.getRoot(this).setIsDragging(true, this);
		window.addEventListener("mousemove", this.onMouseMoveCallback);
		window.addEventListener("mouseup", this.onMouseUpCallback);
		window.addEventListener("touchmove", this.onMouseMoveCallback);
		window.addEventListener("touchend", this.onMouseUpCallback);
		this.dragStartX = clientXOfEvent(e);
		this.dragStartY = clientYOfEvent(e);
		if (e instanceof  TouchEvent)
			disableMainScroll();
	}

	endDrag(e: MouseEvent | TouchEvent) {
		this.classList.remove("draggable");
		Ph_Fab.getRoot(this).setIsDragging(false, this);
		window.removeEventListener("mousemove", this.onMouseMoveCallback);
		window.removeEventListener("mouseup", this.onMouseUpCallback);
		window.removeEventListener("touchmove", this.onMouseMoveCallback);
		window.removeEventListener("touchend", this.onMouseUpCallback);
		if (this.dragTarget) {
			Ph_Fab.getRoot(this).swap2FabElements(this, this.dragTarget);
			this.dragTarget.classList.remove("dragTarget");
			this.dragTarget = null;
		}
		Ph_Fab.getRoot(this).recalculatePositions();
		enableMainScroll();
	}

	onMouseMove(e: MouseEvent | TouchEvent) {
		const deltaX = clientXOfEvent(e) - this.dragStartX;
		const deltaY = clientYOfEvent(e) - this.dragStartY;
		this.style.setProperty("--x", `calc(${this.cordX}rem + ${deltaX}px)`);
		this.style.setProperty("--y", `calc(${this.cordY}rem + ${-deltaY}px)`);
		const hoveredElem = document.elementFromPoint(clientXOfEvent(e), clientYOfEvent(e)) as HTMLElement;
		const hoveredFabElement = elementWithClassInTree(hoveredElem, "fabElement") as Ph_FabElement;
		if (hoveredFabElement && hoveredFabElement.classList.contains("normal")) {
			if (hoveredFabElement !== this.dragTarget) {
				this.dragTarget?.classList.remove("dragTarget");
				this.dragTarget = hoveredFabElement;
				this.dragTarget.classList.add("dragTarget");

			}
		}
		else {
			this.dragTarget?.classList.remove("dragTarget");
			this.dragTarget = null;
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
