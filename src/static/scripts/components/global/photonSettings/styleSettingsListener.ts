import {PhEvents} from "../../../types/Events";
import {ensurePageLoaded} from "../../../utils/utils";
import Users from "../../multiUser/userManagement";
import {PhotonSettings} from "./photonSettings";
import {SettingsKey} from "./photonSettingsData";

const settingToCssClassMap: { [setting in SettingsKey]?: string } = {
	hidePostTitle: "hidePostTitle",
	hidePostTopInfo: "hidePostTopInfo",
	hidePostFlairs: "hidePostFlairs",
	hidePostLeftBar: "hidePostLeftBar",
	hideCrosspostInfo: "hideCrosspostInfo",
	hideSubredditMiniIcon: "hideSubredditMiniIcon",
}

window.addEventListener(PhEvents.settingsChanged, (e: CustomEvent) => handleSettings(e.detail));

function handleSettings(settings: PhotonSettings) {
	if (settings.imageLimitedHeight !== undefined) {
		document.documentElement.style.setProperty("--image-height-limited",
			settings.imageLimitedHeight > 0 ?`${settings.imageLimitedHeight}vh` : "unset");
	}
	for (const settingsKey in settings) {
		if (settingsKey in settingToCssClassMap)
			setClassOnBody(settingToCssClassMap[settingsKey], settings[settingsKey]);
	}
}

function setClassOnBody(className: string, state: boolean, invert: boolean = false) {
	if (state !== undefined) {
		if (state !== invert)
			document.body.classList.add(className);
		else
			document.body.classList.remove(className);
	}
}

window.addEventListener("load", () => {
	Users.ensureDataHasLoaded().then(() => handleSettings(Users.global.d.photonSettings));
	ensurePageLoaded().then(() => handleSettings(Users.global.d.photonSettings));
});
