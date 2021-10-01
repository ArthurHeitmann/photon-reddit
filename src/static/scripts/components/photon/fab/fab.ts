import { nonDraggableElement } from "../../../utils/htmlStatics";
import { elementWithClassInTree } from "../../../utils/htmlStuff";
import { bufferedMouseLeave, deepClone, makeElement, sleep } from "../../../utils/utils";
import { PhotonSettings } from "../../global/photonSettings/photonSettings";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";
import Ph_FabElement, { FabElementSize } from "./fabElement/fabElement";
import { defaultFabPresets, initialDefaultFabPresets } from "./fabElementConfig";

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
	isEditable: boolean = false;

	constructor() {
		super();

		this.classList.add("floatingActionButton");

		this.append(makeElement("button", {
			class: "rootElement",
			onclick: () => {
				this.show();
				this.toggleEditing();
			}
		}, [
			nonDraggableElement(makeElement("img", { "src": "/img/logo.png", class: "bg", "draggable": "false" }) as HTMLImageElement),
			nonDraggableElement(makeElement("img", { "src": "/img/edit.svg", class: "edit start", "draggable": "false" }) as HTMLImageElement),
			nonDraggableElement(makeElement("img", { "src": "/img/check.svg", class: "edit end", "draggable": "false" }) as HTMLImageElement),
		]));

		const addElementButton = new Ph_FabElement(null, "/img/add.svg", this.addElement.bind(this), -45, 3.75, FabElementSize.small);
		addElementButton.classList.add("editingOnlyVisible");
		this.append(addElementButton);

		this.addEventListener("mouseenter", this.show.bind(this));
		bufferedMouseLeave(this, 400, this.hide.bind(this));

		this.loadAllElementsFromLS().then(r => this.saveAllElements());

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
		const newElement = new Ph_FabElement(this.onElementRemoved.bind(this));
		this.append(newElement);
		newElement.loadPreset(deepClone(defaultFabPresets[0]));
		this.fabElements.push(newElement);
		this.recalculatePositions();
		this.saveAllElements();
		return true;
	}

	saveAllElements() {
		const allConfigs = this.fabElements
			.map(el => el.activePreset)
			.filter(el => Boolean(el));
		Users.global.set(["fabConfig"], allConfigs);
	}

	async loadAllElementsFromLS(_isSecondAttempt = false) {
		try {
			const presets = Users.global.d.fabConfig;
			for (const preset of presets) {
				const fabElement = new Ph_FabElement(this.onElementRemoved.bind(this));
				fabElement.loadPreset(preset);
				this.fabElements.push(fabElement);
				this.append(fabElement);
				await sleep(20)
			}
			this.recalculatePositions();
		} catch (e) {
			if (_isSecondAttempt)
				return;
			await Users.global.set(["fabConfig"], deepClone(initialDefaultFabPresets));
			await this.loadAllElementsFromLS(true);
		}
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
		this.saveAllElements();
	}

	toggleEditing() {
		if (!this.isEditable)
			return;
		this.classList.toggle("editing");
	}

	show() {
		this.classList.add("show");
		if (!this.isEditable)
			setTimeout(() => this.isEditable = true, 10);
	}

	hide() {
		if (this.classList.contains("editing"))
			return;
		this.classList.remove("show");
		this.isEditable = false;
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
		this.saveAllElements();
	}

	setIsDragging(isDragging: boolean, dragged: Ph_FabElement) {
		this.classList.toggle("isDragging", isDragging);
	}

	setIsEnabled(isEnabled: boolean) {
		this.classList.toggle("remove", !isEnabled);
	}

	static getRoot(elem: HTMLElement): Ph_Fab {
		return elementWithClassInTree(elem, "floatingActionButton") as Ph_Fab;
	}
}

customElements.define("ph-fab", Ph_Fab);

Users.ensureDataHasLoaded().then(() => document.body.append(new Ph_Fab()));
