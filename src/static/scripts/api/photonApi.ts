/**
 *
 */

import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {Changelog, RedditApiUsageRecord} from "../types/misc";
import {getAuthHeader} from "./redditApi";
import {RedgifsAuthData} from "../multiUser/globalData";
import { onApiUsage } from "./redditApiUsageTracking";
import { resolveShortLinkArcticShift } from "./redditArchiveApi";

/** */
export async function youtubeDlUrl(url): Promise<{ url?: string, error?: string }> {
	let res: Response;
	try {
		onApiUsage("/api/youtube-dl", "photon");
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

export async function trackBrowserFeatures(data: { featureName: string, isAvailable: boolean }): Promise<boolean> {
	try {
		const r = await fetch("/data/browserFeatures", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(data)
		});
		const response = await r.text();
		return response === "yep";
	} catch (e) {
		return false;
	}
}

export async function trackGenericProperty(key: string, value: string | number | boolean, data2: string): Promise<boolean> {
	try {
		const r = await fetch("/data/genericProperty", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				key: key.toString(),
				value: value.toString(),
				data2: data2.toString()
			})
		});
		const response = await r.text();
		return response === "yep";
	} catch (e) {
		return false;
	}
}

export async function getRandomSubreddit(isNsfw: boolean = false): Promise<string> {
	let subReq: Response;
	try {
		onApiUsage("/api/randomSubreddit", "photon");
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
		onApiUsage("/api/randomSubredditPostUrl", "photon");
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

export async function isRedditApiUp(): Promise<boolean> {
	try {
		onApiUsage("/api/isRedditApiAvailable", "photon");
		const r = await fetch("/api/isRedditApiAvailable");
		const t = await r.text();
		return t === "true";
	}
	catch {
		return false;
	}
}

export async function proxyFetch(url: string): Promise<string> {
	onApiUsage("/api/proxy", "photon");
	const r = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
	const data = await r.json();
	return data["text"];
}

export async function fetchRedgifsToken(): Promise<RedgifsAuthData> {
	const r = await fetch("/api/requestRedgifsToken");
	return await r.json();
}

export async function trackApiUsage(records: RedditApiUsageRecord[]): Promise<boolean> {
	try {
		const r = await fetch("/data/redditApiUsage", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(records)
		});
		const response = await r.text();
		return response === "yep";
	} catch (e) {
		return false;
	}
}

export async function resolveRedditUrl(url: string): Promise<string> {
	try {
		const resolvedUrl = await resolveShortLinkArcticShift(url);
		if (resolvedUrl) {
			return resolvedUrl;
		}
	} catch (e) {
		console.error("Error resolving short link with Arctic Shift:", e);
	}
	return await resolveRedditUrlPhotonApi(url);
}

async function resolveRedditUrlPhotonApi(url: string): Promise<string> {
	onApiUsage("/api/resolveRedditUrl", "photon");
	const r = await fetch(`/api/resolveRedditUrl?url=${encodeURIComponent(url)}`);
	const data = await r.json();
	if (data["error"] || !data["path"]) {
		new Ph_Toast(Level.warning, `Couldn't resolve reddit url (${data["error"]})`, { groupId: "reddit url resolver" });
		return url;
	}
	return data["path"];
}
