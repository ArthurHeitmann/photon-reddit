import express, { RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import { env } from "./consts.js";

export function checkSslAndWww(req: express.Request, res: express.Response, next: express.NextFunction) {
	if ((env === "development" || req.headers['x-forwarded-proto'] === "https") && !(/^www\./.test(req.hostname))) {
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
			res.setHeader('Content-Type', 'application/json');
			res.json({ error: "¯\\_(ツ)_/¯" });
		}
	}
}

export function safeExcAsync(func: (req: express.Request, res: express.Response, next?: express.NextFunction) => void) {
	return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		try {
			expressAsyncHandler(func)(req, res, next);
		}
		catch (e) {
			console.error(e);
			res.setHeader('Content-Type', 'application/json');
			res.send('{ "error": "¯\\_(ツ)_/¯"}');
		}
	}
}
