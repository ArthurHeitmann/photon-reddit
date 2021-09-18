import { ensurePageLoaded } from "../../../utils/globals";
import { escHTML } from "../../../utils/htmlStatics";
import "../../../utils/htmlStuff";
import { deepClone, isJsonEqual, isObjectEmpty, makeElement } from "../../../utils/utils";
import Ph_ModalPane from "../../misc/modalPane/modalPane";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import { getSettingsSections, SettingConfig } from "./photonSettingsData";
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
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 24,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 365,
	enableFab: true,
	isIncognitoEnabled: false,
	tooltipsVisible: true,
	messageCheckIntervalMs: 30 * 1000,
};

export let globalSettings: PhotonSettings = deepClone(defaultSettings);

/** Stores and manages global settings */
export default class Ph_PhotonSettings extends Ph_ModalPane {
	/** unsaved settings are stored here */
	temporarySettings: PhotonSettings = {};
	sectionsConfig = getSettingsSections();

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
		this.populateSettings();
		window.addEventListener("storage", this.onLocalstorageChange.bind(this));
	}

	private populateSettings() {
		const sections: { [name: string]: HTMLElement } = {};
		for (const section of this.sectionsConfig) {
			sections[section.name] = makeElement("div", { class: "section" }, [
				makeElement("div", { class: "sectionName" }, section.name),
				...section.settings.map(
					setting => setting.makeElement(this.onSettingChange.bind(this))
				)
			]);
		}
		sections[this.sectionsConfig[0].name].classList.add("selected")

		this.content.append(
			makeElement("div", { class: "sectionsSelection" },[
				makeElement("button", {
					class: "sectionButton hamburger",
					onclick: () => this.content.classList.toggle("toggle")
				}, [
					makeElement("img", { class: "icon", src: "/img/hamburger.svg" }),
					makeElement("div", { class: "name" }, "")
				]),
				...this.sectionsConfig.map(
					(section, index) => makeElement("button", {
						class: `sectionButton${index === 0 ? " selected" : ""}`,
						onclick: e => {
							const btn = e.currentTarget as HTMLElement;
							this.content.classList.remove("toggle");
							if (btn.classList.contains("selected"))
								return;
							this.$css(".sectionButton.selected")[0]?.classList.remove("selected");
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
	}

	private onSettingChange(source: SettingConfig, newVal: any) {
		const validatorReturn = source.validateValue(newVal);
		if (!validatorReturn.isValid) {
			new Ph_Toast(Level.error, escHTML(validatorReturn.error));
			source.updateState(globalSettings[source.settingKey]);
			return;
		}
		source.updateState(newVal);
		this.temporarySettings[source.settingKey as string] = newVal;
		this.applyTemporarySettings();
	}

	private onLocalstorageChange(e: StorageEvent) {
		if (e.key !== "settings")
			return;
		const newSettings = JSON.parse(e.newValue);
		const changedKeys = Object.entries(newSettings)
			.filter(([key, value]) => !isJsonEqual(value as any, globalSettings[key]))
			.map(([key]) => key);
		for (const changedKey of changedKeys) {
			this.temporarySettings[changedKey] = newSettings[changedKey];
			this.sectionsConfig
				.map(section => section.settings)
				.flat()
				.find(setting => setting.settingKey === changedKey)
				.updateState(newSettings[changedKey]);
		}
		this.applyTemporarySettings();
	}

	private applyTemporarySettings() {
		if (isObjectEmpty(this.temporarySettings))
			return;
		globalSettings = {
			...globalSettings,
			...deepClone(this.temporarySettings),
		};
		window.dispatchEvent(new CustomEvent("ph-settings-changed", { detail: deepClone(this.temporarySettings) }));
		this.temporarySettings = {};
		localStorage.settings = JSON.stringify(globalSettings);
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
