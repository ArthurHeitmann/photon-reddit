import {isRedditApiUp} from "../api/photonApi";
import Users from "../multiUser/userManagement";
import ViewsStack from "../historyState/viewsStack";

let _isIdbSupported: boolean = null;
export function supportsIndexedDB(): Promise<boolean> {
	return new Promise((resolve) => {
		// try load cached from localstorage
		if (_isIdbSupported === null && ["true", "false"].includes(localStorage.idbSupported))
			_isIdbSupported = localStorage.idbSupported === "true";
		// try return memory cached version
		if (_isIdbSupported !== null) {
			resolve(_isIdbSupported);
			return;
		}
		// test if supported
		if (!indexedDB) {
			resolve(_isIdbSupported = false);
			return;
		}
		const db = indexedDB.open("featureTest");
		db.onsuccess = () => {
			const deleteRequest = indexedDB.deleteDatabase("featureTest");
			deleteRequest.onsuccess = () => {};
			localStorage.setItem("idbSupported", "true");
			resolve(_isIdbSupported = true);
		};
		db.onerror = () => {
			localStorage.setItem("idbSupported", "false");
			resolve(_isIdbSupported = false);
		};
	});
}

export function supportsServiceWorkers(): boolean {
	return Boolean(navigator.serviceWorker);
}

/**
 * Firefox Enhanced Tracking Protection (ETP) can cause all sorts of problems --> check for it
 *
 * @return true --> stop execution, false: continue normally
 */
export async function isFirefoxEtpBlocking(): Promise<boolean> {
	if (Users.global.d.firefoxPrivateCheckCompleted)
		return false;
	await Users.global.set(["firefoxPrivateCheckCompleted"], true);
	const redditBlockedLocally = await isRedditBlockedOnlyLocally();
	if (!redditBlockedLocally)
		return false;
	const errorPage = document.createElement("div");
	errorPage.innerHTML = `
		<h1>Couldn't reach Reddit API!</h1>
		<h2>Are you using Firefox in Private Mode or have Enhanced Tracking Protection enabledd?</h2>
		<p>
			In order to work at all you have to disable ETP. 
			<a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop#w_what-to-do-if-a-site-seems-broken" target="_blank">
			https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop#w_what-to-do-if-a-site-seems-broken
			</a>
			<br>
			Firefox private mode is not fully supported.
		</p>
		<h2>No</h2>
		<p>¯\\_(ツ)_/¯</p>
		<p>Reload the page and hope that everything works :)</p>
	`;
	ViewsStack.attachmentPoint.appendChild(errorPage);
	return true;
}

async function isRedditBlockedOnlyLocally(): Promise<boolean> {
	try {
		const r = await fetch("https://www.reddit.com/r/all.json?limit=1");
		await r.json();
		return false;
	}
	catch {
		return await isRedditApiUp();
	}
}
