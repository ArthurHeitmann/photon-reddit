import { logOut } from "../../../auth/loginHandler.js";
import { clearSeenPosts, ensurePageLoaded, isLoggedIn } from "../../../utils/globals.js";
import { disableMainScroll, enableMainScroll, escADQ } from "../../../utils/htmlStatics.js";
import "../../../utils/htmlStuff.js";
import { deepClone, isObjectEmpty } from "../../../utils/utils.js";
import { photonWebVersion } from "../../../utils/version.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_Changelog from "../../photon/changelog/changelog.js";
import "./styleSettingsListener.js";

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
	loadInlineMedia?: boolean,
	firstShowControlBar?: boolean,
	imageLimitedHeight?: number,
	autoplayVideos?: boolean,
	globalVideoVolume?: boolean,
	nsfwPolicy?: NsfwPolicy,
	markSeenPosts?: boolean,
	hideSeenPosts?: boolean,
	clearFeedCacheAfterMs?: number,
	clearSeenPostAfterMs?: number,
	isIncognitoEnabled?: boolean,
	tooltipsVisible?: boolean,
	messageCheckIntervalS?: number,
}

// default config
export let globalSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	loadInlineMedia: false,
	firstShowControlBar: true,
	imageLimitedHeight: 80,
	autoplayVideos: true,
	globalVideoVolume: false,
	nsfwPolicy: NsfwPolicy.covered,
	markSeenPosts: true,
	hideSeenPosts: true,
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 24 * 2,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 90,
	isIncognitoEnabled: false,
	tooltipsVisible: true,
	messageCheckIntervalS: 30,
};

/** Stores and manages global settings */
export default class Ph_PhotonSettings extends HTMLElement {
	/** unsaved settings are stored here */
	temporarySettings: PhotonSettings = {};
	optionsArea: HTMLElement;

	constructor() {
		super();
		this.classList.add("photonSettings");
		this.hide();

		let savedSettings: any;
		try {
			savedSettings = localStorage.settings ? JSON.parse(localStorage.settings) : undefined;
		}
		catch {
			savedSettings = {}
		}
		if (savedSettings) {
			globalSettings = {
				...globalSettings,
				...savedSettings,
			};
		}
		localStorage.settings = JSON.stringify(globalSettings);
	}

	connectedCallback() {
		ensurePageLoaded().then(() => this.init());
	}

