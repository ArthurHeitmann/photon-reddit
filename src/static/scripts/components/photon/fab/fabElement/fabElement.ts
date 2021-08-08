import { makeElement } from "../../../../utils/utils";

export default class Ph_FabElement extends HTMLElement {
	constructor(imgSrc: string, angle: number) {
		super();

		this.classList.add("fabElement");
		this.style.setProperty("--img", `url("${imgSrc}")`);
		this.style.setProperty("--angle", `${angle}`);
		this.style.setProperty("--distance", "1.0");

		this.append(makeElement("div", { "class": "icon clickable" }));
	}
}

customElements.define("ph-fab-element", Ph_FabElement);
