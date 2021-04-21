import express from "express";
import RateLimit from "express-rate-limit";
import fetch from "node-fetch";
import youtube_dl from "youtube-dl-exec";
import { basicRateLimitConfig, youtube_dlRateLimitConfig } from "./consts.js";
import { safeExc, safeExcAsync } from "./utils.js";
import { photonChangelog, photonVersion } from "./version.js";

export const photonApiRouter = express.Router();

photonApiRouter.get("/youtube-dl", RateLimit(youtube_dlRateLimitConfig), safeExcAsync(async (req, res) => {
	const url = await youtube_dl(req.query["url"], {getUrl: true});
	if (!url) {
		res.json({ error: "¯\\_(ツ)_/¯" });
		return;
	}
	const urlTrimmed = url.match(/https:\/\/.*$/);
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
	const subreddit = redirectedUrl.match(/(?<=reddit\.com\/r\/)[^/#?]+/)[0];
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
	const path = redirectedUrl.match(/(?<=https:\/\/www\.reddit\.com).*(?=\.json)/)[0];
	res.json({ url: path });
}));
