import { makeElement } from "../../../utils/utils";
import Ph_FabElement from "./fabElement/fabElement";

export default class Ph_Fab extends HTMLElement {
	fabElements: Ph_FabElement[] = [];

	constructor() {
		super();

		this.classList.add("floatingActionButton");

		this.append(makeElement("div", { "class": "rootElement" },
			[makeElement("img", { "src": "/img/logoBW.svg" })]));

		this.append(...this.fabElements = [
			new Ph_FabElement("/img/envelope.svg", 0),
			new Ph_FabElement("/img/earth.svg", -45),
			new Ph_FabElement("/img/add.svg", -90),
		]);
	}
}

customElements.define("ph-fab", Ph_Fab);

window.addEventListener("load", () => document.body.append(new Ph_Fab()));
