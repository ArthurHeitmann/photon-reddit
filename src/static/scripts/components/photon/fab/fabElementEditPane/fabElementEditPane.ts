import { makeElement } from "../../../../utils/utils";
import Ph_FabElement from "../fabElement/fabElement";
import { FabAction, FabIcon, FabPreset } from "../fabElementConfig";

export default class Ph_FabElementEditPane extends HTMLElement {
	actions: FabAction[] = [
		{ type: "function", action: "", names: ["Nothing"] },
		{ type: "url", action: "/", names: ["Frontpage", "home", "start"] },
		{ type: "url", action: "/message/inbox", names: ["Inbox", "messages", "chat"] },
		{ type: "function", action: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
		{ type: "function", action: "Submit", names: ["Post", "submit", "new", "write"] },
		{ type: "url", action: "/message/compose", names: ["Compose Message", "message", "new", "compose", "chat"] },
	];
	icons: FabIcon[] = [
		{ url: "/img/circle.svg", names: ["Nothing", "empty", "base", "blank", "circle", "ring"] },
		{ url: "/img/bookOpen.svg", names: ["Frontpage", "book", "home", "start"] },
		{ url: "/img/envelope.svg", names: ["Inbox", "messages", "chat", "envelope"] },
		{ url: "/img/user.svg", names: ["Profile", "my", "me", "profile", "user"] },
		{ url: "/img/edit.svg", names: ["Submit", "write", "edit", "pen"] },
		{ url: "/img/writeMessage.svg", names: ["Submit", "write", "edit", "pen", "message", "chat"] },
	];
	presets: FabPreset[] = [
		{ action: this.actions[0], icon: this.icons[0], presetName: "Nothing", names: ["Nothing", "empty", "blank"] },
		{ action: this.actions[0], icon: this.icons[0], presetName: "Custom", names: ["Custom"] },
		{ action: this.actions[1], icon: this.icons[1], presetName: "Frontpage", names: ["Frontpage", "home", "start"] },
		{ action: this.actions[2], icon: this.icons[2], presetName: "Inbox", names: ["Inbox", "messages", "chat"] },
		{ action: this.actions[3], icon: this.icons[3], presetName: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
		{ action: this.actions[4], icon: this.icons[4], presetName: "New Post", names: ["Post", "submit", "new", "write"] },
		{ action: this.actions[5], icon: this.icons[5], presetName: "New Message", names: ["Compose Message", "message", "new", "compose", "chat"] },
	];
	customPreset: FabPreset = this.presets[1];
	currentPreset: FabPreset = this.presets[0];
	controllingElement: Ph_FabElement;

	constructor(controllingElement: Ph_FabElement) {
		super();

		this.controllingElement = controllingElement;
		this.classList.add("fabElementEditPane");

		const presetsSectionButton = makeElement("button", { "class": "selected" }, "Presets");
		presetsSectionButton.addEventListener("click", () => this.selectSection(presetsSectionButton, presetsSection));
		const presetsSection = makeElement("div", { "class": "section selected" }, [
			makeElement("div", { "class": "inputWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "results presets" },
				this.presets.map(preset => {
					const presetBtn = makeElement("button", {
						"class": "result preset" + (this.currentPreset === preset ? " selected" : ""),
						"data-name": preset.presetName,
						"data-names": preset.names.join(",")
					}, [
						makeElement("img", { src: preset.icon.url, alt: preset.names[0] }),
						makeElement("div", { "class": preset.presetName.length > 5 ? "small" : "" }, preset.presetName),
					]);
					presetBtn.addEventListener("click", () => this.setActivePreset(preset));
					return presetBtn;
				})
			)
		]);
		const actionSectionButton = makeElement("button", null, "Action");
		actionSectionButton.addEventListener("click", () => this.selectSection(actionSectionButton, actionSection));
		const actionSection = makeElement("div", { "class": "section" }, [
			makeElement("div", { "class": "inputWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL" })
			]),
			makeElement("div", { "class": "results actions" },
				this.actions.map(action => {
					const actionBtn = makeElement("button", {
						"class": "result action" + (this.currentPreset.action === action ? " selected" : ""),
						"data-names": action.names.join(","),
						"data-action": action.action
					}, [
						makeElement("div", { "class": action.names[0].length > 5 ? "small" : "" }, action.names[0]),
					]);
					actionBtn.addEventListener("click", () => this.setActiveAction(action));
					return actionBtn;
				})
			)
		]);
		const iconSectionButton = makeElement("button", null, "Icon");
		iconSectionButton.addEventListener("click", () => this.selectSection(iconSectionButton, iconSection));
		const iconSection = makeElement("div", { "class": "section" }, [
			makeElement("div", { "class": "inputWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL" })
			]),
			makeElement("div", { "class": "results icons" },
				this.icons.map(icon => {
					const iconBtn = makeElement("button", {
						"class": "result icon" + (this.currentPreset.icon === icon ? " selected" : ""),
						"data-names": icon.names.join(","),
						"data-url": icon.url
					}, [
						makeElement("img", { "src": icon.url, alt: icon.names[0] })
					]);
					iconBtn.addEventListener("click", () => this.setActiveIcon(icon));
					return iconBtn;
				})
			)
		]);

