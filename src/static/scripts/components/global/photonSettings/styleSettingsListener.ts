import { globalSettings, PhotonSettings } from "./photonSettings.js";

window.addEventListener("settingsChanged", (e: CustomEvent) => handleSettings(e.detail));

function handleSettings(settings: PhotonSettings) {
	if (settings.loadInlineImages !== undefined) {
		if (settings.loadInlineImages)
			document.body.classList.remove("disableInlineImages");
		else
			document.body.classList.add("disableInlineImages");
	}
}

window.addEventListener("load", () => handleSettings(globalSettings));
