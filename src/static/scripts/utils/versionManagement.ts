import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {photonWebVersion} from "./version";
import VersionNumber from "./versionNumber";

let pendingNewVersionNotification = false;
export let waitingServiceWorker: ServiceWorker = null;
export function setWaitingServiceWorker(worker) {
	waitingServiceWorker = worker;
	if (pendingNewVersionNotification)
		showNewVersionToast();
}

async function compareLatestVersion() {
	let r: Response;
	try {
		r = await fetch("/api/latestVersion");
	}
	catch (e) {
		new Ph_Toast(Level.warning, "Couldn't reach Photon server", { timeout: 3500, groupId: "photon server unreachable" });
		return;
	}
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
	setTimeout(() => new Ph_Toast(Level.info, "This is taking longer than expected... Maybe try manually reloading"), 7500);
}

navigator.serviceWorker?.addEventListener("message", (e: MessageEvent) => {
	if (e.data["action"] === "reload")
		location.reload();
});
