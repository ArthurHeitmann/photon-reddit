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
 */

import { globalSettings } from "../components/global/photonSettings/photonSettings.js";
import { ViewChangeData } from "../historyState/viewsStack.js";
import { extractPath, randomString } from "../utils/utils.js";

window.addEventListener("ph-view-change", (e: CustomEvent) => {
	if (location.hostname === "localhost")
		return;
	
	const viewChangeData: ViewChangeData = e.detail;
	if (/analytics\/analytics\.html$/.test(viewChangeData.viewState.state.url))
		return;
	// only track path up to subreddit name
	const path = extractPath(viewChangeData.viewState.state.url)
		.replace(/(?<=^\/[^/]+\/[^/]+)\/.*/, "")		// keep up to 2 directories (/r/pics/comments/.... --> /r/pics)
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
				"path": globalSettings.isIncognitoEnabled ? "/i" : path.toLowerCase(),
				"referer": globalSettings.isIncognitoEnabled ? "" : referer.toLowerCase(),
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
export let clientId: string;
let referer = document.referrer || "";

function init() {
	// client data has never before been set
	if (!localStorage["clientIdData"]) {
		generateClientIdData();
		loadClientId()
	}
	// client data has been set in localstorage, but doesn't have to be valid
	else {
		let clientIdData: ClientIdData;
		try {
			clientIdData = JSON.parse(localStorage["clientIdData"]) as ClientIdData;
		}
		catch (e) {
			// invalid localstorage string, go with empty default
			clientIdData = { lastSetMillisUtc: 0, id: "" };
		}
		// check if read data is valid & not expired
		if (!clientIdData.lastSetMillisUtc || typeof clientIdData.lastSetMillisUtc !== "number"
				|| clientIdData.lastSetMillisUtc > Date.now() ||										// if lastSet is corrupted
				Date.now() - clientIdData.lastSetMillisUtc > 1000 * 60 * 60 * 24 * 30 ||				// or invalidate after 30 days
				!clientIdData.id || clientIdData.id.length !== 128										// or is id corrupted
		) {
			generateClientIdData();
		}
		loadClientId(clientIdData.id);
	}
}

function generateClientIdData() {
	clientId = randomString(128);
	localStorage["clientIdData"] = JSON.stringify(<ClientIdData> {
		id: clientId,
		lastSetMillisUtc: Date.now()
	})
}

function loadClientId(id?: string) {
	if (id)
		clientId = id;
	else {
		const clientData = JSON.parse(localStorage["clientIdData"]) as ClientIdData;
		clientId = clientData.id;
	}
}
init();

export function hasAnalyticsFileLoaded() {
	return Boolean(clientId);
}
