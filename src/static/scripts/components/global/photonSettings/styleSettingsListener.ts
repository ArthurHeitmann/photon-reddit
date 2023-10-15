import {PhEvents} from "../../../types/Events";
import {ensurePageLoaded} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import {PhotonSettingsKey, SettingsKey} from "./photonSettingsData";
import {PhotonSettings, UiTheme} from "./settingsConfig";

const settingToCssClassMap: { [setting in SettingsKey]?: string } = {
	hidePostTitle: "hidePostTitle",
	hidePostTopInfo: "hidePostTopInfo",
	hidePostFlairs: "hidePostFlairs",
	hidePostLeftBar: "hidePostLeftBar",
	hideCrosspostInfo: "hideCrosspostInfo",
	hideSubredditMiniIcon: "hideSubredditMiniIcon",
}

interface SettingToCssVar<T extends PhotonSettingsKey> {
	cssVarName: string,
	unit: string,
	fallback?: string,
	fallbackCondition?: (val: PhotonSettings[T]) => boolean
}
const settingsToCssVarMap: { [setting in PhotonSettingsKey]?: SettingToCssVar<setting> } = {
	"imageLimitedHeight": {
		cssVarName: "--image-height-limited",
		unit: "vh",
		fallback: "unset",
		fallbackCondition: (val) => val <= 0
	},
	"feedWidth": {
		cssVarName: "--v-widthM",
		unit: "rem",
	},
	"postAndCommentsWidth": {
		cssVarName: "--v-widthL",
		unit: "rem",
	}
};

window.addEventListener(PhEvents.settingsChanged, (e: CustomEvent) => handleSettings(e.detail));

function handleSettings(settings: PhotonSettings) {
	if (settings.imageLimitedHeight !== undefined) {
		document.documentElement.style.setProperty("--image-height-limited",
			settings.imageLimitedHeight > 0 ?`${settings.imageLimitedHeight}vh` : "unset");
	}
	if (settings.feedDisplayType === "grid") {
		document.body.classList.add("feedGridView");
	}
	if ("theme" in settings)
		setTheme(settings.theme);

	for (const settingsKey in settings) {
		if (settingsKey in settingToCssClassMap)
			setClassOnBody(settingToCssClassMap[settingsKey], settings[settingsKey]);
		if (settingsKey in settingsToCssVarMap)
			setCssVarOnBody(settingsToCssVarMap[settingsKey], settings[settingsKey]);
	}
}

function setClassOnBody(className: string, state: boolean, invert: boolean = false) {
	if (state === undefined)
		return;
	if (state !== invert)
		document.body.classList.add(className);
	else
		document.body.classList.remove(className);
}

function setCssVarOnBody<T extends PhotonSettingsKey>(mapping: SettingToCssVar<T>, setting: PhotonSettings[T]) {
	if (setting === undefined)
		return;
	let varVal= `${setting}${mapping.unit}`;
	if (mapping.fallbackCondition && mapping.fallbackCondition(setting))
		varVal = mapping.fallback;
	document.body.style.setProperty(mapping.cssVarName, varVal);
}

function setTheme(theme: UiTheme) {
	const themeClasses = [`theme-${theme}`];
	if (theme !== UiTheme.dark)
		themeClasses.push("theme-override");
	
	for (const className of [...document.documentElement.classList]) {
		if (!className.startsWith("theme-"))
			continue;
		if (!themeClasses.includes(className))
			document.documentElement.classList.remove(className);
	}
	document.documentElement.classList.add(...themeClasses);

}

window.addEventListener("load", () => {
	Users.ensureDataHasLoaded().then(() => handleSettings(Users.global.d.photonSettings));
	ensurePageLoaded().then(() => handleSettings(Users.global.d.photonSettings));
});
