/**
 *
 */

import { Changelog } from "../types/misc.js";
import { getAuthHeader } from "./redditApi.js";

/** */
export async function youtubeDlUrl(url): Promise<string> {
	const res = await fetch(`/api/youtube-dl?url=${encodeURIComponent(url)}`);
	const clipMp4 = (await res.json())["url"];
	return clipMp4;
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
	const subReq = await fetch(`/api/randomSubreddit?isNsfw=${isNsfw ? "true" : "false"}`, {
		headers: { Authorization: getAuthHeader() }
	});
	const subRes = await subReq.json() ;
	if (subRes["error"])
		return null;
	else
		return  subRes["subreddit"];
}

export async function getRandomSubredditPostUrl(subreddit: string): Promise<string> {
	const postReq = await fetch(`/api/randomSubredditPostUrl?subreddit=${subreddit}`, {
		headers: { Authorization: getAuthHeader() }
	});
	const postRes = await postReq.json() ;
	if (postRes["error"])
		return null;
	else
		return  postRes["url"];
}
