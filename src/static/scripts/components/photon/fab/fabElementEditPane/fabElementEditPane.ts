import { RedditApiType } from "../../../../types/misc";
import { nonDraggableElement } from "../../../../utils/htmlStatics";
import { elementWithClassInTree } from "../../../../utils/htmlStuff";
import { deepClone, getSubredditIconUrl, isJsonEqual, makeElement } from "../../../../utils/utils";
import Ph_SubredditSelector from "../../../misc/subredditSelector/subredditSelector";
import Ph_Fab from "../fab";
import Ph_FabElement from "../fabElement/fabElement";
import {
	defaultFabActions,
	defaultFabIcons,
	defaultFabPresets,
	FabAction,
	FabIcon,
	FabPreset
} from "../fabElementConfig";

export default class Ph_FabElementEditPane extends HTMLElement {
	actions: FabAction[] = deepClone(defaultFabActions);
	icons: FabIcon[] = deepClone(defaultFabIcons);
	presets: FabPreset[] = deepClone(defaultFabPresets);
	customPreset: FabPreset = this.presets[1];
	customIconUrl = this.icons[1].url;
	currentPreset: FabPreset = this.presets[0];
	controllingElement: Ph_FabElement;
	presetSubSelector: Ph_SubredditSelector;
	actionSubSelector: Ph_SubredditSelector;
	iconSubSelector: Ph_SubredditSelector;

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
				makeElement("button", { class: "subredditOnlySearch transparentButton presets", onclick: this.toggleIsSubredditSearch.bind(this) }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter presets or find subreddits",
					class: "searchInput", oninput: this.onSearchInput.bind(this) }),
				this.presetSubSelector = new Ph_SubredditSelector(true, false)
			]),
			makeElement("div", { class: "results presets" },
				this.presets.map(preset => {
					return makeElement("button", {
						class: "result preset",
						"data-tooltip": preset.presetName,
						"data-name": preset.presetName,
						"data-names": preset.names.join(","),
						onclick: () => this.setActivePreset(preset)
					}, [
						nonDraggableElement(makeElement("img", { src: preset.icon.url, alt: preset.names[0] })),
						makeElement("div", { class: preset.presetName.length > 5 ? "small" : "" }, preset.presetName),
					]);
				})
			)
		]);
		this.presetSubSelector.bind(presetsSection.$css(".searchInput")[0] as HTMLInputElement, true, this.onSubredditSelectedPresets.bind(this));
		const actionSectionButton = makeElement(
			"button",
			{ onclick: () => this.selectSection(actionSectionButton, actionSection) },
			"Action"
		);
		const actionSection = makeElement("div", { class: "section" }, [
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("button", { class: "subredditOnlySearch transparentButton actions", onclick: this.toggleIsSubredditSearch.bind(this) }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter actions or find subreddit urls",
					class: "searchInput", oninput: this.onSearchInput.bind(this) }),
				this.actionSubSelector = new Ph_SubredditSelector(true, false)
			]),
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL", class: "customUrl", oninput: this.onActionUrlInput.bind(this) })
			]),
			makeElement("div", { class: "results actions" },
				this.actions.map(action => {
					return makeElement("button", {
						class: "result action",
						"data-names": action.names.join(","),
						"data-action": action.action,
						onclick: () => this.setActiveAction(action)
					}, [
						makeElement("div", { class: action.names[0].length > 5 ? "small" : "" }, action.names[0]),
					]);
				})
			)
		]);
		this.actionSubSelector.bind(actionSection.$css(".searchInput")[0] as HTMLInputElement, true, this.onSubredditSelectedActions.bind(this));
		const iconSectionButton = makeElement(
			"button",
			{ onclick: () => this.selectSection(iconSectionButton, iconSection) },
			"Icon"
		);
		const iconSection = makeElement("div", { class: "section" }, [
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("button", { class: "subredditOnlySearch transparentButton icons", onclick: this.toggleIsSubredditSearch.bind(this) }, "r/"),
				makeElement("input", { type: "text", placeholder: "Filter icons or find subreddit icons",
					class: "searchInput", oninput: this.onSearchInput.bind(this) }),
				this.iconSubSelector = new Ph_SubredditSelector(true, false)
			]),
			makeElement("div", { class: "inputWrapper" }, [
				makeElement("input", { type: "text", placeholder: "Custom URL", class: "iconUrl", oninput: this.onIconUrlInput.bind(this) })
			]),
			makeElement("div", { class: "results icons" },
				this.icons.map(icon =>
					makeElement("button", {
						class: "result icon",
						"data-names": icon.names.join(","),
						"data-url": icon.url,
						onclick: () => this.setActiveIcon(icon)
					}, [
						nonDraggableElement(makeElement("img", { "src": icon.url, alt: icon.names[0] }))
					])
				)
			)
		]);
		this.iconSubSelector.bind(iconSection.$css(".searchInput")[0] as HTMLInputElement, true, this.onSubredditSelectedIcons.bind(this));

		this.append(
			makeElement("div", { class: "header" }, [
				presetsSectionButton,
				actionSectionButton,
				iconSectionButton,
			]),
			presetsSection, actionSection, iconSection
		);
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
		Ph_Fab.getRoot(this)?.saveAllElementsToLS();
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
		return this.presets.find(preset => isJsonEqual(preset.action, action) && isJsonEqual(preset.icon, icon));
	}

	onSearchInput(e: InputEvent) {
		const input = e.currentTarget as HTMLInputElement;
		const thisSection = elementWithClassInTree(input as HTMLElement, "section");
		const isSubSearchBtn = thisSection.$css(".inputWrapper .subredditOnlySearch")[0] as HTMLButtonElement;
		if (input.value.startsWith("r/") && !isSubSearchBtn.classList.contains("selected")) {
			isSubSearchBtn.click();
			input.value = input.value.substr(2);
		}
		const isSubredditOnlySearch = isSubSearchBtn.classList.contains("selected");
		const allButtons = thisSection.$cssAr(".results > .result");
		const searchWords = input.value
			.split(" ")
			.filter(w => Boolean(w))
			.map(w => w.toLowerCase());
		if (isSubredditOnlySearch || searchWords.length === 0) {
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
		this.setActionUrl(actionText);
	}

	setActionUrl(url: string) {
		let matchingAction = this.actions.find(a => a.action === url);
		if (!matchingAction) {
			matchingAction = this.actions[1];
			matchingAction.action = url;
		}
		this.setActiveAction(matchingAction);
	}

	onIconUrlInput(e: InputEvent) {
		const iconUrlText = (e.currentTarget as HTMLInputElement).value;
		this.setIconUrl(iconUrlText);
	}

	setIconUrl(url: string) {
		if (!url || !/^(\/|https:\/\/)/.test(url))
			return;
		let matchingIcon = this.icons.find(i => i.url === url);
		if (!matchingIcon) {
			matchingIcon = this.icons[1];
			matchingIcon.url = url;
		}
		this.setActiveIcon(matchingIcon);
	}

	onSubredditSelectedPresets(subName: string, subData: RedditApiType) {
		this.setActionUrl(`/r/${subName}`);
		this.setIconUrl(getSubredditIconUrl(subData.data));
	}

	onSubredditSelectedActions(subName: string, subData: RedditApiType) {
		this.setActionUrl(`/r/${subName}`);
	}

	onSubredditSelectedIcons(subName: string, subData: RedditApiType) {
		this.setIconUrl(getSubredditIconUrl(subData.data));
	}

	toggleIsSubredditSearch(e: MouseEvent) {
		const btn = e.currentTarget as HTMLButtonElement;
		btn.classList.toggle("selected");
		if (btn.classList.contains("presets"))
			this.presetSubSelector.setIsEnabled(btn.classList.contains("selected"));
		else if (btn.classList.contains("actions"))
			this.actionSubSelector.setIsEnabled(btn.classList.contains("selected"));
		else if (btn.classList.contains("icons"))
			this.iconSubSelector.setIsEnabled(btn.classList.contains("selected"));
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
