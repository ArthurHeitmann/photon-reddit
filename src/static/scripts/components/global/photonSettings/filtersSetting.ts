import { makeElement } from "../../../utils/utils";
import { SettingConfig, SettingsApi, SettingsKey, ValidatorReturn } from "./photonSettingsData";

export class FiltersSetting extends SettingConfig {
	private entryInput: HTMLInputElement;
	private onValueChange: (source: SettingConfig, newVal: string[]) => void;
	private inputTransformer: (input: string) => string;

	constructor(
		settingKey: SettingsKey,
		name: string,
		description: string,
		settingsType: SettingsApi,
		inputTransformer: (input: string) => string = (input) => input
	) {
		super(settingKey, name, description, settingsType);

		this.inputTransformer = inputTransformer;
	}

	protected makeElement(onValueChange: (source: SettingConfig, newVal: any) => void): HTMLElement {
		this.onValueChange = onValueChange;
		return makeElement("div", { class: "inputWrapper filtersWrapper" }, [
			makeElement("div", { class: "mainRow" }, [
				makeElement("label", { class: "name", onmousedown: e => e.preventDefault() }, this.name),
			]),
			makeElement("div", { class: "bottomRow" }, [
				this.description && makeElement("div", { class: "description" }, this.description),
			]),
			makeElement("div", { class: "filtersEntry" }, [
				makeElement("button", { class: "add transparentButtonAlt", onclick: this.addEntry.bind(this) }),
				this.entryInput = makeElement("input", { onkeydown: (e: KeyboardEvent) => e.code === "Enter" && this.addEntry()}) as HTMLInputElement
			]),
			makeElement("div", { class: "filtersList" }, this.makeEntriesList(this.getProperty()))
		]);
	}

	private makeEntriesList(entries: string[]): HTMLElement[] {
		return entries.map(entry =>
			makeElement("div", { class: "filtersEntry" }, [
				makeElement("button", { class: "remove transparentButtonAlt", onclick: () => this.removeEntry(entry) }),
				makeElement("div", {}, entry)
			])
		);
	}

	private addEntry() {
		const newEntry = this.inputTransformer(this.entryInput.value);
		const newList: string[] = [...this.getProperty()];
		newList.push(newEntry);
		this.onValueChange(this, newList);
	}

	private removeEntry(entryValue: string) {
		const newList: string[] = [...this.getProperty()];
		newList.splice(newList.indexOf(entryValue), 1);
		this.onValueChange(this, newList)
	}

	updateState(newVal: string[]) {
		const elements = this.element.$class("filtersList")[0];
		elements.innerHTML = "";
		elements.append(...this.makeEntriesList(newVal));
	}

	validateValue(newValue: string[]): ValidatorReturn {
		for (const entry of newValue) {
			if (!entry)
				return { isValid: false, error: "Input can't be empty" };
			if (newValue.filter(e => e.toLowerCase() === entry.toLowerCase()).length > 1)
				return { isValid: false, error: "No duplicates allowed" };
		}
		return { isValid: true };
	}
}
