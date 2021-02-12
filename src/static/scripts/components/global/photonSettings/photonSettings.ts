import { clearSeenPosts } from "../../../utils/globals.js";
import "../../../utils/htmlStuff.js";
import { escADQ } from "../../../utils/htmlStatics.js";
import { deepClone, isObjectEmpty } from "../../../utils/utils.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

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
	markSeenPosts?: boolean,
	hideSeenPosts?: boolean,
	isIncognitoEnabled?: boolean,
	controlBarForImages?: boolean,
	clearFeedCacheAfterMs?: number,
	clearSeenPostAfterMs?: number,
}

// default config
export let globalSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	nsfwPolicy: NsfwPolicy.covered,
	markSeenPosts: true,
	hideSeenPosts: false,
	isIncognitoEnabled: false,
	controlBarForImages: false,
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 24 * 2,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 31,
};

export default class Ph_PhotonSettings extends HTMLElement {
	temporarySettings: PhotonSettings = {};
	optionsArea: HTMLElement;

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
		this.optionsArea = document.createElement("div");
		this.optionsArea.className = "optionsArea";
		mainWrapper.appendChild(this.optionsArea);

		this.populateSettings();

		const bottomBar = document.createElement("div");
		bottomBar.className = "bottomBar";
		const saveButton = document.createElement("button");
		saveButton.className = "button save";
		saveButton.innerText = "Save";
		saveButton.addEventListener("click", () => {
			if (isObjectEmpty(this.temporarySettings)) {
				new Ph_Toast(Level.Warning, "Nothing to save", { timeout: 2000 });
				return;
			}
			globalSettings = {
				...globalSettings,
				...deepClone(this.temporarySettings),
			};
			window.dispatchEvent(new CustomEvent("settingsChanged", { detail: deepClone(this.temporarySettings) }));
			this.temporarySettings = {};
			localStorage.settings = JSON.stringify(globalSettings);
			new Ph_Toast(Level.Success, "", { timeout: 1500 });
		});
		bottomBar.appendChild(saveButton);
		windowWrapper.appendChild(bottomBar);
	}

	private populateSettings() {
		// image previews
		this.optionsArea.appendChild(this.makeRadioGroup(
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
		this.optionsArea.appendChild(document.createElement("hr"));
		// nsfw visibility

		this.optionsArea.appendChild(this.makeRadioGroup(
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
		this.optionsArea.appendChild(document.createElement("hr"));

		// seen posts
		const seenPostsGroup = this.makeGeneralInputGroup("Seen Posts", [
			this.makeCustomLabeledInput("checkbox", "Mark seen posts", "", "markSeenPosts", "", globalSettings.markSeenPosts),
			this.makeCustomLabeledInput("checkbox", "Hide seen posts", "", "hideSeenPosts", "", globalSettings.hideSeenPosts),
		]);
		seenPostsGroup.$tagAr("input").forEach((checkbox: HTMLInputElement) => checkbox.addEventListener("input", (e: Event) => {
			switch (checkbox.id) {
				case "markSeenPosts":
					if (checkbox.checked !== globalSettings.markSeenPosts)
						this.temporarySettings.markSeenPosts = checkbox.checked;
					else
						delete this.temporarySettings.markSeenPosts;
					break;
				case "hideSeenPosts":
					if (checkbox.checked !== globalSettings.hideSeenPosts)
						this.temporarySettings.hideSeenPosts = checkbox.checked;
					else
						delete this.temporarySettings.hideSeenPosts;
					break;
				default:
					new Ph_Toast(Level.Error, "Wut is happening?");
					console.error(checkbox.outerHTML);
			}
		}));
		this.optionsArea.append(seenPostsGroup);
		this.optionsArea.appendChild(document.createElement("hr"));

		// stored data duration
		const feedInfoCacheGroup = this.makeCustomLabeledInput(
			"text",
			"Cached subreddit & user info",
			globalSettings.clearFeedCacheAfterMs.toString(),
			"inputClearFeedCacheAfterMs",
			""
		);
		feedInfoCacheGroup.$tag("input")[0].addEventListener("change", e => {
			const ms = parseInt((e.currentTarget as HTMLInputElement).value);
			if (isNaN(ms)) {
				new Ph_Toast(Level.Error, "Invalid number");
				return;
			}
			if (ms !== globalSettings.clearFeedCacheAfterMs)
				this.temporarySettings.clearFeedCacheAfterMs = ms;
			else
				delete this.temporarySettings.clearFeedCacheAfterMs;
		});
		const seenPostsStoredGroup = this.makeCustomLabeledInput(
			"text",
			"Seen posts stay marked",
			globalSettings.clearSeenPostAfterMs.toString(),
			"inputClearSeenPostAfterMs",
			""
		);
		seenPostsStoredGroup.$tag("input")[0].addEventListener("change", e => {
			const ms = parseInt((e.currentTarget as HTMLInputElement).value);
			if (isNaN(ms)) {
				new Ph_Toast(Level.Error, "Invalid number");
				return;
			}
			if (ms !== globalSettings.clearSeenPostAfterMs)
				this.temporarySettings.clearSeenPostAfterMs = ms;
			else
				delete this.temporarySettings.clearSeenPostAfterMs;
		});
		const clearSeenPostsBtn = document.createElement("button");
		clearSeenPostsBtn.innerText = "Clear seen posts";
		clearSeenPostsBtn.addEventListener("click", clearSeenPosts);
		clearSeenPostsBtn.className = "mla button";
		this.optionsArea.appendChild(this.makeGeneralInputGroup("Keep stored data for N ms", [
			feedInfoCacheGroup,
			seenPostsStoredGroup,
			clearSeenPostsBtn
		]));
		this.optionsArea.appendChild(document.createElement("hr"));

		// incognito mode
		const incognitoGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Incognito Mode",
			"",
			"checkboxIncognito",
			"",
			globalSettings.isIncognitoEnabled
		);
		incognitoGroup.$tag("input")[0].addEventListener("input", e => {
			const checkbox = e.currentTarget as HTMLInputElement;
			if (checkbox.checked !== globalSettings.isIncognitoEnabled)
				this.temporarySettings.isIncognitoEnabled = checkbox.checked;
			else
				delete this.temporarySettings.isIncognitoEnabled;
		});
		incognitoGroup.setAttribute("data-tooltip", "Randomize tab title and url");
		this.optionsArea.appendChild(incognitoGroup);
		this.optionsArea.appendChild(document.createElement("hr"));

		// show control bar for images
		const imageControlsGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Show controls bar for images (not galleries)",
			"",
			"checkboxControlsImage",
			"",
			globalSettings.controlBarForImages
		);
		imageControlsGroup.$tag("input")[0].addEventListener("input", e => {
			const checkbox = e.currentTarget as HTMLInputElement;
			if (checkbox.checked !== globalSettings.controlBarForImages)
				this.temporarySettings.controlBarForImages = checkbox.checked;
			else
				delete this.temporarySettings.controlBarForImages;
		});
		this.optionsArea.appendChild(imageControlsGroup);
		this.optionsArea.appendChild(document.createElement("hr"));

	}

	private makeGeneralInputGroup(groupTitle: string, elements: HTMLElement[]): HTMLElement {
		const wrapper = document.createElement("div");
		wrapper.className = "inputGroup";
		wrapper.innerHTML = `<div>${groupTitle}</div>`;
		wrapper.append(...elements);
		return wrapper;
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
			<label for="${escADQ(inputId)}">${labelText}</label>
			<input type="${escADQ(type)}" id="${escADQ(inputId)}" class="${escADQ(type)}" value="${escADQ(value)}" name="${escADQ(inputName)}" ${checked ? "checked" : ""}>${
			["checkbox", "radio"].includes(type)
			? `<label for="${escADQ(inputId)}"></label>`
			: ""}
		`;
		return wrapper;
	}

	toggle() {
		if (this.classList.contains("remove")) {
			this.show();
		}
		else {
			this.hide();
		}
	}

	show() {
		this.classList.remove("remove");
	}

	hide() {
		this.classList.add("remove");
	}
}

customElements.define("ph-photon-settings", Ph_PhotonSettings);
