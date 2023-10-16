import { waitingServiceWorker } from "../../../utils/versionManagement";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import { UiTheme } from "./settingsConfig";

export function setTheme(theme: UiTheme, isPageLoad: boolean) {
	const themeClasses = [`theme-${theme}`];
	if (theme !== UiTheme.dark) {
		themeClasses.push("theme-override");
		document.cookie = `themeOverride=${theme};path=/;max-age=31536000`;
	}
	else {
		document.cookie = `themeOverride=;path=/;max-age=0`;
	}

	if (!isPageLoad) {
		purgeSvgCaches();
		new Ph_Toast(Level.info, "Reload page to apply theme", {
			onConfirm: () => location.reload(),
			groupId: "theme change request"
		});
		return;
	}
	
	for (const className of [...document.documentElement.classList]) {
		if (!className.startsWith("theme-"))
			continue;
		if (!themeClasses.includes(className))
			document.documentElement.classList.remove(className);
	}
	document.documentElement.classList.add(...themeClasses);
}

export async function purgeSvgCaches() {
	if (!navigator.serviceWorker)
		return;
	if (!waitingServiceWorker)
		return;
	waitingServiceWorker.postMessage({ action: "purgeSvgsCache" });
	const purgeCompleted = await hasPurgeCompleted();
	if (!purgeCompleted)
		console.error("Purge of SVGs cache timed out");
}

function hasPurgeCompleted(): Promise<boolean> {
	return new Promise(resolve => {
		const timeout = setTimeout(() => {
			navigator.serviceWorker.removeEventListener("message", listener);
			resolve(false);
		}, 1500);
		const listener = (e: MessageEvent) => {
			if (e.data["action"] === "purgeSvgsCacheDone") {
				clearTimeout(timeout);
				resolve(true);
			}
		}
		navigator.serviceWorker.addEventListener("message", listener);
	});
}
