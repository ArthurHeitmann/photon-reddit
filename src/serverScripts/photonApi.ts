import express from "express";
import RateLimit from "express-rate-limit";
import { basicRateLimitConfig, youtube_dlRateLimitConfig } from "./consts.js";
import { safeExc, safeExcAsync } from "./utils.js";
import youtube_dl from "youtube-dl";
import { photonChangeLog, photonVersion } from "./version.js";

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

photonApiRouter.get("/changeLog", safeExc((req, res) => {
	res.json(photonChangeLog);
}))
