import Ph_DropDown from "../dropDown/dropDown.js";
import Ph_MorphingImage from "../morphingImage/morphingImage.js";

export default class Ph_ControlsBar extends HTMLElement {
	hideTimeout = null;
	contentElement: HTMLElement = null;

	constructor(isInitiallyVisible: boolean) {
		super();

		this.className = "controls";
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

	appendMakeImageButton(imgSrc: string, padded = false): HTMLButtonElement {
		const btn = document.createElement("button");
		const img = document.createElement("img");
		img.draggable = false;
		if (padded) img.className = "padded";
		img.alt = imgSrc;
		img.src = imgSrc;
		btn.appendChild(img);
		this.appendChild(btn);
		return btn;
	}

	appendDropDown(dropdown: Ph_DropDown): Ph_DropDown {
		return this.appendChild(dropdown);
	}

	appendMorphingImage(img: Ph_MorphingImage) {
		return this.appendChild(img);
	}

	appendSpacer(): HTMLDivElement {
		const spacer = document.createElement("div");
		spacer.className = "mla";
		return this.appendChild(spacer)
	}

	showControls() {
		this.parentElement.classList.add("controlsVisible");

		this.hideTimeout = setTimeout(() => this.hideControls(), 2000);
	}

	restartHideTimeout() {
		if (!this.parentElement.classList.contains("controlsVisible")) {
			this.clearHideTimeout();
			this.showControls();
			return;
		}

		this.clearHideTimeout();

		this.hideTimeout = setTimeout(() => this.hideControls(), 2000);
	}

	clearHideTimeout() {
		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	hideControls() {
		this.parentElement.classList.remove("controlsVisible");
		this.dispatchEvent(new Event("ph-hidecontrols"))
		this.clearHideTimeout();
	}
}

customElements.define("ph-controls-bar", Ph_ControlsBar);
