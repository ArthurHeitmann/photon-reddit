/**
 * Entrypoint
 *
 * This file gets loaded from index.html and imports all other files
 */

import "./components/message/messageNotification/messageNotification.js";
import "./utils/vesionManagement.js";
import { subscribe } from "./api/redditApi.js";
import { AuthState, checkAuthOnPageLoad, checkTokenRefresh, initiateLogin } from "./auth/auth.js";
import Ph_Header from "./components/global/header/header.js";
import Ph_Toast, { Level } from "./components/misc/toast/toast.js";
import { pushLinkToHistorySep } from "./historyState/historyStateManager.js";
import ViewsStack from "./historyState/viewsStack.js";
import { hasAnalyticsFileLoaded } from "./unsuspiciousFolder/unsuspiciousFile.js";
import { loginSubredditFullName, loginSubredditName } from "./utils/consts.js";
import { setWaitingServiceWorker } from "./utils/vesionManagement.js";
import { thisUser } from "./utils/globals.js";
import { $id } from "./utils/htmlStatics.js";
import { linksToSpa } from "./utils/htmlStuff.js";
import { extractHash, extractPath, extractQuery } from "./utils/utils.js";

async function init(): Promise<void> {
	registerServiceWorker();

	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());

	linksToSpa(document.body);

	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	checkIfAnalyticsFileLoaded()

	if (await checkAuthOnPageLoad() === AuthState.LoggedIn) {
		try {
			await thisUser.fetch();
		}
		catch {
			showInitErrorPage();
		}
		if (localStorage["loginRecommendationFlag"] !== "set" && !thisUser.subreddits.includes(`r/${loginSubredditName}`)) {
			localStorage["loginRecommendationFlag"] = "set";
			new Ph_Toast(Level.Info, `Do you want to subscribe to r/${loginSubredditName}?`, {
				onConfirm: () => subscribe(loginSubredditFullName, true)
			});
		}
	}
	else
		loginBtn.hidden = false;
		setInterval(checkTokenRefresh, 1000 * 30);
	loadPosts();

	window.dispatchEvent(new Event("ph-page-ready"));
	if (localStorage["firstTimeFlag"] !== "set")
		localStorage["firstTimeFlag"] = "set";
}

function showInitErrorPage() {
	const errorPage = document.createElement("div");
	errorPage.innerHTML = `
		<h1>Bad error happened!</h1>
		<p>Maybe check <a href="https://www.redditstatus.com/" target="_blank">redditstatus.com</a></p>
	`;
	ViewsStack.attachmentPoint.appendChild(errorPage);
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

async function registerServiceWorker() {
	// adapted from https://stackoverflow.com/a/37582216/9819447

	// register service worker
	const registration = await navigator.serviceWorker.register("/serviceWorker.js");

	// listen for new installations

	if (registration.waiting && registration.active)
		setWaitingServiceWorker(registration.waiting);

	registration.addEventListener('updatefound', () => {
		registration.installing.addEventListener('statechange', (event) => {
			if ((event.target as ServiceWorker).state === 'installed' && registration.active)
				setWaitingServiceWorker(event.target);
		});
	});
}

window.addEventListener("load", init);
