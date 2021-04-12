/**
 *
 */

import { Changelog } from "../types/misc.js";

/** */
export async function youtubeDlUrl(url): Promise<string> {
	const res = await fetch(`/api/youtube-dl?url=${encodeURIComponent(url)}`);
	const clipMp4 = (await res.json())["url"];
	return clipMp4;
}

export function urlRequiresProxy(url: string): boolean {
	return (
		/^\/r\/(random|randnsfw)([/?#.].*)?$/.test(url) ||
		/^\/r\/[^/?#]+\/random/.test(url)
	);
}

export async function redditProxy(url: string, authorization: string): Promise<any> {
	try {
		const r = await fetch(`/api/proxy${url}`, {
			headers: { Authorization: authorization }
		});
		return r.json();
	}
	catch (e) {
		return { error: e }
	}
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
	let queuedHosts: {}[];
	try {
		queuedHosts = JSON.parse(localStorage.queuedHosts);
		if (!(queuedHosts instanceof Array))
			queuedHosts = [];
	}
	catch {
		queuedHosts = [];
	}
	queuedHosts.push({ mediaUrl, linkUrl, type });
	if (queuedHosts.length < 100) {
		localStorage.queuedHosts = JSON.stringify(queuedHosts);
		return
	}

	fetch("/data/mediaHost", {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify(queuedHosts)
	});
	localStorage.queuedHosts = "[]";
}
