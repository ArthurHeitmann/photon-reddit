import { getUserPreferences, updateUserPreferences } from "../../../api/redditApi";
import { RedditPreferences } from "../../../types/redditTypes";
import { escHTML } from "../../../utils/htmlStatics";
import "../../../utils/htmlStuff";
import { deepClone, ensurePageLoaded, isJsonEqual, isObjectEmpty, makeElement } from "../../../utils/utils";
import Ph_ModalPane from "../../misc/modalPane/modalPane";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";
import { getSettingsSections, SettingConfig, SettingsApi } from "./photonSettingsData";
import "./styleSettingsListener";

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
	preferHigherVideoQuality?: boolean,
	autoplayVideos?: boolean,
	globalVideoVolume?: boolean,
	nsfwPolicy?: NsfwPolicy,
	markSeenPosts?: boolean,
	hideSeenPosts?: boolean,
	clearFeedCacheAfterMs?: number,
	clearSeenPostAfterMs?: number,
	enableFab?: boolean,
	isIncognitoEnabled?: boolean,
	tooltipsVisible?: boolean,
	messageCheckIntervalMs?: number,
	userShortCacheTTLMs?: number
}

// default config
export const defaultSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	loadInlineMedia: false,
	firstShowControlBar: true,
	imageLimitedHeight: 70,
	preferHigherVideoQuality: true,
	autoplayVideos: true,
	globalVideoVolume: false,
	nsfwPolicy: NsfwPolicy.covered,
	markSeenPosts: true,
	hideSeenPosts: false,
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 2,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 365,
	enableFab: true,
	isIncognitoEnabled: false,
	tooltipsVisible: true,
	messageCheckIntervalMs: 30 * 1000,
	userShortCacheTTLMs: 1000 * 60 * 5
};

/** Stores and manages global settings */
export default class Ph_PhotonSettings extends Ph_ModalPane {
	/** unsaved settings are stored here */
	temporarySettings: PhotonSettings = {};
	sectionsConfig;

	constructor() {
		super();

		this.classList.add("photonSettings");
		this.hide();

		ensurePageLoaded().then(() => this.init());
	}

	private async init() {
		this.sectionsConfig = getSettingsSections();
		await Users.current.set(["redditPreferences"], Users.current.d.auth.isLoggedIn ? await getUserPreferences(): {});

		const sections: { [name: string]: HTMLElement } = {};
		for (const section of this.sectionsConfig) {
			sections[section.name] = makeElement("div", { class: "section" }, [
				makeElement("div", { class: "sectionName" }, section.name),
				...section.settings.map(
					setting => setting.getElement(this.onSettingChange.bind(this))
				)
			]);
		}
		sections[this.sectionsConfig[0].name].classList.add("selected")

		this.content.append(
			makeElement("div", { class: "sectionsSelection" },[
				makeElement("button", {
					class: "sectionEntry hamburger",
					onclick: () => this.content.classList.toggle("toggle")
				}, [
					makeElement("img", { class: "icon", src: "/img/hamburger.svg" }),
					makeElement("div", { class: "name" }, "")
				]),
				makeElement("div", { class: "sectionEntry search" }, [
					makeElement("img", { class: "icon", src: "/img/search.svg" }),
					makeElement("input", {
						type: "text",
						placeholder: "Filter...",
						class: "name",
						oninput: this.onSearchInput.bind(this)
					})
				]),
				...this.sectionsConfig.map(
					(section, index) => makeElement("button", {
						class: `sectionEntry${index === 0 ? " selected" : ""}`,
						onclick: e => {
							const btn = e.currentTarget as HTMLElement;
							this.content.classList.remove("toggle");
							if (btn.classList.contains("selected"))
								return;
							this.$css(".sectionEntry.selected")[0]?.classList.remove("selected");
							btn.classList.add("selected");
							this.$css(".section.selected")[0]?.classList.remove("selected");
							sections[section.name].classList.add("selected");
						}
					}, [
						makeElement("img", { class: "icon", src: section.iconUrl }),
						makeElement("div", { class: "name" }, section.name)
					])
				)
			]),
			makeElement("div", { class: "sections" }, this.sectionsConfig.map(
				section => sections[section.name]
			))
		);

		window.addEventListener("storage", this.onStorageChange.bind(this));
	}

