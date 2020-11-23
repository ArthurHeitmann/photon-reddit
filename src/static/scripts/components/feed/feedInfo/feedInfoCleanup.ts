import { StoredData } from "../../../utils/globals.js";

export function clearAllFeedCachesOlderThan(timeMs: number) {
	const now = Date.now();
	for (const localStorageKey of Object.keys(localStorage)) {
		if (!/^\/(r|u|user)\/[^/]+/.test(localStorageKey))		// skip if not feed info
			continue;
		const feedInfo = JSON.parse(localStorage[localStorageKey]) as StoredData;
		if (now - feedInfo.lastUpdatedMsUTC < timeMs)			// skip if has been accessed recently
			continue;
		const currentFeedUrlMatches = location.pathname.match(/^\/(u|user)\/([^/]+)/);
		if (localStorageKey[1] === "r" 							// skip if this is currently active feed
			? location.pathname.startsWith(localStorageKey)
			: currentFeedUrlMatches && currentFeedUrlMatches.length > 1 && currentFeedUrlMatches[2] === localStorageKey.match(/^\/(u|user)\/([^/]+)/)[2]
		)
			continue;

		localStorage.removeItem(localStorageKey)
	}



	console.log(`Cache cleaner too ${Date.now() - now}ms`);
}
