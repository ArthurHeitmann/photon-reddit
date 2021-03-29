import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { photonWebVersion } from "./version.js";
import VersionNumber from "./versionNumber.js";

let pendingNewVersionNotification = false;
let waitingServiceWorker: ServiceWorker = null;
export function setWaitingServiceWorker(worker) {
	waitingServiceWorker = worker;
	if (pendingNewVersionNotification)
		showNewVersionToast();
}

async function compareLatestVersion() {
	const r = await fetch("/api/latestVersion");
	const { version: serverVersion } = await r.json();
	const latestVersion = new VersionNumber(serverVersion);
	const webVersion = new VersionNumber(photonWebVersion);
	if (!latestVersion.greaterThan(webVersion))
		return;
	if (waitingServiceWorker)
		showNewVersionToast();
	else
		pendingNewVersionNotification = true;
}
compareLatestVersion();
setInterval(compareLatestVersion, 1000 * 60 * 30);

function showNewVersionToast() {
	pendingNewVersionNotification = false;
	new Ph_Toast(Level.info, "New version available! Reload all tabs to update?", { onConfirm: updateVersion });
}

function updateVersion() {
	waitingServiceWorker.postMessage({ action: "updateAll" });
}

navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
	if (e.data["action"] === "reload")
		location.reload();
});
