import dns from "dns";
import express from "express";
import { env } from "./consts";

/** Fallback for when service worker doesn't work */
export function cacheControl(req: express.Request, res: express.Response, next: express.NextFunction) {
	// let cacheSeconds = 0;
	// if (env === "production") {
	// 	if (/\.js([#?].*)?$/.test(req.url)) {
	// 		cacheSeconds = 60 * 60;
	// 	} else if (/\.(svg|png|jpg)([#?].*)?$/.test(req.url)) {
	// 		cacheSeconds = 60 * 60 * 24;
	// 	} else if (/\.css([#?].*)?$/.test(req.url)) {
	// 		cacheSeconds = 60 * 60 * 4;
	// 	}
	// }
	// res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);
	next();
}

export function checkSslAndWww(req: express.Request, res: express.Response, next: express.NextFunction) {
	// if no https or hostname has www. redirect to https without www.
	if ((env === "development" || req.headers["x-forwarded-proto"] === "https") && !(/^www\./.test(req.hostname))) {
		next();
	} else {
		res.redirect(`https://${req.hostname.replace(/^www\./, "")}${req.originalUrl}`)
	}
}

export function safeExc(func: (req: express.Request, res: express.Response, next?: express.NextFunction) => void) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		try {
			func(req, res, next);
		}
		catch (e) {
			console.error(e);
			res.json({ error: "¯\\_(ツ)_/¯" });
		}
	}
}

export function safeExcAsync(func: (req: express.Request, res: express.Response, next?: express.NextFunction) => Promise<void>) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) =>
		func(req, res, next)
			.catch(err => {
				console.error(err);
				return res.status(400).json({ error: "¯\\_(ツ)_/¯" });
			});
}

const isIpFromBotRegex = new RegExp("googlebot.com|msn.com|ahrefs.com|duckduckgo.com|netsystemsresearch.com".replace(/\./g, "\\."));
/** Performs a reverse dns lookup on the ip. Check if the returned host matches a known bot/crawler. */
export async function isIpFromBot(req: express.Request): Promise<boolean> {
	try {
		let tmpIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
		if (!tmpIp)
			return false;

		let ips: string[];
		if (tmpIp instanceof Array)
			ips = tmpIp;
		else
			ips = tmpIp.split(", ");

		const reversedHosts = await Promise.allSettled(ips.map(ip => dns.promises.reverse(ip)));
		const botHosts = reversedHosts
			.filter(result => result.status === "fulfilled")
			.map((result: PromiseFulfilledResult<string[]>) => result.value)
			.flat()
			.filter(host => isIpFromBotRegex.test(host));
		console.log(JSON.stringify({ ips, "user-agent": req.headers["user-agent"], reversedHosts: reversedHosts }));

		return botHosts.length > 0;
	} catch {
		return false;
	}
}
