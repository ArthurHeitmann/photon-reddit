import express from "express";
import RateLimit from "express-rate-limit";
import * as https from "https";
import { basicRateLimitConfig, youtube_dlRateLimitConfig } from "./consts.js";
import { safeExc, safeExcAsync } from "./utils.js";
import youtube_dl from "youtube-dl";
import { photonChangelog, photonVersion } from "./version.js";
import XMLHttpRequest from "xmlhttprequest"
import fetch from "node-fetch";

export const photonApiRouter = express.Router();

photonApiRouter.get("/youtube-dl", RateLimit(youtube_dlRateLimitConfig), safeExc((req, res) => {
	youtube_dl.getInfo(req.query["url"], [], (err, info) => {
		if (!err && info && info.url)
			res.json({ url: info.url });
		else {
			res.json({ error: "¯\\_(ツ)_/¯"}).status(400);
		}
	});
}));

photonApiRouter.get("/latestVersion", RateLimit(basicRateLimitConfig), safeExc((req, res) => {
	res.json({ version: photonVersion });
}));

photonApiRouter.get("/changelog", safeExc((req, res) => {
	res.json(photonChangelog);
}))

photonApiRouter.get("/proxy*", safeExcAsync(async (req, res) => {
	const url = req.url.split("/proxy")[1];
	const auth = req.headers.authorization;
	try {
		// node-fetch doesn't seem to work with /r/sub/random --> use different library for this
		const data = await proxyPromise(url, auth);
		res.status(data.error !== undefined ? 400 : 200).json(data);
	}
	catch (e) {
		res.status(400).json({ error: "proxy error" });
	}
}));

function proxyPromise(url: string, auth: string): Promise<any> {
	const uri = `https://oauth.reddit.com${url}`;
	return new Promise<any>((resolve, reject) => {
		const xhr = new XMLHttpRequest.XMLHttpRequest();
		xhr.withCredentials = true;

		xhr.addEventListener("readystatechange", function() {
			if(this.readyState === 4) {
				let data: any;
				try {
					data = JSON.parse(this.responseText);
				}
				catch (e) {
					reject(e);
				}

				if (/^\/r\/[^/#?]+\/random([/#?].*)?$/.test(url) && data && data[0] && data[0]["data"]["children"][0]) {
					const redirectPath = data[0]["data"]["children"][0]["data"]["permalink"];
					const params = (new URL(uri)).search;
					proxyPromise(redirectPath + params, auth).then(resolve).catch(reject);
				}
				else
					resolve(data);
			}
		});

		xhr.open("GET", uri);
		xhr.setRequestHeader("authorization", auth);
		xhr.setRequestHeader("User-Agent", `web_backend:photon-reddit.com:v${photonVersion} (by /u/RaiderBDev)`);

		xhr.send();
	})
}
