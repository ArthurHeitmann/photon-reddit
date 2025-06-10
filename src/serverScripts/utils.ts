import dns from "dns";
import express from "express";
import { env } from "./consts";
import { promises as fs } from "fs";
import path from "path";

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

		return botHosts.length > 0;
	} catch {
		return false;
	}
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

function getCookies(req: express.Request): { [key: string]: string } {
	const cookies: { [key: string]: string } = {};
	const cookieList = (req.headers.cookie ?? "")?.split("; ");
	for (const cookie of cookieList) {
		const [key, value] = cookie.split("=");
		cookies[key] = value;
	}
	return cookies;
}

const themeOverrides = {
	"light": [
		["#e4e4e4", "#2c2c2c"],
		["#ffd700", "#ffae00"],
		["#88ff76", "#31cd31"],
	]
}

async function overrideSvgTheme(req: express.Request, res: express.Response, themeOverride: string) {
	const filePath = path.join(process.cwd(), "src", "static", "img", req.path);
	let svg: string;
	try {
		svg = await fs.readFile(filePath, "utf8");
	}
	catch (e) {
		if (!await fileExists(filePath)) {
			res.sendStatus(404);
			return;
		}
		throw e;
	}
	const overrideColors = themeOverrides[themeOverride];
	let newSvg = svg;
	for (const [from, to] of overrideColors) {
		newSvg = newSvg.replace(new RegExp(from, "g"), to);
	}
	res.setHeader("Content-Type", "image/svg+xml");
	res.send(newSvg);
}

export async function imgThemeOverride(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (!req.path.endsWith(".svg")) {
		next();
		return;
	}
	if ("noThemeOverride" in req.query) {
		next();
		return;
	}
	const themeOverride = getCookies(req).themeOverride;
	if (themeOverride && themeOverride in themeOverrides)
		await overrideSvgTheme(req, res, themeOverride);
	else
		next();
}

export function getUserAgent(req: express.Request, res: express.Response): string {
	const userAgent = req.headers["user-agent"];
	if (typeof userAgent !== "string" || userAgent.length < 10) {
		return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
	}
	return userAgent;
}
