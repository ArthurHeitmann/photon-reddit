import { nonDraggableImage } from "../../../utils/htmlStatics";
import { deepClone, hasParams, isJsonEqual } from "../../../utils/utils";
import Ph_DropDown from "../dropDown/dropDown";
import Ph_DropDownArea from "../dropDown/dropDownArea/dropDownArea";
import Ph_DropDownEntry, { DropDownEntryParam } from "../dropDown/dropDownEntry/dropDownEntry";
import Ph_ProgressBar from "../progressBar/progressBar";
import Ph_SwitchingImage from "../switchableImage/switchableImage";

export interface ControlsLayoutSlots {
	firstLeftItems?: HTMLElement[],
	leftItems?: HTMLElement[],
	rightItems?: HTMLElement[],
	settingsEntries?: DropDownEntryParam[],
	settingsEntriesElements?: Ph_DropDownEntry[],
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

		contentElem.addEventListener("mouseenter", this.showControls.bind(this));
		contentElem.addEventListener("mousemove", this.restartHideTimeout.bind(this));
		this.addEventListener("mouseenter", this.clearHideTimeout.bind(this))
		this.addEventListener("mouseleave",
				e => this.contentElement.contains(e.relatedTarget as HTMLElement) || this.restartHideTimeout());
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
		if (newElements.settingsEntries === undefined)
			newElements.settingsEntries = [];
		if (!newElements.settingsEntriesElements || !isJsonEqual(newElements.settingsEntries, newElements.settingsEntriesCurrent)) {
			const dropDownArea = dropDown.$class("dropDownArea ")[0] as Ph_DropDownArea;
			newElements.settingsEntriesCurrent = deepClone(newElements.settingsEntries);
			newElements.settingsEntriesElements = (newElements.settingsEntries)
				.filter(param => Boolean(param))
				.map(param => new Ph_DropDownEntry(param, dropDown, dropDownArea));
		}
		const entriesRoot = dropDown.$class("dropDownArea")[0];
		Array.from(entriesRoot.children)
			.filter((entry: Ph_DropDownEntry) => !this.initialDropdownEntries.includes(entry))
			.forEach(entry => entry.remove());
		entriesRoot.append(...newElements.settingsEntriesElements);
	}

	private replaceSlotElements(slot: HTMLElement, newElements: HTMLElement[]) {
		slot.innerText = "";
		slot.append(...(newElements || []));
	}

	static makeImageButton(imgSrc: string, padded = false): HTMLButtonElement {
		const btn = document.createElement("button");
		const img = document.createElement("img");
		nonDraggableImage(img);
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

	showControls() {
		this.parentElement.classList.add("controlsVisible");

		this.hideTimeout = setTimeout(this.hideControls.bind(this), 2000);
	}

	restartHideTimeout() {
		if (!this.parentElement.classList.contains("controlsVisible")) {
			this.clearHideTimeout();
			this.showControls();
			return;
		}

		this.clearHideTimeout();

		this.hideTimeout = setTimeout(this.hideControls.bind(this), 2000);
	}

	clearHideTimeout() {
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