	init() {
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
				new Ph_Toast(Level.warning, "Nothing to save", { timeout: 2000 });
				return;
			}
			globalSettings = {
				...globalSettings,
				...deepClone(this.temporarySettings),
			};
			window.dispatchEvent(new CustomEvent("ph-settings-changed", { detail: deepClone(this.temporarySettings) }));
			this.temporarySettings = {};
			localStorage.settings = JSON.stringify(globalSettings);
			new Ph_Toast(Level.success, "Settings saved and applied", { timeout: 1500 });
		});
		bottomBar.appendChild(saveButton);
		windowWrapper.appendChild(bottomBar);
	}

	private stageSettingChange(propertyName: string, validator?: (changed: any) => boolean, errorMessage?: string): (changed: any) => void {
		return changed => {
			if (validator && !validator(changed)) {
				new Ph_Toast(Level.error, errorMessage, { timeout: 3000 });
				return;
			}
			if (changed !== globalSettings[propertyName])
				this.temporarySettings[propertyName] = changed;
			else
				delete this.temporarySettings[propertyName];
		}
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
			this.stageSettingChange(nameOf<PhotonSettings>("imageLoadingPolicy"))
		));
		// inline media
		const inlineMediaGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Auto expand images & videos in comments & posts",
			"",
			"inlineMedia",
			"",
			globalSettings.loadInlineMedia
		);
		inlineMediaGroup.$tag("input")[0].addEventListener("input", e =>
			this.stageSettingChange(nameOf<PhotonSettings>("loadInlineMedia"))
				((e.currentTarget as HTMLInputElement).checked)
		);
		this.optionsArea.appendChild(inlineMediaGroup);
		// show control bar for images
		const imageControlsGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Initially show bottom bar on images & videos",
			"",
			"checkboxFirstShowControls",
			"",
			globalSettings.firstShowControlBar
		);
		imageControlsGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("firstShowControlBar"))
			((e.currentTarget as HTMLInputElement).checked);
		});
		this.optionsArea.appendChild(imageControlsGroup);
		// limited image height
		const limitedHeightGroup = this.makeCustomLabeledInput(
			"number",
			"Limit image height to N % of the view height (0 for no limit)",
			globalSettings.imageLimitedHeight.toString(),
			"limitHeightSetting"
		);
		limitedHeightGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("imageLimitedHeight"),
				(percent) => !isNaN(parseFloat(percent)) && parseFloat(percent) >= 0, "invalid percent")
				(parseInt((e.currentTarget as HTMLInputElement).value));
		});
		this.optionsArea.appendChild(limitedHeightGroup);
		this.optionsArea.appendChild(document.createElement("hr"));

		// videos
		// autoplay
		const videoAutoplayGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Autoplay videos",
			"",
			"checkboxVideoAutoplay",
			"",
			globalSettings.autoplayVideos
		);
		videoAutoplayGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("autoplayVideos"))
				((e.currentTarget as HTMLInputElement).checked);
		});
		this.optionsArea.appendChild(videoAutoplayGroup);
		// global volume
		const videoGlobalVolumeGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Sync video volume across all videos",
			"",
			"checkboxGlobalVolume",
			"",
			globalSettings.globalVideoVolume
		);
		videoGlobalVolumeGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("globalVideoVolume"))
				((e.currentTarget as HTMLInputElement).checked);
		});
		this.optionsArea.appendChild(videoGlobalVolumeGroup);

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
			this.stageSettingChange(nameOf<PhotonSettings>("nsfwPolicy"))
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
					this.stageSettingChange(nameOf<PhotonSettings>("markSeenPosts"))(checkbox.checked);
					break;
				case "hideSeenPosts":
					this.stageSettingChange(nameOf<PhotonSettings>("hideSeenPosts"))(checkbox.checked);
					break;
			}
		}));
		this.optionsArea.append(seenPostsGroup);
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
		incognitoGroup.$tag("input")[0].addEventListener("input", e =>
			this.stageSettingChange(nameOf<PhotonSettings>("isIncognitoEnabled"))
				((e.currentTarget as HTMLInputElement).checked)
		);
		incognitoGroup.setAttribute("data-tooltip", "Randomize tab title and url");
		this.optionsArea.appendChild(incognitoGroup);
		// tooltips visibility
		const tooltipsGroup = this.makeCustomLabeledInput(
			"checkbox",
			"Show Tooltips",
			"",
			"tooltipVisibility",
			"",
			globalSettings.tooltipsVisible
		);
		tooltipsGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("tooltipsVisible"))
				((e.currentTarget as HTMLInputElement).checked);
		});
		this.optionsArea.appendChild(tooltipsGroup);
		// message checking
		const messageCheckIntervalGroup = this.makeCustomLabeledInput(
			"number",
			"Check for new messages every N seconds (0 to disable)",
			globalSettings.messageCheckIntervalS.toString(),
			"messageCheckInterval"
		);
		messageCheckIntervalGroup.$tag("input")[0].addEventListener("input", e => {
			this.stageSettingChange(nameOf<PhotonSettings>("messageCheckIntervalS"),
				(num) => {
					const parsed = parseInt(num);
					return !isNaN(parsed) && (parsed === 0 || parsed >= 20);
				}, "invalid seconds (must be >= 20 or 0)")
			(parseInt((e.currentTarget as HTMLInputElement).value));
		});
		this.optionsArea.appendChild(messageCheckIntervalGroup);
		this.optionsArea.appendChild(document.createElement("hr"));

		// stored data duration
		const feedInfoCacheGroup = this.makeCustomLabeledInput(
			"number",
			"Cached subreddit & user info",
			globalSettings.clearFeedCacheAfterMs.toString(),
			"inputClearFeedCacheAfterMs",
			""
		);
		feedInfoCacheGroup.$tag("input")[0].addEventListener("change", e => {
			const ms = parseInt((e.currentTarget as HTMLInputElement).value);
			this.stageSettingChange(nameOf<PhotonSettings>("clearFeedCacheAfterMs"),
				changed => !isNaN(changed), "Invalid number")(ms);
		});
		const seenPostsStoredGroup = this.makeCustomLabeledInput(
			"number",
			"Seen posts stay marked",
			globalSettings.clearSeenPostAfterMs.toString(),
			"inputClearSeenPostAfterMs",
			""
		);
		seenPostsStoredGroup.$tag("input")[0].addEventListener("change", e => {
			const ms = parseInt((e.currentTarget as HTMLInputElement).value);
			this.stageSettingChange(nameOf<PhotonSettings>("clearSeenPostAfterMs"),
				changed => !isNaN(changed), "Invalid number")(ms);
		});
		const clearSeenPostsBtn = document.createElement("button");
		clearSeenPostsBtn.innerText = "Clear seen posts";
		clearSeenPostsBtn.addEventListener("click", () => {
			clearSeenPosts();
			new Ph_Toast(Level.success, "", { timeout: 1500 });
		});
		clearSeenPostsBtn.className = "mla button";
		this.optionsArea.appendChild(this.makeGeneralInputGroup("Keep stored data for N ms", [
			feedInfoCacheGroup,
			seenPostsStoredGroup,
			clearSeenPostsBtn
		]));

		// other
		this.optionsArea.appendChild(document.createElement("hr"));
		if (isLoggedIn) {
			const logOutButton = document.createElement("button");
			logOutButton.className = "button";
			logOutButton.innerText = "Log out";
			logOutButton.addEventListener("click",
				() => new Ph_Toast(Level.warning, "Are you sure you want to log out?", { onConfirm: logOut }));
			this.optionsArea.appendChild(logOutButton);
		}

		const showChangelogButton = document.createElement("button");
		showChangelogButton.className = "button";
		showChangelogButton.innerText = "View Changelog";
		showChangelogButton.addEventListener("click", () => {
			this.hide();
			Ph_Changelog.show();
		})
		this.optionsArea.appendChild(showChangelogButton);
		this.optionsArea.insertAdjacentHTML("beforeend", `<span>v${photonWebVersion}</span>`)
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
		disableMainScroll();
	}

	hide() {
		this.classList.add("remove");
		enableMainScroll();
	}
}

/** Compile time validator that @param name is a property of T */
const nameOf = <T>(name: keyof T) => name;

customElements.define("ph-photon-settings", Ph_PhotonSettings);
