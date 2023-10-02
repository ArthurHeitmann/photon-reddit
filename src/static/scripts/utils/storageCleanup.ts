import Users from "../multiUser/userManagement";

/**
 * Clears cached data in the storage occasionally
 */

export async function clearAllOldData() {
	const now = Date.now();
	let removedCachedInfos = 0;
	for (const storageKey in Users.current.d.caches.feedInfos) {
		if (!/^\/(r|u|user)\/[^/]+/.test(storageKey))		// skip if not feed info, must be /r/..., /u/..., /user/...
			continue;
		const feedInfo = Users.current.d.caches.feedInfos[storageKey];
		if (now - feedInfo.lastUpdatedMsUTC < Users.global.d.photonSettings.clearFeedCacheAfterMs)			// skip if has been accessed recently
			continue;
		const currentFeedUrlMatches = history.state.url.match(/^\/(u|user)\/([^/]+)/);
		if (storageKey[1] === "r" 							// skip if this is currently active feed
			? history.state.url.startsWith(storageKey)
			: currentFeedUrlMatches && currentFeedUrlMatches.length > 1 && currentFeedUrlMatches[2] === storageKey.match(/^\/(u|user)\/([^/]+)/)[2]
		)
			continue;

		Users.current.remove("caches", "feedInfos", storageKey);
		++removedCachedInfos;
	}

	let removedSeen = 0;
	for (const [postName, lastSeenUtcS] of Object.entries(Users.global.d.seenPosts)) {
		if (now - lastSeenUtcS*1000 < Users.global.d.photonSettings.clearSeenPostAfterMs)
			continue;
		Users.global.unmarkPostAsSeen(postName);
		++removedSeen;
	}
	// remove some seen posts, if more than 35k marked as seen; leave 30k most recent
	if (Object.keys(Users.global.d.seenPosts).length > 35000) {
		const tooManyPosts = Object.entries(Users.global.d.seenPosts)							// all seen posts
			.sort((a, b) => b[1] - a[1])	// sort descending by time seen
			.slice(30000);														// select all starting from 30k
		for (const post of tooManyPosts) {
			Users.global.unmarkPostAsSeen(post[0]);
			++removedSeen;
		}
	}
	// remove old viewed posts
	const viewerPostsCutoff = now / 1000 - 60 * 60 * 24 * 30;		// 30 days
	const lastViewedPosts = { ...Users.global.d.postLastViewedAt };
	for (const [postName, lastViewedUtcS] of Object.entries(lastViewedPosts)) {
		if (lastViewedUtcS > viewerPostsCutoff)
			continue;
		delete lastViewedPosts[postName];
	}
	if (Object.keys(lastViewedPosts).length !== Object.keys(Users.global.d.postLastViewedAt).length)
		await Users.global.set(["postLastViewedAt"], lastViewedPosts);
	const prevViewedPosts = { ...Users.global.d.postPreviouslyViewedAt };
	for (const [postName, lastViewedUtcS] of Object.entries(prevViewedPosts)) {
		if (lastViewedUtcS > viewerPostsCutoff)
			continue;
		delete prevViewedPosts[postName];
	}
	if (Object.keys(prevViewedPosts).length !== Object.keys(Users.global.d.postPreviouslyViewedAt).length)
		await Users.global.set(["postPreviouslyViewedAt"], prevViewedPosts);

	// remove data from old versions
	localStorage.removeItem("browserFeaturesTracked");
	localStorage.removeItem("multisData");
	localStorage.removeItem("queuedHosts");
	localStorage.removeItem("subreddits");
	localStorage.removeItem("subredditsData");
	localStorage.removeItem("subs");
	localStorage.removeItem("multis");
	for (const lsKey in localStorage) {
		if (/^\/(r|u|user)\/[^/]+/.test(lsKey))
			localStorage.removeItem(lsKey);
	}

	console.log(`Storage cleaner took ${Date.now() - now}ms, removed ${removedCachedInfos} cached feed infos and ${removedSeen} seen posts`);
}

// wait 10 seconds to avoid additional lag
Users.ensureDataHasLoaded().then(() => setTimeout(() => {
	clearAllOldData();
	setInterval(() => clearAllOldData(), 1000 * 60 * 60);		// clear cache every 60 minutes
}, 60 * 1000 * 5));
