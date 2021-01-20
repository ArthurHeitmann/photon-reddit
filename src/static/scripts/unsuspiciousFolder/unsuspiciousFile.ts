// unsuspicious to adblock blocking

import { globalSettings } from "../components/global/photonSettings/photonSettings.js";
import { ViewChangeData } from "../historyState/viewsStack.js";

window.addEventListener("viewChange", (e: CustomEvent) => {
	if (location.hostname === "localhost" || globalSettings.isIncognitoEnabled)
		return;
	
	const viewChangeData: ViewChangeData = e.detail;
	if (/analytics\/analytics\.html$/.test(viewChangeData.viewState.state.url))
		return;
	if (viewChangeData.newLoad) {
		// only truck path up to subreddit name
		const path = viewChangeData.viewState.state.url.replace(/(?<=^\/[^/]+\/[^/]+)\/.*/, "");
		fetch("/data/event", {
			method: "POST",
			headers: [
				["Content-Type", "application/json"]
			],
			body: JSON.stringify({
				"clientId": clientId,
				"path": path.toLowerCase(),
				"referer": referer.toLowerCase(),
				"timeMillisUtc": Date.now()
			})
		});
	}
	referer = location.origin + viewChangeData.viewState.state.url;
})

let clientId: string;
let referer = document.referrer || "";
interface ClientIdData {
	id: string,
	lastSetMillisUtc: number
}
const clientIdAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateClientIdData() {
	clientId = "";
	for (let i = 0; i < 128; ++i)
		clientId += clientIdAlphabet[Math.floor(Math.random() * clientIdAlphabet.length)];
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
function init() {
	if (!localStorage["clientIdData"]) {
		generateClientIdData();
		loadClientId()
	}
	else {
		let clientIdData: ClientIdData;
		try {
			clientIdData = JSON.parse(localStorage["clientIdData"]) as ClientIdData;
		}
		catch (e) {
			clientIdData = { lastSetMillisUtc: 0, id: "" };
		}
		if (!clientIdData.lastSetMillisUtc || typeof clientIdData.lastSetMillisUtc !== "number"
				|| clientIdData.lastSetMillisUtc > Date.now() ||									// if lastSet is corrupted
			Date.now() - clientIdData.lastSetMillisUtc > 1000 * 60 * 60 * 24 * 30 ||				// or invalidate after 30 days
			!clientIdData.id || clientIdData.id.length !== 128) {									// or is id corrupted
			generateClientIdData();
		}
		loadClientId(clientIdData.id);
	}
}
init();

export function hasAnalyticsFileLoaded() {
	return Boolean(clientId);
}
