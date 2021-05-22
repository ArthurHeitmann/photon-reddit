/**
 * Entrypoint
 *
 * This file gets loaded from index.html and imports all other files
 */

import { subscribe } from "./api/redditApi.js";
import { AuthState, checkAuthOnPageLoad, checkTokenRefresh } from "./auth/auth.js";
import { checkOrCompleteLoginRedirect, initiateLogin } from "./auth/loginHandler.js";
import Ph_Header from "./components/global/header/header.js";
import Ph_Toast, { Level } from "./components/misc/toast/toast.js";
import Ph_Changelog from "./components/photon/changelog/changelog.js";
import Ph_Tutorial from "./components/photon/tutorial/tutorial.js";
import { pushLinkToHistorySep } from "./historyState/historyStateManager.js";
import ViewsStack from "./historyState/viewsStack.js";
import { hasAnalyticsFileLoaded } from "./unsuspiciousFolder/unsuspiciousFile.js";
import { loginSubredditFullName, loginSubredditName } from "./utils/consts.js";
import { thisUser } from "./utils/globals.js";
import { $id } from "./utils/htmlStatics.js";
import { linksToSpa } from "./utils/htmlStuff.js";
import "./utils/sideEffectImports.js";
import { extractHash, extractPath, extractQuery } from "./utils/utils.js";
import { photonWebVersion } from "./utils/version.js";
import VersionNumber from "./utils/versionNumber.js";
import { setWaitingServiceWorker } from "./utils/vesionManagement.js";

async function init(): Promise<void> {
	console.log("Photon Init");

	if (await checkFirefoxPrivateMode())
		return;
	registerServiceWorker();
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());
	linksToSpa(document.body);
	checkIfAnalyticsFileLoaded()
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", () => initiateLogin());

	await checkOrCompleteLoginRedirect();
	let thisUserFetch: Promise<void>;
	if (await checkAuthOnPageLoad() === AuthState.loggedIn) {
		thisUserFetch = thisUser.fetch()
			.then(() => {
				if (localStorage["loginRecommendationFlag"] !== "set" && !thisUser.subreddits.includes(`r/${loginSubredditName}`)) {
					localStorage["loginRecommendationFlag"] = "set";
					new Ph_Toast(Level.info, `Do you want to subscribe to r/${loginSubredditName}?`, {
						onConfirm: () => subscribe(loginSubredditFullName, true)
					});
				}
			})
			.catch(() => {
				showInitErrorPage();
			});
	}
	else
		loginBtn.hidden = false;
	setInterval(checkTokenRefresh, 1000 * 30);
	loadPosts();

	checkForNewVersion();
	disableSpaceBarScroll();

	if (thisUserFetch)
		await thisUserFetch;

	window.dispatchEvent(new Event("ph-page-ready"));
	if (localStorage["firstTimeFlag"] !== "set")
		localStorage["firstTimeFlag"] = "set";

	Ph_Tutorial.checkForTutorial();

	console.log("Photon is ready");
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
	new Ph_Toast(Level.error, "Couldn't load all script files");
	throw "couldn't load unsuspiciousFolder file";
}

function checkForNewVersion() {
	if (!localStorage.version) {
		localStorage.version = photonWebVersion;
		return;
	}

	let lastVersion: VersionNumber;
	try {
		lastVersion = new VersionNumber(localStorage.version);
	}
	catch (e) {
		localStorage.version = photonWebVersion;
		return;
	}

	const currentVersion = new VersionNumber(photonWebVersion);
	if (currentVersion.equals(lastVersion))
		return;
	else if (currentVersion.greaterThan(lastVersion)) {
		new Ph_Toast(
			Level.info,
			"New version installed! View changelog?",
			{ onConfirm: () => Ph_Changelog.show() }
		);
	}
	localStorage.version = photonWebVersion;
}

async function registerServiceWorker() {
	if (!navigator.serviceWorker)
		return;

	// adapted from https://stackoverflow.com/a/37582216/9819447
	// register service worker
	const registration = await navigator.serviceWorker.register("/serviceWorker.js");

	// listen for new installations

	if (registration.waiting && registration.active)
		setWaitingServiceWorker(registration.waiting);

	registration.addEventListener("updatefound", () => {
		registration.installing.addEventListener("statechange", (event) => {
			if ((event.target as ServiceWorker).state === "installed" && registration.active)
				setWaitingServiceWorker(event.target);
		});
	});
}

function disableSpaceBarScroll() {
	window.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))
			e.preventDefault();
	})
}

/**
 * Firefox in private mode can cause all sorts of problems --> check for it
 *
 * @return true --> stop execution, false: continue normally
 */
async function checkFirefoxPrivateMode(): Promise<boolean> {
	const hasCheckCompleted = localStorage.firefoxPrivateModeCheck === "true";
	if (hasCheckCompleted)
		return false;
	localStorage.firefoxPrivateModeCheck = "true";
	const isFirefoxPrivate = await isFirefoxPrivateMode();
	if (!isFirefoxPrivate)
		return false;
	const errorPage = document.createElement("div");
	errorPage.innerHTML = `
		<h1>Are you using Firefox in Private Mode?</h1>
		<h2>Yes</h2>
		<p>
			In order to work at all you have to disable "Enhanced Tracking Protection". 
			<a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop#w_what-to-do-if-a-site-seems-broken" target="_blank">
			https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop#w_what-to-do-if-a-site-seems-broken
			</a>
		</p>
		<p>Firefox private mode is not fully supported.</p>
		<h2>No</h2>
		<p>Reload the page and hope that everything works :)</p>
	`;
	ViewsStack.attachmentPoint.appendChild(errorPage);
	return true;
}

function isFirefoxPrivateMode(): Promise<boolean> {
	return new Promise(resolve => {
		// as of now firefox does not support indexed db in private mode
		const db = indexedDB.open("firefoxPrivateModeTest");
		db.onsuccess = () => {
			indexedDB.deleteDatabase("firefoxPrivateModeTest");
			resolve(false);
		};
		db.onerror = async () => {
			// firefox has an aggressive "Enhanced Tracking protection" in private mode, which blocks request to reddit
			// check if basic request fails
			try {
				const r = await fetch("https://www.reddit.com/r/all.json?limit=1");
				await r.json();
				resolve(false);
			}
			catch (e) {
				resolve(true);
			}
		};
	});
}

window.addEventListener("load", init);
