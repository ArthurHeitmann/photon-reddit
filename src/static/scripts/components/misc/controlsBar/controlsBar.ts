import {nonDraggableElement} from "../../../utils/htmlStatics";
import {hasParams, isJsonEqual} from "../../../utils/utils";
import Ph_DropDown from "../dropDown/dropDown";
import Ph_DropDownArea from "../dropDown/dropDownArea/dropDownArea";
import Ph_DropDownEntry, {DropDownEntryParam} from "../dropDown/dropDownEntry/dropDownEntry";
import Ph_ProgressBar from "../progressBar/progressBar";
import Ph_SwitchingImage from "../switchableImage/switchableImage";

export interface ControlsLayoutSlots {
	firstLeftItems?: HTMLElement[],
	leftItems?: HTMLElement[],
	rightItems?: HTMLElement[],
	settingsEntries?: DropDownEntryParam[],
	settingsEntriesCurrent?: DropDownEntryParam[],
	progressBar?: Ph_ProgressBar,
}

/**
 * A bar with control elements. Needs a content element (addHowHideListeners()). Will show when the cursor hovers
 * the content element. Hides when the cursor doesn't move over the content element for a while.
 */
export default class Ph_ControlsBar extends HTMLElement {
	hideTimeout = null;
	contentElement: HTMLElement = null;
	firstLeftItemsSlot: HTMLDivElement;
	leftItemsSlot: HTMLDivElement;
	rightItemsSlot: HTMLDivElement;
	progressBar: Ph_ProgressBar;
	initialDropdownEntries: Ph_DropDownEntry[];

	constructor(isInitiallyVisible: boolean) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "controls";

		this.firstLeftItemsSlot = document.createElement("div");
		this.firstLeftItemsSlot.className = "slot";
		this.leftItemsSlot = document.createElement("div");
		this.leftItemsSlot.className = "slot";
		this.rightItemsSlot = document.createElement("div");
		this.rightItemsSlot.className = "slot";

		if (isInitiallyVisible)
			setTimeout(() => this.parentElement.classList.add("controlsVisible"), 0);
	}

	addShowHideListeners(contentElem: HTMLElement) {
		this.contentElement = contentElem;

		contentElem.addEventListener("mouseenter", this.onMouseEnterContent.bind(this));
		contentElem.addEventListener("mousemove", this.onMouseMoveContent.bind(this));
		this.addEventListener("mouseenter", this.onMouseEnterThis.bind(this))
		this.addEventListener("mouseleave", this.onMouseLeaveThis.bind(this));
	}

	setupSlots(elements: HTMLElement[]) {
		this.append(...elements);
		const dropdown = this.$class("dropDown")[0] as Ph_DropDown;
		if (!dropdown)
			return;
		this.initialDropdownEntries = dropdown.$classAr("dropDownEntry") as Ph_DropDownEntry[];
	}

	updateSlotsWith(newElements: ControlsLayoutSlots) {
		this.replaceSlotElements(this.firstLeftItemsSlot, newElements.firstLeftItems);
		this.replaceSlotElements(this.leftItemsSlot, newElements.leftItems);
		this.replaceSlotElements(this.rightItemsSlot, newElements.rightItems);
		this.progressBar?.remove();
		this.progressBar = newElements.progressBar;
		if (this.progressBar)
			this.append(this.progressBar);
		const dropDown = this.$class("dropDown")[0] as Ph_DropDown;
		const dropDownArea = dropDown.$class("dropDownArea ")[0] as Ph_DropDownArea;
		if (newElements.settingsEntries === undefined)
			newElements.settingsEntries = [];
		if (newElements.settingsEntriesCurrent === undefined)
			newElements.settingsEntriesCurrent = [];
		// add new entry
		const newEntries = newElements.settingsEntries
			.filter(entry => Boolean(entry))
			.filter(entry => !newElements.settingsEntriesCurrent
				.find(curEntry => entry === curEntry));
		for (const entry of newEntries)
			entry["lastState"] = this.entryToString(entry);
		newElements.settingsEntriesCurrent.push(...newEntries);
		dropDownArea.addEntries(newEntries);
		// remove old entries
		const removedEntries = newElements.settingsEntriesCurrent
			.filter(entry => Boolean(entry))
			.filter(entry => !newElements.settingsEntries
				.find(curEntry => isJsonEqual(entry, curEntry)));
		for (const entry of removedEntries) {
			const entryI = newElements.settingsEntriesCurrent.findIndex(e => entry === e);
			if (entryI !== -1)
				newElements.settingsEntriesCurrent.splice(entryI, 1);
			dropDownArea.removeParam(entry);
		}
		// changed entries
		const changedEntries = newElements.settingsEntries
			.filter(entry => Boolean(entry))
			.filter(entry => entry["lastState"] !== this.entryToString(entry));
		for (const entry of changedEntries) {
			dropDownArea.updateParam(entry);
			entry["lastState"] = this.entryToString(entry);
		}
	}

	private entryToString(entry: DropDownEntryParam): string {
		return  JSON.stringify({ ...entry, lastState: null });
	}

	private replaceSlotElements(slot: HTMLElement, newElements: HTMLElement[]) {
		slot.innerText = "";
		slot.append(...(newElements || []));
	}

	static makeImageButton(imgSrc: string, padded = false): HTMLButtonElement {
		const btn = document.createElement("button");
		const img = document.createElement("img");
		nonDraggableElement(img);
		if (padded)
			img.className = "padded";
		img.alt = imgSrc;
		img.src = imgSrc;
		btn.append(img);
		return btn;
	}

	static makeSwitchingImageBtn(img: Ph_SwitchingImage): { b: HTMLButtonElement, img: Ph_SwitchingImage } {
		const button = document.createElement("button");
		button.className = "imgBtn";
		button.append(img);
		return { b: button, img: img };
	}

	static makeSpacer(): HTMLDivElement {
		const spacer = document.createElement("div");
		spacer.className = "mla";
		return spacer;
	}

	private onMouseEnterContent() {
		this.showControls();
		this.setHideTimeout();
	}

	private onMouseMoveContent() {
		this.restartHideTimeout();
	}

	private onMouseEnterThis() {
		this.showControls();
		this.clearHideTimeout();
	}

	private onMouseLeaveThis() {
		this.restartHideTimeout();
	}

	private showControls() {
		this.parentElement.classList.add("controlsVisible");
	}

	private setHideTimeout() {
		this.clearHideTimeout();
		this.hideTimeout = setTimeout(this.hideControls.bind(this), 2000);
	}

	private restartHideTimeout() {
		if (!this.parentElement.classList.contains("controlsVisible")) {
			this.clearHideTimeout();
			this.showControls();
			return;
		}

		this.clearHideTimeout();

		this.hideTimeout = setTimeout(this.hideControls.bind(this), 2000);
	}

	private clearHideTimeout() {
		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	hideControls() {
		this.parentElement.classList.remove("controlsVisible");
		this.clearHideTimeout();
		this.$classAr("dropDownArea").forEach((area: Ph_DropDownArea) => area.closeMenu(true));
	}
}

customElements.define("ph-controls-bar", Ph_ControlsBar);
