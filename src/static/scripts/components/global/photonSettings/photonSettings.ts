import { deepClone } from "../../../utils/utils.js";

export enum ImageLoadingPolicy {
	alwaysPreview = "alwaysPreview",
	originalInFs = "originalInFs",
	alwaysOriginal = "alwaysOriginal",
}

export interface PhotonSettings {
	imageLoadingPolicy: ImageLoadingPolicy
}

export default class Ph_PhotonSettings extends HTMLElement {
	static settings: PhotonSettings = {
		imageLoadingPolicy: ImageLoadingPolicy.originalInFs
	};
	temporarySettings: PhotonSettings = null;

	constructor() {
		super();
		this.classList.add("photonSettings");
		this.hide();

		const savedSettings = localStorage.settings ? JSON.parse(localStorage.settings) : undefined;
		if (savedSettings)
			Ph_PhotonSettings.settings = savedSettings;
	}

	connectedCallback() {
		const windowWrapper = document.createElement("div");
		windowWrapper.className = "windowWrapper";
		this.addEventListener("click", (e: MouseEvent) =>
			e.target === e.currentTarget && this.hide());
		this.appendChild(windowWrapper);

		const closeButton = document.createElement("button");
		closeButton.className = "closeButton transparentButton";
		closeButton.innerHTML = `<img src="/img/close.svg" alt="close" draggable="false">`;
		closeButton.addEventListener("click", this.hide.bind(this));
		windowWrapper.appendChild(closeButton);

		const mainWrapper = document.createElement("div");
		mainWrapper.className = "mainWrapper";
		windowWrapper.appendChild(mainWrapper);
		const previewArea = document.createElement("div");
		previewArea.className = "previewArea";
		mainWrapper.appendChild(previewArea);
		const optionsArea = document.createElement("div");
		optionsArea.className = "optionsArea";
		mainWrapper.appendChild(optionsArea);

		optionsArea.appendChild(this.makeRadioGroup(
			"preferPreviews",
			"Image Previews:", [
				{id: ImageLoadingPolicy.alwaysPreview, text: "Always only load preview images"},
				{id: ImageLoadingPolicy.originalInFs, text: "Load originals only in fullscreen", defaultChecked: true},
				{id: ImageLoadingPolicy.alwaysOriginal, text: "Always load original images"},
			],
			(loadingPolicy: ImageLoadingPolicy) => {
				this.temporarySettings.imageLoadingPolicy = loadingPolicy;
			}
		));

		const bottomBar = document.createElement("div");
		bottomBar.className = "bottomBar";
		const saveButton = document.createElement("button");
		saveButton.innerText = "Save";
		saveButton.addEventListener("click", () => {
			Ph_PhotonSettings.settings = deepClone(this.temporarySettings);
			localStorage.settings = JSON.stringify(Ph_PhotonSettings.settings);
			window.dispatchEvent(new CustomEvent("settingsChanged", { detail: Ph_PhotonSettings.settings }));
		})
		bottomBar.appendChild(saveButton);
		windowWrapper.appendChild(bottomBar);
	}

	private makeRadioGroup(groupName: string, groupText: string, radioParams: { id: string, text: string, defaultChecked?: boolean }[], onSelectEvent: (value: any) => void) {
		const wrapper = document.createElement("div");
		wrapper.className = "inputGroup";
		wrapper.innerHTML = `<div>${groupText}</div>`;
		for (const radioParam of radioParams) {
			wrapper.appendChild(this.makeCustomLabeledInput(
				"radio",
				radioParam.text,
				radioParam.id,
				radioParam.id,
				groupName,
				Boolean(radioParam.defaultChecked)
			))
				.$tag("input")[0]
				.addEventListener("change", (e: Event) => onSelectEvent(e.currentTarget["value"]));
		}
		return wrapper;
	}

	private makeCustomLabeledInput(type: string, labelText: string, value: string, inputId: string, inputName: string = "", checked?: boolean) {
		const wrapper = document.createElement("div");
		wrapper.className = "inputWrapper";
		wrapper.innerHTML = `
			<label for="${inputId}">${labelText}</label>
			<input type="${type}" id ="${inputId}" class="${type}" value="${value}" name="${inputName}" ${type === "radio" && checked ? "checked" : ""}>
			<label for="${inputId}"></label>
		`;
		return wrapper;
	}

	toggle() {
		if (this.classList.contains("remove")) {
			this.show();
		} else {
			this.hide();
		}
	}

	show() {
		this.classList.remove("remove");

		this.temporarySettings = deepClone(Ph_PhotonSettings.settings);
	}

	hide() {
		this.classList.add("remove");
	}
}

customElements.define("ph-photon-settings", Ph_PhotonSettings);
