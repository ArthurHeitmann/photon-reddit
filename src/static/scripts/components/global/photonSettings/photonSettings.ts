import {updateUserPreferences} from "../../../api/redditApi";
import {PhEvents} from "../../../types/Events";
import {RedditPreferences} from "../../../types/redditTypes";
import {escHTML} from "../../../utils/htmlStatics";
import "../../../utils/htmlStuff";
import {broadcastMessage, MessageFormat, onMessageBroadcast} from "../../../utils/messageCommunication";
import {deepClone, ensurePageLoaded, isJsonEqual, isObjectEmpty, makeElement} from "../../../utils/utils";
import Ph_ModalPane from "../../misc/modalPane/modalPane";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";
import {SettingConfig, SettingsApi, SettingsSection} from "./photonSettingsData";
import {getSettingsSections} from "./settingsSections";
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
	subredditBlacklist?: string[],
	userShortCacheTTLMs?: number,
	displayRedditEmojis?: boolean,
	emptyAreaClickGoesBack?: boolean
	userBlacklist?: string[],
	tileTextBlacklist?: string[],
	flairTextBlacklist?: string[],
	applyUserBlacklistToComments?: boolean,
	hidePostFlairs?: boolean,
	hidePostTitle?: boolean,
	hidePostTopInfo?: boolean,
	hidePostLeftBar?: boolean,
	hideCrosspostInfo?: boolean,
	hideSubredditMiniIcon?: boolean,
	feedWidth?: number
	postAndCommentsWidth?: number,
	beforeExitConfirmation?: boolean,
	autoCollapsePinnedComment?: boolean,
	altVolumeFunction?: boolean,
	animateFullscreenTransition?: boolean,
}

// default config
export const defaultSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	loadInlineMedia: false,
	firstShowControlBar: true,
	imageLimitedHeight: 70,
	preferHigherVideoQuality: true,
	autoplayVideos: true,
	globalVideoVolume: true,
	nsfwPolicy: NsfwPolicy.covered,
	markSeenPosts: true,
	hideSeenPosts: false,
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 2,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 365,
	enableFab: true,
	isIncognitoEnabled: false,
	tooltipsVisible: true,
	messageCheckIntervalMs: 30 * 1000,
	userShortCacheTTLMs: 1000 * 60 * 5,
	displayRedditEmojis: true,
	emptyAreaClickGoesBack: true,
	subredditBlacklist: [],
	userBlacklist: [],
	tileTextBlacklist: [],
	flairTextBlacklist: [],
	applyUserBlacklistToComments: false,
	hidePostFlairs: false,
	hidePostTitle: false,
	hidePostTopInfo: false,
	hidePostLeftBar: false,
	hideCrosspostInfo: false,
	hideSubredditMiniIcon: false,
	feedWidth: 50,
	postAndCommentsWidth: 60,
	beforeExitConfirmation: false,
	autoCollapsePinnedComment: false,
	altVolumeFunction: false,
	animateFullscreenTransition: false,
};

/** Stores and manages global settings */
export default class Ph_PhotonSettings extends Ph_ModalPane {
	/** unsaved settings are stored here */
	temporarySettings: PhotonSettings = {};
	sectionsConfig: SettingsSection[];

	constructor() {
		super();

		this.classList.add("photonSettings");
		this.hide();

		ensurePageLoaded().then(() => this.init());
		window.addEventListener(PhEvents.viewChange, () => this.hide());
	}

	private async init() {
		this.sectionsConfig = getSettingsSections();

		const sections: { [name: string]: HTMLElement } = {};
		const redditPrefsElements: HTMLElement[] = [];
		for (const section of this.sectionsConfig) {
			sections[section.name] = makeElement("div", { class: "section" }, [
				makeElement("div", { class: "sectionName" }, section.name),
				...section.settings.map(
					setting => {
						const element = setting.getElement(this.onSettingChange.bind(this));
						if (section.name === "Reddit Prefs")
							redditPrefsElements.push(element);
						return element;
					}
				)
			]);
		}
		sections[this.sectionsConfig[0].name].classList.add("selected");
		const updateRedditPrefsVisibility = () => redditPrefsElements.forEach(e => e.classList.toggle("hide", Users.current.isGuest));
		updateRedditPrefsVisibility();
		window.addEventListener(PhEvents.userChanged, updateRedditPrefsVisibility);

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

		onMessageBroadcast(this.onSettingsExternalChange.bind(this), PhEvents.settingsChanged);
		window.addEventListener(PhEvents.userChanged, this.onUserChange.bind(this));
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
			source.updateState(Users.global.d.photonSettings[source.settingKey]);
			return;
		}
		source.updateState(newVal);
		this.temporarySettings[source.settingKey as string] = newVal;
		await this.applyTemporarySettings();
		broadcastMessage({
			type: PhEvents.settingsChanged,
			newSettings: Users.global.d.photonSettings
		});
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

	async setSettingTo<K extends keyof PhotonSettings>(prop: K, value: PhotonSettings[K]) {
		const settingConfig = this.sectionsConfig
			.map(section => section.settings)
			.flat()
			.find(setting => setting.settingKey === prop);
		if (!settingConfig)
			throw "Invalid key";
		await this.onPhotonSettingChange(settingConfig, value);
	}

	private async onSettingsExternalChange(msg: MessageFormat) {
		if (msg.type !== PhEvents.settingsChanged)
			return;
		const newSettings = msg.newSettings;
		const changedKeys = Object.entries(newSettings)
			.filter(([key, value]) => !isJsonEqual(value as any, Users.global.d.photonSettings[key]))
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
		await Users.global.set(["photonSettings"], {
			...Users.global.d.photonSettings,
			...deepClone(this.temporarySettings),
		});
		window.dispatchEvent(new CustomEvent(PhEvents.settingsChanged, { detail: deepClone(this.temporarySettings) }));
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

	private onUserChange() {
		for (const section of this.sectionsConfig) {
			for (const setting of section.settings) {
				const newVal = setting.getProperty();
				if (newVal !== undefined)
					setting.updateState(newVal);
			}
		}
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
