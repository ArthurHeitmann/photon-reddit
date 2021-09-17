import { editableTimeStrToMs, makeElement, timeMsToEditableTimeStr } from "../../../utils/utils";
import { globalSettings, ImageLoadingPolicy, PhotonSettings } from "./photonSettings";

export interface SettingsSection {
	name: string,
	iconUrl: string,
	settings: SettingConfig[]
}

enum SettingType {
	MultiOption, Boolean, Number, Time, HTMLElement
}

export abstract class SettingConfig {
	name: string;
	description: string;
	settingKey: keyof PhotonSettings;
	abstract type: SettingType;
	abstract makeElement(onValueInput: (newVal: any) => void): HTMLElement;
	abstract validateValue(newValue): boolean;

	constructor(settingKey: keyof PhotonSettings, name: string, description: string) {
		this.settingKey = settingKey;
		this.name = name;
		this.description = description;
	}
}

export class BooleanSetting extends SettingConfig {
	type = SettingType.Boolean;

	validateValue(newValue): boolean {
		return typeof newValue === "boolean";
	}

	makeElement(onValueInput: (newVal: any) => void) {
		return makeElement("div", { class: "inputWrapper" }, [
			makeElement("label", { for: `${this.settingKey}Setting` }, this.name),
			makeElement("input", {
				type: "checkbox",
				id: `${this.settingKey}Setting`,
				class: "checkbox",
				...(globalSettings[this.settingKey] ? { checked: "" } : {}),
				oninput: (e: InputEvent) => onValueInput((e.currentTarget as HTMLInputElement).checked),
			}),
			makeElement("label", { for: `${this.settingKey}Setting` }),
		]);
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

	constructor(validator: NumberValidatorConfig, settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.validator = validator;
	}

	validateValue(newValue): boolean {
		const num = Number(newValue);
		if (isNaN(num))
			return false
		if (!this.validator.allowFloats && !Number.isInteger(num))
			return false;
		if (this.validator.allowList || this.validator.allowRange) {
			if (this.validator.allowList && this.validator.allowList.includes(num))
				return true;
			else if (this.validator.allowRange && num >= this.validator.allowRange[0] && num <= this.validator.allowRange[1])
				return true;
			return false;
		}
		return true;
	}

	makeElement(onValueInput: (newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper" }, [
			makeElement("label", { for: `${this.settingKey}Setting` }),
			makeElement("input", {
				type: "number",
				id: `${this.settingKey}Setting`,
				class: "text",
				value: globalSettings[this.settingKey].toString(),
				oninput: (e: InputEvent) => onValueInput(Number((e.currentTarget as HTMLInputElement).value)),
			}),
		]);
	}
}

export class TimeSetting extends SettingConfig {
	type = SettingType.Time;
	private validator: NumberValidatorConfig;

	constructor(validator: NumberValidatorConfig, settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.validator = validator;
	}

	validateValue(newValue): boolean {
		const num = editableTimeStrToMs(newValue);
		if (isNaN(num))
			return false
		if (!this.validator.allowFloats && !Number.isInteger(num))
			return false;
		if (this.validator.allowList || this.validator.allowRange) {
			if (this.validator.allowList && this.validator.allowList.includes(num))
				return true;
			else if (this.validator.allowRange && num >= this.validator.allowRange[0] && num <= this.validator.allowRange[1])
				return true;
			return false;
		}
		return true;
	}

	makeElement(onValueInput: (newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper" }, [
			makeElement("label", { for: `${this.settingKey}Setting` }),
			makeElement("input", {
				type: "text",
				id: `${this.settingKey}Setting`,
				class: "text",
				value: timeMsToEditableTimeStr(globalSettings[this.settingKey] as number),
				oninput: (e: InputEvent) => onValueInput((e.currentTarget as HTMLInputElement).value),
			}),
			makeElement("label", { for: `${this.settingKey}Setting` }),
		]);
	}
}

export interface MultiOption {
	text: string,
	value: any
}

export class MultiOptionSetting extends SettingConfig {
	type = SettingType.MultiOption;
	private options: MultiOption[];

	constructor(options: MultiOption[], settingKey: keyof PhotonSettings, name: string, description: string) {
		super(settingKey, name, description);
		this.options = options;
	}

	validateValue(newValue): boolean {
		return this.options.findIndex(option => option.value === newValue) !== -1;
	}

	makeElement(onValueInput: (newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "multiOptions" }, this.options.map(
			option => makeElement("button", {
				class: `option ${globalSettings[this.settingKey] === option.value ? " selected" : ""}`,
				onclick: (e) => {
					const btn = e.currentTarget as HTMLElement;
					if (btn.classList.contains("selected"))
						return;
					btn.parentElement.$class("selected")[0].classList.remove("selected");
					btn.classList.add("selected");
					onValueInput(option.value);
				}
			}, option.text)
		));
	}
}

export class HTMLElementSetting extends SettingConfig {
	type: SettingType;
	private element: HTMLElement

	constructor(element: HTMLElement) {
		super(null, "", "");
		this.element = element;
	}

	validateValue(newValue): boolean {
		return true;
	}

	makeElement(onValueInput: (newVal: any) => void): HTMLElement {
		return this.element.cloneNode(true) as HTMLElement;
	}
}

export const getSettingsSections = () => <SettingsSection[]> [
	{
		name: "Post",
		iconUrl: "/img/post.svg",
		settings: [
			new BooleanSetting("markSeenPosts", "Mark seen posts", "Mark posts you have scrolled past. Seen posts are only stored in your browser"),
			new BooleanSetting("hideSeenPosts", "Hide seen posts", "Hide posts marked as seen (above option). When viewing a user all posts are always visible"),
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
			new NumberSetting({ allowRange: [0, Number.MAX_SAFE_INTEGER] }, "imageLimitedHeight", "Max image height", "Set the maximum image height. Set height to \"0\" to disable height limits.")
		]
	}
];