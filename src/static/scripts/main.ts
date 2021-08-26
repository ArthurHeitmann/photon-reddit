/**
 * Entrypoint
 *
 * This file gets loaded from index.html and imports all other files
 */

import { AuthState, checkAuthOnPageLoad, checkTokenRefresh } from "./auth/auth";
import { checkOrCompleteLoginRedirect, initiateLogin } from "./auth/loginHandler";
import Ph_Header from "./components/global/header/header";
import Ph_Toast, { Level } from "./components/misc/toast/toast";
import Ph_Changelog from "./components/photon/changelog/changelog";
import Ph_Tutorial from "./components/photon/tutorial/tutorial";
import { pushLinkToHistorySep } from "./historyState/historyStateManager";
import ViewsStack from "./historyState/viewsStack";
import { hasAnalyticsFileLoaded } from "./unsuspiciousFolder/unsuspiciousFile";
import { supportsIndexedDB } from "./utils/browserFeatures";
import { loginSubredditFullName, loginSubredditName } from "./utils/consts";
import { thisUser } from "./utils/globals";
import { $css, $id } from "./utils/htmlStatics";
import { linksToSpa } from "./utils/htmlStuff";
import "./utils/sideEffectImports";
import { extractHash, extractPath, extractQuery, makeElement } from "./utils/utils";
import { photonWebVersion } from "./utils/version";
import { setWaitingServiceWorker } from "./utils/versionManagement";
import VersionNumber from "./utils/versionNumber";

async function init(): Promise<void> {
	console.log("Photon Init");

	if (await checkFirefoxPrivateMode())
		return;
	registerServiceWorker();
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());
	linksToSpa(document.body);
	checkIfAnalyticsFileLoaded()
	const loginBtn = $css(".loginButton")[0];
	loginBtn.addEventListener("click", () => initiateLogin());

	await checkOrCompleteLoginRedirect();
	let thisUserFetch: Promise<void>;
	if (await checkAuthOnPageLoad() === AuthState.loggedIn) {
		thisUserFetch = thisUser.fetch()
			.then(() => {
				if (localStorage["loginRecommendationFlag"] !== "set" && !thisUser.subreddits.isSubscribedTo(loginSubredditName)) {
					new Ph_Toast(Level.info, `Do you want to subscribe to r/${loginSubredditName}?`, {
						onConfirm: () => thisUser.subreddits.setIsSubscribed(loginSubredditFullName, true)
					});
				}
				localStorage["loginRecommendationFlag"] = "set";
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
	window["isReady"] = true;
	if (localStorage["firstTimeFlag"] !== "set")
		localStorage["firstTimeFlag"] = "set";

	Ph_Tutorial.checkForTutorial();

	console.log("Photon is ready");
}

function showInitErrorPage() {
	ViewsStack.attachmentPoint.append(makeElement("div", null, [
		makeElement("h1", null, "Bad error happened!"),
		makeElement("p", null, ["Maybe check ",
			makeElement("a", { href: "https://www.redditstatus.com/", target:"_blank" }, "redditstatus.com")])
	]));
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
			{ onConfirm: () => Ph_Changelog.show(lastVersion) }
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

async function isFirefoxPrivateMode(): Promise<boolean> {
	// as of now firefox does not support indexed db in private mode
	const idbSupported = await supportsIndexedDB();
	if (idbSupported)
		return false;
	try {
		// firefox has an aggressive "Enhanced Tracking protection" in private mode, which blocks request to reddit
		// check if basic request fails
		const r = await fetch("https://www.reddit.com/r/all.json?limit=1");
		await r.json();
		return false;
	}
	catch {
		return true;
	}
}

window.addEventListener("load", init);
