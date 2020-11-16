import { deepClone } from "../../../utils/utils.js";
import "../../../utils/htmlStuff.js";

export enum ImageLoadingPolicy {
	alwaysPreview = "alwaysPreview",
	originalInFs = "originalInFs",
	alwaysOriginal = "alwaysOriginal",
}

export enum NsfwPolicy {
	never = "never",
	covered = "covered",
	always = "always",
}

export interface PhotonSettings {
	imageLoadingPolicy?: ImageLoadingPolicy,
	nsfwPolicy?: NsfwPolicy,
}

// default config
export let globalSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	nsfwPolicy: NsfwPolicy.covered,
};

export default class Ph_PhotonSettings extends HTMLElement {
	temporarySettings: PhotonSettings = null;

	constructor() {
		super();
		this.classList.add("photonSettings");
		this.hide();

		const savedSettings = localStorage.settings ? JSON.parse(localStorage.settings) : undefined;
		if (savedSettings)
			globalSettings = {
			...globalSettings,
			...savedSettings,
		};
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
			"Image Previews:",
			globalSettings.imageLoadingPolicy,
			[
				{ id: ImageLoadingPolicy.alwaysPreview, text: "Always only load preview images" },
				{ id: ImageLoadingPolicy.originalInFs, text: "Load originals only in fullscreen" },
				{ id: ImageLoadingPolicy.alwaysOriginal, text: "Always load original images" },
			],
			(loadingPolicy: ImageLoadingPolicy) => {
				if (loadingPolicy !== globalSettings.imageLoadingPolicy)
					this.temporarySettings.imageLoadingPolicy = loadingPolicy;
			}
		));
		optionsArea.appendChild(document.createElement("hr"));
		optionsArea.appendChild(this.makeRadioGroup(
			"nsfwPolicy",
			"NSFW Posts Visibility:",
			globalSettings.nsfwPolicy,
			[
				{ id: NsfwPolicy.never, text: "Hide all NSFW posts" },
				{ id: NsfwPolicy.covered, text: "Show warning on NSFW posts" },
				{ id: NsfwPolicy.always, text: "Always show NSFW posts" },
			],
			(nsfwPolicy: NsfwPolicy) => {
				if (nsfwPolicy !== globalSettings.nsfwPolicy)
					this.temporarySettings.nsfwPolicy = nsfwPolicy;
				else
					delete this.temporarySettings.nsfwPolicy;
			}
		));

		const bottomBar = document.createElement("div");
		bottomBar.className = "bottomBar";
		const saveButton = document.createElement("button");
		saveButton.innerText = "Save";
		saveButton.addEventListener("click", () => {
			globalSettings = {
				...globalSettings,
				...deepClone(this.temporarySettings),
			};
			window.dispatchEvent(new CustomEvent("settingsChanged", { detail: deepClone(this.temporarySettings) }));
			this.temporarySettings = {};
			localStorage.settings = JSON.stringify(globalSettings);
		})
		bottomBar.appendChild(saveButton);
		windowWrapper.appendChild(bottomBar);
	}

	private makeRadioGroup(
		groupName: string,
		groupText: string,
		selectedId: string,
		radioParams: { id: string, text: string }[],
		onSelectEvent: (value: any) => void
	) {
		const wrapper = document.createElement("div");
		wrapper.className = "inputGroup";
		wrapper.innerHTML = `<div>${groupText}</div>`;
		for (const radioParam of radioParams) {
			const group = wrapper.appendChild(this.makeCustomLabeledInput(
				"radio",
				radioParam.text,
				radioParam.id,
				groupName + radioParam.id,
				groupName,
				selectedId === radioParam.id
			));
			group.$tag("input")[0]
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

		this.temporarySettings = {};
	}

	hide() {
		this.classList.add("remove");
	}
}

customElements.define("ph-photon-settings", Ph_PhotonSettings);