	private async onSettingChange(source: SettingConfig, newVal: any) {
		switch (source.settingsType) {
		case SettingsApi.Photon:
			await this.onPhotonSettingChange(source, newVal);
			break;
		case SettingsApi.Reddit:
			await this.onRedditPreferenceChange(source, newVal);
			break;
		}
	}

	private async onPhotonSettingChange(source: SettingConfig, newVal: any) {
		const validatorReturn = source.validateValue(newVal);
		if (!validatorReturn.isValid) {
			new Ph_Toast(Level.error, escHTML(validatorReturn.error));
			source.updateState(Users.current.d.photonSettings[source.settingKey]);
			return;
		}
		source.updateState(newVal);
		this.temporarySettings[source.settingKey as string] = newVal;
		await this.applyTemporarySettings();
	}

	private async onRedditPreferenceChange(source: SettingConfig, newVal: any) {
		const validatorReturn = source.validateValue(newVal);
		if (!validatorReturn.isValid) {
			new Ph_Toast(Level.error, escHTML(validatorReturn.error));
			return;
		}
		source.updateState(newVal);
		const newPrefs: RedditPreferences = {};
		newPrefs[source.settingKey] = newVal;
		await updateUserPreferences(newPrefs);
	}

	private async onStorageChange(e: StorageEvent) {
		// TODO
		if (e.key !== "settings")
			return;
		const newSettings = JSON.parse(e.newValue);
		const changedKeys = Object.entries(newSettings)
			.filter(([key, value]) => !isJsonEqual(value as any, Users.current.d.photonSettings[key]))
			.map(([key]) => key);
		for (const changedKey of changedKeys) {
			this.temporarySettings[changedKey] = newSettings[changedKey];
			this.sectionsConfig
				.map(section => section.settings)
				.flat()
				.find(setting => setting.settingKey === changedKey)
				.updateState(newSettings[changedKey]);
		}
		await this.applyTemporarySettings();
	}

	private async applyTemporarySettings() {
		if (isObjectEmpty(this.temporarySettings))
			return;
		await Users.current.set(["photonSettings"], {
			...Users.current.d.photonSettings,
			...deepClone(this.temporarySettings),
		});
		window.dispatchEvent(new CustomEvent("ph-settings-changed", { detail: deepClone(this.temporarySettings) }));
		this.temporarySettings = {};
	}

	private onSearchInput(e: InputEvent) {
		const searchText = (e.currentTarget as HTMLInputElement).value.toLowerCase();
		const keepSectionNames = new Set<string>();
		for (const section of this.sectionsConfig) {
			for (const setting of section.settings) {
				if (!searchText || setting.name.toLowerCase().includes(searchText) || setting.description.toLowerCase().includes(searchText)) {
					setting.getElement().classList.remove("hide");
					keepSectionNames.add(section.name);
				}
				else
					setting.getElement().classList.add("hide");
			}
		}
		for (const section of this.$cssAr("button.sectionEntry:not(.hamburger)")) {
			section.classList.toggle("hide",
				!keepSectionNames.has((section.$class("name")[0] as HTMLElement).innerText))
		}
		if (window.matchMedia("(min-width: 800px)").matches)
			(this.$css("button.sectionEntry:not(.hide, .hamburger)")[0] as HTMLElement)?.click();
	}

	toggle() {
		if (this.classList.contains("remove")) {
			this.show();
		}
		else {
			this.hide();
		}
	}
}

customElements.define("ph-photon-settings", Ph_PhotonSettings);
