import Ph_ModalPane from "../../misc/modalPane/modalPane";
import {makeElement, sleep} from "../../../utils/utils";
import { $class } from "../../../utils/htmlStatics";
import Ph_PhotonSettings from "../../global/photonSettings/photonSettings";

export default class Ph_ForcedLogoutInfo extends Ph_ModalPane {
	constructor() {
		super(false);

		this.classList.add("forcedLogoutInfo");

		this.content.append(
			makeElement("h2", {}, "Important information"),
			makeElement("ul", {}, [
				makeElement("li", {}, "Due to server side technical problems, everyone has been logged out"),
				makeElement("li", {}, "You will need to manually log in again"),
				makeElement("li", {}, [
					makeElement("strong", {}, "To avoid such problems in the future, it's recommended to register your own reddit app"),
				]),
				makeElement("li", {}, "I apologize for the inconvenience"),
			]),
			makeElement("div", {class: "row"}, [
				makeElement("button", {class: "button", onclick: this.jumpToSettings}, "Add your own app"),
				makeElement("button", {class: "button", onclick: this.hide.bind(this)}, "Confirm"),
			]),
		);
	}

	static show() {
		const popup = new Ph_ForcedLogoutInfo();
		const settingsPane = $class("photonSettings")[0];
		if (settingsPane)
			settingsPane.before(popup);
		else
			document.body.append(popup);
		popup.show();
	}

	hide() {
		super.hide();
		sleep(1000).then(() => this.remove());
	}

	private jumpToSettings() {
		const settingsPane = $class("photonSettings")[0] as Ph_PhotonSettings;
		settingsPane.switchToSection("Reddit Auth");
	}
}

customElements.define("ph-forced-logout-info", Ph_ForcedLogoutInfo);
