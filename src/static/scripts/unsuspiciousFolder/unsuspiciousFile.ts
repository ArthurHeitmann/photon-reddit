/**
 * Some basic tracking
 *
 * This file has been named this way, because good ad blockers will block
 * anything with "analytics" or "tracking" in the filename
 *
 * What will be tracked:
 *  - randomized user id (resets every 30 days)
 *  - visited page (at most subreddit/user but not which post)
 *  - previous page/referer
 *  - time
 *
 *  will not track when:
 *   - when running on localhost
 *   - on analytics dashboards
 *
 *  Incognito mode (from the settings):
 *   - url will only send "/i"
 *   - referer will be empty
 *
 *   ----------
 *
 * Independently of that every week the support for indexedDB and Service Workers is reported.
 * (So that I know how many users don't support it. In case I want to do something with it in the future)
 */

import { trackBrowserFeatures } from "../api/photonApi";
import Users from "../components/multiUser/userManagement";
import { ViewChangeData } from "../historyState/viewsStack";
import { PhEvents } from "../types/Events";
import { supportsIndexedDB, supportsServiceWorkers } from "../utils/browserFeatures";
import { extractPath, randomString } from "../utils/utils";

window.addEventListener(PhEvents.viewChange, (e: CustomEvent) => {
	if (location.hostname === "localhost")
		return;
	
	const viewChangeData: ViewChangeData = e.detail;
	if (/analytics\/analytics\.html$/.test(viewChangeData.viewState.state.url))
		return;
	// only track path up to subreddit name
	const path = extractPath(viewChangeData.viewState.state.url)
		.replace(/(^\/[^/]+\/[^/]+)\/.*/, "$1")			// keep up to 2 directories (/r/pics/comments/.... --> /r/pics)
		.replace(/\/$/,"")								// remove trailing /
		.replace(/^$/, "/");							// add / when empty
	if (viewChangeData.newLoad) {
		fetch("/data/event", {
			method: "POST",
			headers: [
				["Content-Type", "application/json"]
			],
			body: JSON.stringify({
				"clientId": clientId,
				"path": Users.global.d.photonSettings.isIncognitoEnabled ? "/i" : path.toLowerCase(),
				"referer": Users.global.d.photonSettings.isIncognitoEnabled ? "" : referer.toLowerCase(),
				"timeMillisUtc": Date.now()
			})
		});
	}
	referer = location.origin + path;
})

interface ClientIdData {
	id: string,
	lastSetMillisUtc: number
}
/** 128 character long random string */
let clientId: string;
let referer = document.referrer || "";

async function init() {
	// client data has never before been set
	if (!Users.global.d.analytics.clientId) {
		await generateClientIdData();
		loadClientId()
	}
	// client data has been set in storage, but could be corrupted
	else {
		let clientIdData = Users.global.d.analytics;
		// check if read data is valid & not expired
		if (!clientIdData.idInitTime ||
				clientIdData.idInitTime > Date.now() ||													// if lastSet is corrupted
				Date.now() - clientIdData.idInitTime > 1000 * 60 * 60 * 24 * 30 ||				// or invalidate after 30 days
				!clientIdData.clientId || clientIdData.clientId.length !== 128										// or is id corrupted
		) {
			await generateClientIdData();
		}
		loadClientId(clientIdData.clientId);
	}
}

async function generateClientIdData() {
	await Users.global.set(["analytics", "clientId"], randomString(128));
}

function loadClientId(id?: string) {
	if (id)
		clientId = id;
	else {
		clientId = Users.global.d.analytics.clientId;
	}
}

// track browser features

const reportIntervalMs = 1000 * 60 * 60 * 24 * 7;	// new report every week
Users.ensureDataHasLoaded().then(() => {
	init();
	if ((Date.now() - Users.global.d.analytics.lastReportAt > reportIntervalMs) && location.hostname !== "localhost")
		sendBrowserFeatures();
});

async function sendBrowserFeatures() {
	const idbSupported = await supportsIndexedDB();
	const swSupported = supportsServiceWorkers();
	await Promise.all([
		trackBrowserFeatures({ featureName: "indexedDB", isAvailable: idbSupported }),
		trackBrowserFeatures({ featureName: "serviceWorkers", isAvailable: swSupported }),
	]);
	await Users.global.set(["analytics", "lastReportAt"], Date.now());
}
