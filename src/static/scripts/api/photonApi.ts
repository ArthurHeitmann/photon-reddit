/**
 *
 */

import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { Changelog } from "../types/misc.js";
import { getAuthHeader } from "./redditApi.js";

/** */
export async function youtubeDlUrl(url): Promise<{ url?: string, error?: string }> {
	let res: Response;
	try {
		res = await fetch(`/api/youtube-dl?url=${encodeURIComponent(url)}`);
	} catch (e) {
		console.error("error fetching youtube-dl url", e);
		return { error: "error fetching youtube-dl url" }
	}
	return await res.json();
}

export async function getChangelog(): Promise<Changelog> {
	let changelogData: Changelog;
	try {
		const r = await fetch("/api/changelog");
		changelogData = await r.json();
	}
	catch (e) {
		changelogData = {
			error: {
				error: ["Error getting changelog from server"]
			}
		}
	}
	return changelogData;
}

export function trackMediaHost(mediaUrl: string, linkUrl: string, type: string) {
	// let queuedHosts: {}[];
	// try {
	// 	queuedHosts = JSON.parse(localStorage.queuedHosts);
	// 	if (!(queuedHosts instanceof Array))
	// 		queuedHosts = [];
	// }
	// catch {
	// 	queuedHosts = [];
	// }
	// queuedHosts.push({ mediaUrl, linkUrl, type });
	// if (queuedHosts.length < 100) {
	// 	localStorage.queuedHosts = JSON.stringify(queuedHosts);
	// 	return
	// }
	//
	// fetch("/data/mediaHost", {
	// 	method: "POST",
	// 	headers: {
	// 		"content-type": "application/json"
	// 	},
	// 	body: JSON.stringify(queuedHosts)
	// });
	// localStorage.queuedHosts = "[]";
}

export async function getRandomSubreddit(isNsfw: boolean = false): Promise<string> {
	let subReq: Response;
	try {
		subReq = await fetch(`/api/randomSubreddit?isNsfw=${isNsfw ? "true" : "false"}`, {
			headers: { Authorization: getAuthHeader() }
		});
	} catch (e) {
		new Ph_Toast(Level.warning, "Couldn't reach Photon server", { timeout: 3500, groupId: "photon server unreachable" });
		throw e;
	}
	const subRes = await subReq.json() ;
	if (subRes["error"])
		return null;
	else
		return subRes["subreddit"];
}

export async function getRandomSubredditPostUrl(subreddit: string): Promise<string> {
	let postReq: Response;
	try {
		postReq = await fetch(`/api/randomSubredditPostUrl?subreddit=${subreddit}`, {
			headers: { Authorization: getAuthHeader() }
		});
	} catch (e) {
		new Ph_Toast(Level.warning, "Couldn't reach Photon server", { timeout: 3500, groupId: "photon server unreachable" });
		throw e;
	}
	const postRes = await postReq.json() ;
	if (postRes["error"])
		return null;
	else
		return postRes["url"];
}
