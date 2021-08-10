import { makeElement } from "../../../../utils/utils";
import Ph_FabElement from "../fabElement/fabElement";

export default class Ph_FabElementEditPane extends HTMLElement {
	constructor(controllingElement: Ph_FabElement) {
		super();

		this.append(
			makeElement("div", { "class": "header" }, [
				makeElement("button", { "class": "selected" }, "Presets"),
				makeElement("button", null, "Action"),
				makeElement("button", null, "Icon"),
			]),
			makeElement("div", { "class": "section active" }, [
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
					makeElement("button", { "class": "result preset selected" }, [
						makeElement("img", { "src": "/img/earth.svg", alt: "icon" }),
						makeElement("div", null, "r/all"),
					]),
					makeElement("button", { "class": "result preset" }, [
						makeElement("img", { "src": "/img/envelope.svg", alt: "icon" }),
						makeElement("div", null, "Inbox"),
					]),
					makeElement("button", { "class": "result preset" }, [
						makeElement("img", { "src": "/img/earth.svg", alt: "icon" }),
						makeElement("div", null, "r/all"),
					]),
					makeElement("button", { "class": "result preset" }, [
						makeElement("img", { "src": "/img/envelope.svg", alt: "icon" }),
						makeElement("div", null, "Inbox"),
					]),
					makeElement("button", { "class": "result preset" }, [
						makeElement("img", { "src": "/img/earth.svg", alt: "icon" }),
						makeElement("div", null, "r/all"),
					]),
					makeElement("button", { "class": "result preset" }, [
						makeElement("img", { "src": "/img/envelope.svg", alt: "icon" }),
						makeElement("div", null, "Inbox"),
					]),
				])
			])
		);

		this.classList.add("fabElementEditPane");
	}

	show() {
		this.classList.add("show");
	}

	hide() {
		this.classList.remove("show");
	}
}

customElements.define("ph-fab-element-edit-pane", Ph_FabElementEditPane);
