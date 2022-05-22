import Ph_ModalPane from "../../misc/modalPane/modalPane";
import {makeElement, sleep} from "../../../utils/utils";

export default class Ph_MobileInfoPopup extends Ph_ModalPane {
	constructor() {
		super();

		this.classList.add("mobileInfoPopup");

		this.content.append(
			makeElement("h2", {}, "It looks like you're using a mobile device"),
			makeElement("p", {}, "Photon is meant to be used on desktop devices and tablets."),
			makeElement("p", {}, "On small screens things will look a little weird :)"),
			makeElement("button", { class: "confirmBtn", onclick: this.hide.bind(this) }, "Got it")
		);
	}

	hide() {
		super.hide();
		sleep(1000).then(() => this.remove());
	}
}

customElements.define("ph-mobile-info-popup", Ph_MobileInfoPopup);
