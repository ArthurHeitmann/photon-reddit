import { ensurePageLoaded } from "../../../utils/globals";
import { globalSettings, PhotonSettings } from "./photonSettings";

window.addEventListener("ph-settings-changed", (e: CustomEvent) => handleSettings(e.detail));

function handleSettings(settings: PhotonSettings) {
	if (settings.imageLimitedHeight !== undefined) {
		document.documentElement.style.setProperty("--image-height-limited",
			settings.imageLimitedHeight > 0 ?`${settings.imageLimitedHeight}vh` : "unset");
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

ensurePageLoaded().then(() => handleSettings(globalSettings));
