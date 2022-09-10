import express from "express";
import RateLimit from "express-rate-limit";
import fetch from "node-fetch";
import youtube_dl from "youtube-dl-exec";
import {
	basicRateLimitConfig,
	proxyRateLimitConfig,
	tokenRequestRateLimitConfig,
	youtube_dlRateLimitConfig
} from "./consts";
import {safeExc, safeExcAsync} from "./utils";
import {photonChangelog, photonVersion} from "./version";

export const photonApiRouter = express.Router();

photonApiRouter.get("/youtube-dl", RateLimit(youtube_dlRateLimitConfig), safeExcAsync(async (req, res) => {
	let url: any;
	try {
		url = await youtube_dl(req.query["url"].toString(), { getUrl: true });
	}
	catch {
		url = "";
	}
	if (!url) {
		res.json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const urlTrimmed = url.match(/https:\/\/.*$/);		// youtube_dl might return more text before printing the url
	if (!urlTrimmed) {
		res.json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	res.json({ url: urlTrimmed[0] });
}));

photonApiRouter.get("/latestVersion", RateLimit(basicRateLimitConfig), safeExc((req, res) => {
	res.json({ version: photonVersion });
}));

photonApiRouter.get("/changelog", safeExc((req, res) => {
	res.json(photonChangelog);
}))

async function getRedirectUrl(url: string, auth: string): Promise<string> {
	const r = await fetch(url, {
		method: "HEAD",
		redirect: "manual",
		headers: {
			"Authorization": auth,
			"User-Agent": `web_backend:photon-reddit.com:v${photonVersion} (by /u/RaiderBDev)`
		}
	});
	await r.text();
	return r.headers.get("location");
}

photonApiRouter.get("/randomSubreddit", safeExcAsync(async (req, res) => {
	const auth = req.headers.authorization;
	if (!auth) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const isNsfw = req.query["isNsfw"] === "true";
	const redirectedUrl = await getRedirectUrl(`https://oauth.reddit.com/r/${isNsfw ? "randnsfw" : "random"}`, auth);
	if (!redirectedUrl) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const subreddit = redirectedUrl.match(/(?<=reddit\.com\/r\/)[^/#?]+/)[0];	// https://reddit.com/r/AskReddit --> AskReddit
	res.json({ subreddit });
}));

photonApiRouter.get("/randomSubredditPostUrl", safeExcAsync(async (req, res) => {
	const auth = req.headers.authorization;
	if (!auth) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const subreddit = req.query["subreddit"]?.toString();
	if (!subreddit) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const redirectedUrl = await getRedirectUrl(`https://oauth.reddit.com/r/${subreddit}/random`, auth);
	if (!redirectedUrl) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const path = redirectedUrl.match(/(?<=https:\/\/www\.reddit\.com).*(?=\.json)/)[0];		// https://reddit.com/**/.json* --> **
	res.json({ url: path });
}));

let lastApiCheck = -1;
let lastApiStatus = false;
const apiCheckInterval = 1000 * 60 * 10;
photonApiRouter.get("/isRedditApiAvailable", safeExcAsync(async (req, res) => {
	if (Date.now() - lastApiCheck < apiCheckInterval) {
		res.send(lastApiStatus ? "true" : "false");
		return;
	}
	lastApiCheck = Date.now();
	try {
		const r = await fetch("https://www.reddit.com/r/all.json?limit=1", {
			headers: {
				"User-Agent": `web_backend:photon-reddit.com:v${photonVersion} (by /u/RaiderBDev)`
			}
		});
		await r.json();
		res.send("true");
		lastApiStatus = true;
	}
	catch {
		res.send("false");
		lastApiStatus = false;
	}
}));

const allowedProxyDomains = ["xkcd.com", "ibb.co", "redgifs.com"];
photonApiRouter.get("/proxy", RateLimit(proxyRateLimitConfig), safeExcAsync(async (req, res) => {
	const url = req.query["url"].toString();
	const domain = url?.match(/([^./?#]+\.[^./?#]+)(?=[/?#]|$)/)?.[0];
	if (!url || !domain || !allowedProxyDomains.includes(domain)) {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
		return;
	}

	try {
		const r = await fetch(url);
		const text = await r.text();
		res.json({ text });
	}
	catch {
		res.status(400).json({ error: "¯\\_(ツ)_/¯" });
	}
}))

photonApiRouter.get("/requestRedgifsToken", RateLimit(tokenRequestRateLimitConfig), safeExcAsync(async (req, res) => {
	const clientId = process.env.redGifs_ClientId;
	const clientSecret = process.env.redGifs_ClientSecret;
	if (!clientId || !clientSecret) {
		res.status(500).json({error: "No client id or secret defined"});
		return;
	}

	const r = await fetch("https://api.redgifs.com/v2/oauth/client", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: clientId,
			client_secret: clientSecret
		})
	});
	const json: Object = await r.json();
	if (!("access_token" in json && "expires_in" in json)) {
		console.log(json); // TODO: remove
		res.status(500).json({error: "Could not get token"});
		return;
	}

	res.json({
		token: json["access_token"],
		expiration: Date.now() + json["expires_in"] ?? 60*60*24 * 1000 - 60*1000
	});
}));