		this.append(
			makeElement("div", { "class": "header" }, [
				presetsSectionButton,
				actionSectionButton,
				iconSectionButton,
			]),
			presetsSection, actionSection, iconSection
		);

		setTimeout(() => this.controllingElement.loadPreset(this.currentPreset), 0);
	}

	setActivePreset(newPreset: FabPreset) {
		this.currentPreset = newPreset;
		this.$css(".results.presets button.selected")[0]
			?.classList.remove("selected");
		this.$css(`.results.presets button[data-name="${newPreset.presetName}"]`)[0]
			?.classList.add("selected");
		this.setActiveAction(newPreset.action, false);
		this.setActiveIcon(newPreset.icon, false);
		this.controllingElement.loadPreset(newPreset);
	}

	setActiveAction(newAction: FabAction, updatePreset = true) {
		this.$css(".results.actions button.selected")[0]
			?.classList.remove("selected");
		this.$css(`.results.actions button[data-action="${newAction.action}"]`)[0]
			?.classList.add("selected");
		if (!updatePreset)
			return;
		let preset = this.findMatchingPreset(newAction, this.currentPreset.icon);
		if (!preset) {
			this.customPreset.action = newAction;
			this.customPreset.icon = this.currentPreset.icon;
			this.currentPreset = this.customPreset;
			preset = this.currentPreset;
		}
		this.setActivePreset(preset);
	}

	setActiveIcon(newIcon: FabIcon, updatePreset = true) {
		this.$css(".results.icons button.selected")[0]
			?.classList.remove("selected");
		this.$css(`.results.icons button[data-url="${newIcon.url}"]`)[0]
			?.classList.add("selected");
		if (!updatePreset)
			return;
		let preset = this.findMatchingPreset(this.currentPreset.action, newIcon);
		if (!preset) {
			this.customPreset.action = this.currentPreset.action;
			this.customPreset.icon = newIcon;
			this.currentPreset = this.customPreset;
			preset = this.currentPreset;
		}
		this.setActivePreset(preset);
	}

	findMatchingPreset(action: FabAction, icon: FabIcon): FabPreset {
		return this.presets.find(preset => preset.action === action && preset.icon === icon);
	}

	show() {
		this.classList.add("show");
	}

	hide() {
		this.classList.remove("show");
	}

	private selectSection(sectionHeader: HTMLElement, section: HTMLElement) {
		this.$css(".header button.selected")?.[0]?.classList.remove("selected");
		this.$css(".section.selected")?.[0]?.classList.remove("selected");
		sectionHeader.classList.add("selected");
		section.classList.add("selected");
	}
}

customElements.define("ph-fab-element-edit-pane", Ph_FabElementEditPane);
