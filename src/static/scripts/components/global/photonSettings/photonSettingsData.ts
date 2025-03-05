import {RedditPreferences} from "../../../types/redditTypes";
import {editableTimeStrToMs, makeElement, timeMsToEditableTimeStr} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import {defaultSettings, PhotonSettings} from "./settingsConfig";

export interface SettingsSection {
	name: string,
	iconUrl: string,
	settings: SettingConfig[]
}

export interface ValidatorReturn {
	isValid: boolean,
	error?: string
}

export enum SettingsApi {
	Photon, Reddit
}

export type PhotonSettingsKey = keyof PhotonSettings;
export type SettingsKey = keyof PhotonSettings | keyof RedditPreferences;

export abstract class SettingConfig {
	name: string;
	description: string;
	settingKey: SettingsKey;
	settingsType: SettingsApi;
	protected element: HTMLElement;
	protected abstract makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement;
	abstract updateState(newVal);
	abstract validateValue(newValue): ValidatorReturn;

	constructor(settingKey: SettingsKey, name: string, description: string, settingsType: SettingsApi) {
		this.settingKey = settingKey;
		this.name = name;
		this.description = description;
		this.settingsType = settingsType;
	}

	getElement(onValueChange?: (source: SettingConfig, newVal?: any) => void): HTMLElement {
		return this.element ?? (this.element = this.makeElement(onValueChange));
	}

	getProperty(): any {
		switch (this.settingsType) {
		case SettingsApi.Photon:
			return Users.global.d.photonSettings[this.settingKey];
		case SettingsApi.Reddit:
			return Users.current.d.redditPreferences?.[this.settingKey];
		}
	}
}

export class BooleanSetting extends SettingConfig {
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
					...(this.getProperty() ? { checked: "" } : {}),
					onchange: (e: InputEvent) => onValueChange(this, (e.currentTarget as HTMLInputElement).checked),
				}) as HTMLInputElement,
				makeElement("label", { for: `${this.settingKey}Setting` }),
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
				this.settingsType === SettingsApi.Photon && makeElement("button", {
					class: "resetButton transparentButtonAlt",
					"data-tooltip": "Default",
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
	private validator: NumberValidatorConfig;
	private input: HTMLInputElement;

	constructor(validator: NumberValidatorConfig, settingKey: SettingsKey, name: string, description: string, settingsType: SettingsApi) {
		super(settingKey, name, description, settingsType);
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
					value: this.getProperty()?.toString(),
					onchange: (e: InputEvent) => onValueChange(this, Number((e.currentTarget as HTMLInputElement).value)),
				}) as HTMLInputElement,
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
				this.settingsType === SettingsApi.Photon && makeElement("button", {
					class: "resetButton transparentButtonAlt",
					"data-tooltip": "Default",
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
	private validator: NumberValidatorConfig;
	private input: HTMLInputElement;

	constructor(validator: NumberValidatorConfig, settingKey: SettingsKey, name: string, description: string, settingsType: SettingsApi) {
		super(settingKey, name, description, settingsType);
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
					value: timeMsToEditableTimeStr(this.getProperty()),
					onchange: (e: InputEvent) => onValueChange(this,
						editableTimeStrToMs((e.currentTarget as HTMLInputElement).value, false)),
				}) as HTMLInputElement,
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
				this.settingsType === SettingsApi.Photon && makeElement("button", {
					class: "resetButton transparentButtonAlt",
					"data-tooltip": "Default",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal: number) {
		this.input.value = timeMsToEditableTimeStr(newVal);
	}
}

export class TextSetting extends SettingConfig {
	private placeholder: string;
	private input: HTMLInputElement;

	constructor(settingKey: SettingsKey, name: string, description: string, settingsType: SettingsApi, placeholder: string = "") {
		super(settingKey, name, description, settingsType);
		this.placeholder = placeholder;
	}

	validateValue(newValue): ValidatorReturn {
		return { isValid: true };
	}

	makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		return makeElement("div", { class: "inputWrapper text" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("label", { class: "name", for: `${this.settingKey}Setting`, onmousedown: e => e.preventDefault() }, this.name),
				this.input = makeElement("input", {
					type: "text",
					placeholder: this.placeholder,
					id: `${this.settingKey}Setting`,
					class: "text",
					value: this.getProperty(),
					onchange: (e: InputEvent) => onValueChange(this, (e.currentTarget as HTMLInputElement).value),
				}) as HTMLInputElement,
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
				this.settingsType === SettingsApi.Photon && makeElement("button", {
					class: "resetButton transparentButtonAlt",
					"data-tooltip": "Default",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal: string) {
		this.input.value = newVal;
	}
}

export interface MultiOption {
	text: string,
	value: any
}

export class MultiOptionSetting extends SettingConfig {
	private options: MultiOption[];
	private buttonsRoot: HTMLElement;

	constructor(options: MultiOption[], settingKey: SettingsKey, name: string, description: string, settingsType: SettingsApi) {
		super(settingKey, name, description, settingsType);
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
						class: `option ${this.getProperty() === option.value ? " selected" : ""}`,
						onclick: (e) => {
							if ((e.currentTarget as HTMLElement).classList.contains("selected"))
								return;
							onValueChange(this, option.value);
						}
					}, option.text)
				))
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
				this.settingsType === SettingsApi.Photon && makeElement("button", {
					class: "resetButton transparentButtonAlt",
					"data-tooltip": "Default",
					onclick: () => onValueChange(this, defaultSettings[this.settingKey])
				}, [makeElement("img", { src: "/img/reset.svg" })])
			])
		]);
	}

	updateState(newVal) {
		this.buttonsRoot.$class("selected")[0]?.classList.remove("selected");
		const option = this.options.find(option => option.value === newVal);
		Array.from(this.buttonsRoot.children)
			.find((btn: HTMLElement) => btn.textContent === option.text)
			.classList.add("selected");
	}
}

export class HTMLElementSetting extends SettingConfig {
	constructor(element: HTMLElement) {
		super(null, "", "", SettingsApi.Photon);
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

