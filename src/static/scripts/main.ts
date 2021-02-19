/**
 * Entrypoint
 *
 * This file gets loaded from index.html and imports all other files
 */

import { AuthState, checkAuthOnPageLoad, checkTokenRefresh, initiateLogin } from "./auth/auth.js";
import Ph_Header from "./components/global/header/header.js";
import "./components/message/messageNotification/messageNotification.js";
import Ph_Toast, { Level } from "./components/misc/toast/toast.js";
import { pushLinkToHistorySep } from "./historyState/historyStateManager.js";
import { hasAnalyticsFileLoaded } from "./unsuspiciousFolder/unsuspiciousFile.js";
import { thisUser } from "./utils/globals.js";
import { $id } from "./utils/htmlStatics.js";
import { linksToSpa } from "./utils/htmlStuff.js";
import { extractHash, extractPath, extractQuery } from "./utils/utils.js";

async function init(): Promise<void> {
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());

	linksToSpa(document.body);

	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	checkIfAnalyticsFileLoaded()

	if (await checkAuthOnPageLoad() === AuthState.LoggedIn) {
		setInterval(checkTokenRefresh, 1000 * 30);
		await thisUser.fetch();
	}
	else {
		loginBtn.hidden = false;
	}
	loadPosts();

	window.dispatchEvent(new Event("ph-page-ready"));
	if (!localStorage["firstTimeFlag"])
		localStorage["firstTimeFlag"] = "set";
}

function loadPosts() {
	if (history.state?.url)
		pushLinkToHistorySep(extractPath(history.state.url) + extractHash(history.state.url), extractQuery(history.state.url));
	else
		pushLinkToHistorySep(location.pathname + location.hash, location.search || "");
}

function checkIfAnalyticsFileLoaded() {
	if (hasAnalyticsFileLoaded())
		return;

	console.error("couldn't load unsuspiciousFolder file");
	new Ph_Toast(Level.Error, "Couldn't load all script files");
	throw "couldn't load unsuspiciousFolder file";
}

window.addEventListener("load", init);
