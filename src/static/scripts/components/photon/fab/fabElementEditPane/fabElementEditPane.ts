import { elementWithClassInTree } from "../../../../utils/htmlStuff";
import { makeElement } from "../../../../utils/utils";
import Ph_FabElement from "../fabElement/fabElement";
import { FabAction, FabIcon, FabPreset } from "../fabElementConfig";

export default class Ph_FabElementEditPane extends HTMLElement {
	actions: FabAction[] = [
		{ type: "function", action: "", names: ["Nothing"] },
		{ type: "url", action: "/", names: ["Custom"] },
		{ type: "url", action: "/", names: ["Frontpage", "home", "start"] },
		{ type: "url", action: "/message/inbox", names: ["Inbox", "messages", "chat"] },
		{ type: "function", action: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
		{ type: "function", action: "Submit", names: ["Post", "submit", "new", "write"] },
		{ type: "url", action: "/message/compose", names: ["Compose Message", "message", "new", "compose", "chat"] },
		{ type: "function", action: "Unload Pages", names: ["Unload", "remove", "delete", "cross", "x", "pages"] },
	];
	icons: FabIcon[] = [
		{ url: "", names: ["Nothing", "empty", "base", "blank", "circle", "ring"] },
		{ url: "/img/circle.svg", names: ["Nothing", "empty", "base", "blank", "circle", "ring"] },
		{ url: "/img/bookOpen.svg", names: ["Frontpage", "book", "home", "start"] },
		{ url: "/img/envelope.svg", names: ["Inbox", "messages", "chat", "envelope"] },
		{ url: "/img/user.svg", names: ["Profile", "my", "me", "profile", "user"] },
		{ url: "/img/edit.svg", names: ["Submit", "write", "edit", "pen"] },
		{ url: "/img/writeMessage.svg", names: ["Submit", "write", "edit", "pen", "message", "chat"] },
		{ url: "/img/close.svg", names: ["Unload", "remove", "delete", "cross", "x", "pages"] },
	];
	presets: FabPreset[] = [
		{ action: this.actions[0], icon: this.icons[0], presetName: "Nothing", names: ["Nothing", "empty", "blank"] },
		{ action: this.actions[1], icon: this.icons[1], presetName: "Custom", names: ["Custom"] },
		{ action: this.actions[2], icon: this.icons[2], presetName: "Frontpage", names: ["Frontpage", "home", "start"] },
		{ action: this.actions[3], icon: this.icons[3], presetName: "Inbox", names: ["Inbox", "messages", "chat"] },
		{ action: this.actions[4], icon: this.icons[4], presetName: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
		{ action: this.actions[5], icon: this.icons[5], presetName: "New Post", names: ["Post", "submit", "new", "write"] },
		{ action: this.actions[6], icon: this.icons[6], presetName: "New Message", names: ["Compose Message", "message", "new", "compose", "chat"] },
		{ action: this.actions[7], icon: this.icons[7], presetName: "Unload Pages", names: ["Unload", "remove", "delete", "cross", "x", "pages"] },
	];
	customPreset: FabPreset = this.presets[1];
	customIconUrl = this.icons[1].url;
	currentPreset: FabPreset = this.presets[0];
	controllingElement: Ph_FabElement;

	constructor(controllingElement: Ph_FabElement) {
		super();

		this.controllingElement = controllingElement;
		this.classList.add("fabElementEditPane");

		const presetsSectionButton = makeElement(
			"button",
			{ class: "selected", onclick: () => this.selectSection(presetsSectionButton, presetsSection) },
			"Presets"
		);
		const presetsSection = makeElement("div", { class: "section selected" }, [
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("button", { class: "subredditOnlySearch transparentButton" }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter presets or find subreddits", oninput: this.onSearchInput.bind(this) })
			]),
			makeElement("div", { class: "results presets" },
				this.presets.map(preset => {
					return makeElement("button", {
						class: "result preset" + (this.currentPreset === preset ? " selected" : ""),
						"data-tooltip": preset.presetName,
						"data-name": preset.presetName,
						"data-names": preset.names.join(","),
						onclick: () => this.setActivePreset(preset)
					}, [
						makeElement("img", { src: preset.icon.url, alt: preset.names[0] }),
						makeElement("div", { class: preset.presetName.length > 5 ? "small" : "" }, preset.presetName),
					]);
				})
			)
		]);
		const actionSectionButton = makeElement(
			"button",
			{ onclick: () => this.selectSection(actionSectionButton, actionSection) },
			"Action"
		);
		const actionSection = makeElement("div", { class: "section" }, [
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("button", { class: "subredditOnlySearch transparentButton" }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter actions or find subreddit urls", oninput: this.onSearchInput.bind(this) })
			]),
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL", class: "customUrl", oninput: this.onActionUrlInput.bind(this) })
			]),
			makeElement("div", { class: "results actions" },
				this.actions.map(action => {
					return makeElement("button", {
						class: "result action" + (this.currentPreset.action === action ? " selected" : ""),
						"data-names": action.names.join(","),
						"data-action": action.action,
						onclick: () => this.setActiveAction(action)
					}, [
						makeElement("div", { class: action.names[0].length > 5 ? "small" : "" }, action.names[0]),
					]);
				})
			)
		]);
		const iconSectionButton = makeElement(
			"button",
			{ onclick: () => this.selectSection(iconSectionButton, iconSection) },
			"Icon"
		);
		const iconSection = makeElement("div", { class: "section" }, [
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("button", { class: "subredditOnlySearch transparentButton" }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter icons or find subreddit icons", oninput: this.onSearchInput.bind(this) })
			]),
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL", class: "iconUrl", oninput: this.onIconUrlInput.bind(this) })
			]),
			makeElement("div", { class: "results icons" },
				this.icons.map(icon =>
					makeElement("button", {
						class: "result icon" + (this.currentPreset.icon === icon ? " selected" : ""),
						"data-names": icon.names.join(","),
						"data-url": icon.url,
						onclick: () => this.setActiveIcon(icon)
					}, [
						makeElement("img", { "src": icon.url, alt: icon.names[0] })
					])
				)
			)
		]);

		this.append(
			makeElement("div", { class: "header" }, [
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
		(this.$css(`.results.actions button[data-action="${newAction.action}"]`)[0]
			?? this.$css(`.results.actions button[data-names^="${this.actions[1].names[0]}"]`)[0])
			?.classList.add("selected");
		(this.$css(`input.customUrl`)[0] as HTMLInputElement).value = newAction.action;
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
		(this.$css(`.results.icons button[data-url="${newIcon.url}"]`)[0]
			?? this.$css(`.results.icons button[data-url="${this.customIconUrl}"]`)[0])
			?.classList.add("selected");
		(this.$css(`input.iconUrl`)[0] as HTMLInputElement).value = newIcon.url;
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

	onSearchInput(e: InputEvent) {
		const thisSection = elementWithClassInTree(e.currentTarget as HTMLElement, "section");
		const isSubredditOnlySearch = thisSection.$css(".inputWrapper .subredditOnlySearch")[0].classList.contains("selected");
		if (isSubredditOnlySearch)
			return;
		const searchWords = (e.currentTarget as HTMLInputElement).value
			.split(" ")
			.filter(w => Boolean(w))
			.map(w => w.toLowerCase());
		const allButtons = thisSection.$cssAr(".results > .result");
		if (searchWords.length === 0) {
			allButtons.forEach(btn => btn.classList.remove("hide"));
			return;
		}
		for (const button of allButtons) {
			let isVisible = false;
			const btnNames = button.getAttribute("data-names").split(",").map(w => w.toLowerCase());
			searchLoop:
			for (const btnName of btnNames) {
				for (const searchWord of searchWords) {
					if (btnName.includes(searchWord)) {
						isVisible = true;
						break searchLoop;
					}
				}
			}
			button.classList.toggle("hide", !isVisible);
		}
	}

	onActionUrlInput(e: InputEvent) {
		const actionText = (e.currentTarget as HTMLInputElement).value;
		let matchingAction = this.actions.find(a => a.action === actionText);
		if (!matchingAction) {
			matchingAction = this.actions[1];
			matchingAction.action = actionText;
		}
		this.setActiveAction(matchingAction);
	}

	onIconUrlInput(e: InputEvent) {
		const iconUrlText = (e.currentTarget as HTMLInputElement).value;
		let matchingIcon = this.icons.find(i => i.url === iconUrlText);
		if (!matchingIcon) {
			matchingIcon = this.icons[1];
			matchingIcon.url = iconUrlText;
		}
		this.setActiveIcon(matchingIcon);
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
