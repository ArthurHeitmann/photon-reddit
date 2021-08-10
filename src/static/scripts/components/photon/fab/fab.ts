import { nonDraggableImage } from "../../../utils/htmlStatics";
import { elementWithClassInTree } from "../../../utils/htmlStuff";
import { bufferedMouseLeave, makeElement } from "../../../utils/utils";
import { PhotonSettings } from "../../global/photonSettings/photonSettings";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Ph_FabElement, { FabElementSize } from "./fabElement/fabElement";

interface LayerConfiguration {
	distance: number;
	maxElementCount: number;
}

const layerConfigurations: LayerConfiguration[] = [
	{ distance: 6, maxElementCount: 3 },
	{ distance: 10, maxElementCount: 5 },
	{ distance: 14, maxElementCount: 6 },
	{ distance: 18, maxElementCount: 8 },
	{ distance: 22, maxElementCount: 9 },
];
const maxElementCount = layerConfigurations.reduce((prev, curr) => prev + curr.maxElementCount, 0);

export default class Ph_Fab extends HTMLElement {
	fabElements: Ph_FabElement[] = [];

	constructor() {
		super();

		this.classList.add("floatingActionButton");

		const rootButton = makeElement("button", { "class": "rootElement" }, [
			nonDraggableImage(makeElement("img", { "src": "/img/logo.png", "class": "bg", "draggable": "false" }) as HTMLImageElement),
			nonDraggableImage(makeElement("img", { "src": "/img/edit.svg", "class": "edit start", "draggable": "false" }) as HTMLImageElement),
			nonDraggableImage(makeElement("img", { "src": "/img/check.svg", "class": "edit end", "draggable": "false" }) as HTMLImageElement),
		]);
		rootButton.addEventListener("click", this.toggleEditing.bind(this));
		this.append(rootButton);

		this.append(...this.fabElements = [
			// new Ph_FabElement("/img/envelope.svg", "/message/inbox"),
			// new Ph_FabElement("/img/earth.svg", "/r/all"),
			// new Ph_FabElement("/img/earth.svg", "/r/all"),
			// new Ph_FabElement("/img/settings1.svg", () => true),
		]);
		this.addElement();
		this.recalculatePositions();

		const addElementButton = new Ph_FabElement("/img/add.svg", this.addElement.bind(this), this.onElementRemoved.bind(this),
			-45, 3.75, FabElementSize.small);
		// const disableFabButton = new Ph_FabElement("/img/delete.svg",
		// 	() => void new Ph_Toast(Level.info, "Remove FAB? (can be reenabled in the settings)", { groupId: "disabled FAB", onConfirm: () => this.setIsEnabled(false) }),
		// 	this.onElementRemoved.bind(this), -20, 3.75, FabElementSize.small);
		addElementButton.classList.add("editingOnlyVisible");
		// disableFabButton.classList.add("editingOnlyVisible");
		this.append(addElementButton/*, disableFabButton*/);

		this.addEventListener("mouseenter", this.show.bind(this));
		bufferedMouseLeave(this, 400, this.hide.bind(this));

		window.addEventListener("ph-settings-changed", (e: CustomEvent) => {
			const changed = e.detail as PhotonSettings;
			if (!("enableFab" in changed))
				return;
			this.setIsEnabled(changed.enableFab);
		});
	}

	addElement() {
		if (this.fabElements.length === maxElementCount) {
			new Ph_Toast(Level.warning, "Limit reached", { groupId: "fab limit reached", timeout: 2000 });
			return;
		}
		const img = ["earth", "trendUp", "add", "envelope"];
		const rand = Math.floor(Math.random() * img.length);
		const newElement = new Ph_FabElement(`/img/${img[rand]}.svg`,
			() => void new Ph_Toast(Level.info, "No action assigned", { timeout: 2000, groupId: "fab elem no action" }),
			this.onElementRemoved.bind(this));
		this.fabElements.push(newElement);
		this.append(newElement);
		this.recalculatePositions();
		return true;
	}

	recalculatePositions() {
		let remainingElements = this.fabElements;
		let layer = 0;
		while (remainingElements.length) {
			const newLayer = remainingElements.slice(0, layerConfigurations[layer].maxElementCount);
			remainingElements = remainingElements.slice(layerConfigurations[layer].maxElementCount);
			for (let i = 0; i < newLayer.length; i++) {
				newLayer[i].setAngleAndDistance(
					newLayer.length > 1
						 ? i * -90 / (newLayer.length - 1)
						: -45
					,
					layerConfigurations[layer].distance
				);
			}
			++layer;
		}
		this.style.setProperty("--last-layer-distance", `${layerConfigurations[layer - 1]?.distance ?? 0.5}rem`);
	}

	onElementRemoved(elem: Ph_FabElement) {
		const elemIndex = this.fabElements.findIndex(e => e === elem);
		this.fabElements.splice(elemIndex, 1);
		this.recalculatePositions();
	}

	toggleEditing() {
		this.classList.toggle("editing");
	}

	show() {
		this.classList.add("show");
	}

	hide() {
		if (this.classList.contains("editing"))
			return;
		this.classList.remove("show");
	}

	swap2FabElements(elem1: Ph_FabElement, elem2: Ph_FabElement) {
		let index1 = this.fabElements.findIndex(e => e === elem1);
		let index2 = this.fabElements.findIndex(e => e === elem2);
		if (index1 > index2) {
			const tmpIndex = index1;
			index1 = index2;
			index2 = tmpIndex;
			const tmpElem = elem1;
			elem1 = elem2;
			elem2 = tmpElem;
		}
		this.fabElements.splice(index1, 1, elem2);
		this.fabElements.splice(index2, 1, elem1);
	}

	setIsDragging(isDragging: boolean, dragged: Ph_FabElement) {
		this.classList.toggle("isDragging", isDragging);
		for (const fabElement of this.fabElements) {
			fabElement.setIsDraggableTarget(isDragging, dragged);
		}
	}

	setIsEnabled(isEnabled: boolean) {
		this.classList.toggle("remove", !isEnabled);
	}

	static getRoot(elem: Ph_FabElement): Ph_Fab {
		return elementWithClassInTree(elem, "floatingActionButton") as Ph_Fab;
	}
}

customElements.define("ph-fab", Ph_Fab);

window.addEventListener("load", () => document.body.append(new Ph_Fab()));
