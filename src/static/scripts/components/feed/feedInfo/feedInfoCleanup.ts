import { seenPosts, StoredData, unmarkPostAsSeen } from "../../../utils/globals.js";
import { globalSettings } from "../../global/photonSettings/photonSettings.js";

export function clearAllOldData() {
	const now = Date.now();
	let removedCachedInfos = 0;
	for (const localStorageKey of Object.keys(localStorage)) {
		if (!/^\/(r|u|user)\/[^/]+/.test(localStorageKey))		// skip if not feed info
			continue;
		const feedInfo = JSON.parse(localStorage[localStorageKey]) as StoredData;
		if (now - feedInfo.lastUpdatedMsUTC < globalSettings.clearFeedCacheAfterMs)			// skip if has been accessed recently
			continue;
		const currentFeedUrlMatches = location.pathname.match(/^\/(u|user)\/([^/]+)/);
		if (localStorageKey[1] === "r" 							// skip if this is currently active feed
			? location.pathname.startsWith(localStorageKey)
			: currentFeedUrlMatches && currentFeedUrlMatches.length > 1 && currentFeedUrlMatches[2] === localStorageKey.match(/^\/(u|user)\/([^/]+)/)[2]
		)
			continue;

		localStorage.removeItem(localStorageKey);
		++removedCachedInfos;
	}

	let removedSeen = 0;
	for (const [postName, lastSeenUtcS] of Object.entries(seenPosts)) {
		if (now - lastSeenUtcS*1000 < globalSettings.clearSeenPostAfterMs)
			continue;
		unmarkPostAsSeen(postName);
		++removedSeen;
	}

	console.log(`Cache cleaner too ${Date.now() - now}ms, removed ${removedCachedInfos} cached feed infos and ${removedSeen} seen posts`);
}
