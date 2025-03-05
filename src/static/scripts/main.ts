"use strict";

/**
 * Entrypoint
 *
 * This file gets loaded from index.html and imports all the other files
 */

import {AuthState, checkAuthOnPageLoad, checkTokenRefresh} from "./auth/auth";
import Ph_Header from "./components/global/header/header";
import Ph_Toast, {Level} from "./components/misc/toast/toast";
import Users from "./multiUser/userManagement";
import Ph_Changelog from "./components/photon/changelog/changelog";
import Ph_Tutorial from "./components/photon/tutorial/tutorial";
import {pushLinkToHistorySep} from "./historyState/historyStateManager";
import ViewsStack from "./historyState/viewsStack";
import {PhEvents} from "./types/Events";
import {isFirefoxEtpBlocking} from "./utils/browserFeatures";
import {loginSubredditFullName, loginSubredditName} from "./utils/consts";
import {$css, $id} from "./utils/htmlStatics";
import {linksToSpa} from "./utils/htmlStuff";
import "./utils/sideEffectImports";
import {extractHash, extractPath, extractQuery, isMobile, makeElement} from "./utils/utils";
import {photonWebVersion} from "./utils/version";
import {setWaitingServiceWorker} from "./utils/versionManagement";
import VersionNumber from "./utils/versionNumber";
import Ph_MobileInfoPopup from "./components/photon/mobileInfoPopup/mobileInfoPopup";
import {doVersionMigration} from "./utils/versionMigration";
import { initiateLogin } from "./auth/loginHandler";

async function startPhotonReddit() {
	try {
		await init();
	} catch (e) {
		console.error(e);
		showInitErrorPage();
	}
}

async function init(): Promise<void> {
	console.log("Photon Init");

	await Users.init();
	if (await isFirefoxEtpBlocking()) {
		removeLoadingIcon();
		return;
	}
	registerServiceWorker();
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());
	linksToSpa(document.body);

	let thisUserFetch: Promise<void>;
	if (await checkAuthOnPageLoad() === AuthState.loggedIn) {
		thisUserFetch = Users.current.fetchUserData()
			.then(() => {
				// if (!Users.current.d.loginSubPromptDisplayed && !Users.current.subreddits.isSubscribedTo(loginSubredditName)) {
				// 	new Ph_Toast(Level.info, `Do you want to subscribe to r/${loginSubredditName}?`, {
				// 		onConfirm: () => Users.current.subreddits.setIsSubscribed(loginSubredditFullName, true)
				// 	});
				// }
				// Users.current.set(["loginSubPromptDisplayed"], true);
			})
			.catch(() => {
				showInitErrorPage();
			});
	}
	else {
		$css(".loginButton")[0].hidden = false;
		if (location.hash === "#showLogin") {
			location.hash = "";
			initiateLogin();
		}
	}
	setInterval(checkTokenRefresh, 1000 * 30);
	removeLoadingIcon();
	loadPosts();

	await versionCheck();
	disableSpaceBarScroll();
	checkMobileInfoPopup();

	if (thisUserFetch)
		await thisUserFetch;

	window.dispatchEvent(new Event(PhEvents.pageReady));
	window["isReady"] = true;
	if (Users.global.d.isFirstTimeVisit)
		await Users.global.set(["isFirstTimeVisit"], false);

	Ph_Tutorial.checkForTutorial();

	console.log("Photon is ready");
}

function removeLoadingIcon() {
	$id("initialLoadingIcon")?.remove();
}

function showInitErrorPage() {
	ViewsStack.attachmentPoint.append(makeElement("div", null, [
		makeElement("h1", null, "Bad error happened!"),
		makeElement("p", null, ["Maybe check ",
			makeElement("a", { href: "https://www.redditstatus.com/", target:"_blank" }, "redditstatus.com")]),
		makeElement("p", null, `If this error persists, try deleting this websites data in your browser`),
		makeElement("p", null, ["Or submit a bug report to on ",
			makeElement("a", { href: "https://github.com/ArthurHeitmann/photon-reddit/issues", target:"_blank" }, "GitHub"),
			" or ",
			makeElement("a", { href: "https://www.reddit.com/r/photon_reddit", target:"_blank" }, "r/photon_reddit")
		])
	]));
}

function loadPosts() {
	if (history.state?.url)
		pushLinkToHistorySep(extractPath(history.state.url) + extractHash(history.state.url), extractQuery(history.state.url));
	else
		pushLinkToHistorySep(location.pathname + location.hash, location.search || "");
}

async function versionCheck() {
	let lastVersion = new VersionNumber(Users.global.d.photonVersion);
	const currentVersion = new VersionNumber(photonWebVersion);
	await doVersionMigration(lastVersion, currentVersion);
	if (currentVersion.equals(lastVersion))
		return;
	else if (currentVersion.greaterThan(lastVersion)) {
		new Ph_Toast(
			Level.info,
			"New version installed! View changelog?",
			{ onConfirm: () => Ph_Changelog.show(lastVersion) }
		);
	}
	await Users.global.set(["photonVersion"], photonWebVersion)
}

async function registerServiceWorker() {
	if (!navigator.serviceWorker)
		return;

	// adapted from https://stackoverflow.com/a/37582216/9819447
	// register service worker
	const registration = await navigator.serviceWorker.register("/serviceWorker.js");

	// listen for new installations

	if (registration.waiting ?? registration.active)
		setWaitingServiceWorker(registration.waiting ?? registration.active);

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

function checkMobileInfoPopup() {
	if (!Users.global.d.isFirstTimeVisit || !isMobile())
		return;
	const popup = new Ph_MobileInfoPopup();
	document.body.append(popup);
	popup.show();
}

window.addEventListener("load", startPhotonReddit);
