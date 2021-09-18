import { editableTimeStrToMs, makeElement, timeMsToEditableTimeStr } from "../../../utils/utils";
import { defaultSettings, globalSettings, ImageLoadingPolicy, NsfwPolicy, PhotonSettings } from "./photonSettings";

export interface SettingsSection {
	name: string,
	iconUrl: string,
	settings: SettingConfig[]
}

enum SettingType {
	MultiOption, Boolean, Number, Time, HTMLElement
}

export interface ValidatorReturn {
	isValid: boolean,
	error?: string
}

export abstract class SettingConfig {
	name: string;
	description: string;
	settingKey: keyof PhotonSettings;
	abstract type: SettingType;
	abstract makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement;
	abstract updateState(newVal);
	abstract validateValue(newValue): ValidatorReturn;

	constructor(settingKey: keyof PhotonSettings, name: string, description: string) {
		this.settingKey = settingKey;
		this.name = name;
		this.description = description;
	}
}

export class BooleanSetting extends SettingConfig {
	type = SettingType.Boolean;
	private input: HTMLInputElement;

	validateValue(newValue): ValidatorReturn {
		return typeof newValue === "boolean" ? { isValid: true }: { isValid: false, error: `Invalid boolean value ${newValue}` };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void) {
		return makeElement("div", { class: "inputWrapper boolean" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("label", { class: "name", for: `${this.settingKey}Setting`, onmousedown: e => e.preventDefault() }, this.name),
				this.input = makeElement("input", {
					type: "checkbox",
					id: `${this.settingKey}Setting`,
					class: "checkbox",
					...(globalSettings[this.settingKey] ? { checked: "" } : {}),
					onchange: (e: InputEvent) => onValueChange(this, (e.currentTarget as HTMLInputElement).checked),
				}) as HTMLInputElement,
				makeElement("label", { for: `${this.settingKey}Setting` }),
			]),
			makeElement("div", { class: "bottomRow" }, [
				makeElement("div", { class: "description" }, this.description),
				makeElement("button", {
					class: "resetButton transparentButtonAlt",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal: boolean) {
		this.input.checked = newVal;
	}
}

export interface NumberValidatorConfig {
	allowRange?: [number, number],
	allowList?: number[],
	allowFloats?: boolean,
}

export class NumberSetting extends SettingConfig {
	type = SettingType.Number;
	private validator: NumberValidatorConfig;
	private input: HTMLInputElement;

	constructor(validator: NumberValidatorConfig, settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.validator = validator;
	}

	validateValue(newValue): ValidatorReturn {
		const num = Number(newValue);
		if (isNaN(num))
			return { isValid: false, error: "Enter a valid number" };
		if (!this.validator.allowFloats && !Number.isInteger(num))
			return { isValid: false, error: "Decimals are not allowed" };
		if (this.validator.allowList || this.validator.allowRange) {
			if (this.validator.allowList && this.validator.allowList.includes(num))
				return { isValid: true };
			else if (this.validator.allowRange && num >= this.validator.allowRange[0] && num <= this.validator.allowRange[1])
				return { isValid: true };
			return { isValid: false, error: "Number outside of allowed range" };
		}
		return { isValid: true };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper number" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("label", { class: "name", for: `${this.settingKey}Setting`, onmousedown: e => e.preventDefault() }, this.name),
				this.input = makeElement("input", {
					type: "number",
					id: `${this.settingKey}Setting`,
					class: "text",
					value: globalSettings[this.settingKey].toString(),
					onchange: (e: InputEvent) => onValueChange(this, Number((e.currentTarget as HTMLInputElement).value)),
				}) as HTMLInputElement,
			]),
			makeElement("div", { class: "bottomRow" }, [
				makeElement("div", { class: "description" }, this.description),
				makeElement("button", {
					class: "resetButton transparentButtonAlt",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal: number) {
		this.input.value = newVal.toString();
	}
}

export class TimeSetting extends SettingConfig {
	type = SettingType.Time;
	private validator: NumberValidatorConfig;
	private input: HTMLInputElement;

	constructor(validator: NumberValidatorConfig, settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.validator = validator;
	}

	validateValue(newValue): ValidatorReturn {
		if (isNaN(newValue))
			return { isValid: false, error: `Invalid: ${newValue}` };
		if (!this.validator.allowFloats && !Number.isInteger(newValue))
			return { isValid: false, error: "Decimals are not allowed" };
		if (this.validator.allowList || this.validator.allowRange) {
			if (this.validator.allowList && this.validator.allowList.includes(newValue))
				return { isValid: true };
			else if (this.validator.allowRange && newValue >= this.validator.allowRange[0] && newValue <= this.validator.allowRange[1])
				return { isValid: true };
			return { isValid: false, error: "Number outside of allowed range" };
		}
		return { isValid: true };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper number time" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("label", { class: "name", for: `${this.settingKey}Setting`, onmousedown: e => e.preventDefault() }, this.name),
				this.input = makeElement("input", {
					type: "text",
					id: `${this.settingKey}Setting`,
					class: "text",
					value: timeMsToEditableTimeStr(globalSettings[this.settingKey] as number),
					onchange: (e: InputEvent) => onValueChange(this,
						editableTimeStrToMs((e.currentTarget as HTMLInputElement).value, false)),
				}) as HTMLInputElement,
			]),
			makeElement("div", { class: "bottomRow" }, [
				makeElement("div", { class: "description" }, this.description),
				makeElement("button", {
					class: "resetButton transparentButtonAlt",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal: number) {
		this.input.value = timeMsToEditableTimeStr(newVal);
	}
}

export interface MultiOption {
	text: string,
	value: any
}

export class MultiOptionSetting extends SettingConfig {
	type = SettingType.MultiOption;
	private options: MultiOption[];
	private buttonsRoot: HTMLElement;

	constructor(options: MultiOption[], settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.options = options;
	}

	validateValue(newValue): ValidatorReturn {
		return this.options.findIndex(option => option.value === newValue) !== -1
			? { isValid: true }
			: { isValid: false, error: `${newValue} is not in ${this.options.map(opt => opt.value).join(", ")}` };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper multiOptions" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("div", { class: "name" }, this.name),
				this.buttonsRoot = makeElement("div", { class: "options" }, this.options.map(
					option => makeElement("button", {
						class: `option ${globalSettings[this.settingKey] === option.value ? " selected" : ""}`,
						onclick: (e) => {
							if ((e.currentTarget as HTMLElement).classList.contains("selected"))
								return;
							onValueChange(this, option.value);
						}
					}, option.text)
				))
			]),
			makeElement("div", { class: "bottomRow" }, [
				makeElement("div", { class: "description" }, this.description),
				makeElement("button", {
					class: "resetButton transparentButtonAlt",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal) {
		this.buttonsRoot.$class("selected")[0].classList.remove("selected");
		const option = this.options.find(option => option.value === newVal);
		Array.from(this.buttonsRoot.children)
			.find((btn: HTMLElement) => btn.innerText === option.text)
			.classList.add("selected");
	}
}

export class HTMLElementSetting extends SettingConfig {
	type: SettingType;
	private element: HTMLElement

	constructor(element: HTMLElement) {
		super(null, "", "");
		this.element = element;
	}

	validateValue(newValue): ValidatorReturn {
		return { isValid: true };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		return this.element.cloneNode(true) as HTMLElement;
	}

	updateState(newVal) {}
}

export const getSettingsSections = () => <SettingsSection[]> [
	{
		name: "Post",
		iconUrl: "/img/post.svg",
		settings: [
			new BooleanSetting("markSeenPosts", "Mark seen posts", "Mark posts you have scrolled past. Seen posts are only stored in your browser"),
			new BooleanSetting("hideSeenPosts", "Hide seen posts", "Hide posts marked as seen (above option). When viewing a user all posts are always visible"),
			new TimeSetting({ allowRange: [1, Number.MAX_SAFE_INTEGER] }, "clearSeenPostAfterMs", "Store seen posts for", "TODO"),
			new MultiOptionSetting([
				{ text: "Hide NSFW", value: NsfwPolicy.never },
				{ text: "Blur NSFW", value: NsfwPolicy.covered },
				{ text: "Show NSFW", value: NsfwPolicy.always },
			], "nsfwPolicy", "NSFW post visibility", "TODO")
		]
	},
	{
		name: "Images",
		iconUrl: "/img/fileImage.svg",
		settings: [
			new MultiOptionSetting(
				[
					{ text: "Only previews", value: ImageLoadingPolicy.alwaysPreview },
					{ text: "Original in fullscreen", value: ImageLoadingPolicy.originalInFs },
					{ text: "Always originals", value: ImageLoadingPolicy.alwaysOriginal },
				], "imageLoadingPolicy", "Image Previews", "Decide whether images in posts are loaded in max resolution or preview quality"
			),
			new NumberSetting({ allowRange: [0, Number.MAX_SAFE_INTEGER] }, "imageLimitedHeight", "Max image height", "Set the maximum image height in % of screen height. Set height to \"0\" to disable height limits.")
		]
	},
	{
		name: "Videos",
		iconUrl: "/img/fileVideo.svg",
		settings: [
			new BooleanSetting("preferHigherVideoQuality", "Prefer higher video quality", "TODO"),
			new BooleanSetting("autoplayVideos", "Autoplay videos", "TODO"),
			new BooleanSetting("globalVideoVolume", "Sync video volume", "TODO"),
		]
	},
	{
		name: "General UI",
		iconUrl: "/img/settings2.svg",
		settings: [
			new BooleanSetting("loadInlineMedia", "Load inline media", "TODO"),
			new BooleanSetting("firstShowControlBar", "Initially show bottom bar for images & videos", "TODO"),
			new BooleanSetting("enableFab", "Enable FAB", "TODO"),
			new BooleanSetting("tooltipsVisible", "Show tooltips", "TODO"),
		]
	},
	{
		name: "Other",
		iconUrl: "/img/circle.svg",
		settings: [
			new BooleanSetting("isIncognitoEnabled", "Incognito Mode", "TODO"),
			new TimeSetting({ allowRange: [1, Number.MAX_SAFE_INTEGER] }, "clearFeedCacheAfterMs", "Subreddit Info cache duration", "TODO"),
			new TimeSetting({ allowRange: [1000 * 10, Number.MAX_SAFE_INTEGER], allowList: [0] }, "messageCheckIntervalMs", "New messages checking interval", "TODO"),
		]
	},
];