import { makeElement } from "../../../../utils/utils";
import Ph_FabElement from "../fabElement/fabElement";

export default class Ph_FabElementEditPane extends HTMLElement {


	constructor(controllingElement: Ph_FabElement) {
		super();

		const presetsSectionButton = makeElement("button", { "class": "selected" }, "Presets");
		presetsSectionButton.addEventListener("click", () => this.selectSection(presetsSectionButton, presetsSection));
		const presetsSection = makeElement("div", { "class": "section selected" }, [
			makeElement("div", { "class": "searchWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "results" }, [
				makeElement("button", { "class": "result preset" }, [
					makeElement("img", { "src": "/img/earth.svg", alt: "icon" }),
					makeElement("div", null, "r/all"),
				]),
				makeElement("button", { "class": "result preset" }, [
					makeElement("img", { "src": "/img/envelope.svg", alt: "icon" }),
					makeElement("div", null, "Inbox"),
				]),
			])
		]);
		const actionSectionButton = makeElement("button", null, "Action");
		actionSectionButton.addEventListener("click", () => this.selectSection(actionSectionButton, actionSection));
		const actionSection = makeElement("div", { "class": "section" }, [
			makeElement("div", { "class": "searchWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "results" }, [
				makeElement("button", { "class": "result action" }, [
					makeElement("div", null, "r/all"),
				]),
				makeElement("button", { "class": "result action" }, [
					makeElement("div", null, "Inbox"),
				]),
			])
		]);
		const iconSectionButton = makeElement("button", null, "Icon");
		iconSectionButton.addEventListener("click", () => this.selectSection(iconSectionButton, iconSection));
		const iconSection = makeElement("div", { "class": "section" }, [
			makeElement("div", { "class": "searchWrapper" }, [
				makeElement("button", { "class": "transparentButton" }, "r/"),
				makeElement("input", { type: "text" })
			]),
			makeElement("div", { "class": "results" }, [
				makeElement("button", { "class": "result icon" }, [
					makeElement("img", { "src": "/img/earth.svg", alt: "icon" }),
				]),
				makeElement("button", { "class": "result icon" }, [
					makeElement("img", { "src": "/img/envelope.svg", alt: "icon" }),
				]),
			])
		]);

		this.append(
			makeElement("div", { "class": "header" }, [
				presetsSectionButton,
				actionSectionButton,
				iconSectionButton,
			]),
			presetsSection, actionSection, iconSection
		);

		this.classList.add("fabElementEditPane");
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
