import { globalSettings, PhotonSettings } from "./photonSettings.js";

window.addEventListener("settingsChanged", (e: CustomEvent) => handleSettings(e.detail));

function handleSettings(settings: PhotonSettings) {
	setClassOnBody("disableInlineImages", !settings.loadInlineImages);
	setClassOnBody("disableTooltips", !settings.tooltipsVisible);
	if (settings.imageLimitedHeight !== undefined) {
		document.documentElement.style.setProperty("--image-height-limited",
			settings.imageLimitedHeight > 0 ?`${settings.imageLimitedHeight}vh` : "unset");
	}
}

function setClassOnBody(className: string, state: boolean) {
	if (state !== undefined) {
		if (state)
			document.body.classList.add(className);
		else
			document.body.classList.remove(className);
	}
}

window.addEventListener("load", () => handleSettings(globalSettings));
