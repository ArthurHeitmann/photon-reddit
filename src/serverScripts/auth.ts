import express from "express";
import RateLimit from "express-rate-limit";
import fetch from "node-fetch";
import { appId, redirectURI } from "./config.js";
import { redditTokenRateLimitConfig } from "./consts.js";
import { safeExcAsync } from "./utils.js";

export const authRouter = express.Router();

async function getAccessToken(params: URLSearchParams): Promise<string> {
	const response = await fetch("https://www.reddit.com/api/v1/access_token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(appId + ":").toString("base64")}`,
		},
		body: params
	});

	const responseData = await response.json();
	if (responseData["error"])
		throw responseData;
	return responseData;
}

export async function initialAccessToken(code: string): Promise<string> {
	const formBody = new URLSearchParams(
		"grant_type=authorization_code&" +
		`code=${ code }&` +
		`redirect_uri=${ redirectURI }`
	);
	return await getAccessToken(formBody);
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
	const formBody = new URLSearchParams(
		"grant_type=refresh_token&" +
		`refresh_token=${ refreshToken }`
	);
	return await getAccessToken(formBody);
}

async function implicitGrant(clientId: string): Promise<Object> {
	if (clientId.length < 20 || clientId.length > 30)
		return { error: "clientId length must be >= 20 && <= 30" };

	const r = await fetch("https://www.reddit.com/api/v1/access_token", {
		method: "POST",
		headers: {
			"Authorization": `Basic ${Buffer.from(`${appId}:`).toString("base64")}`,
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams([
			["grant_type", "https://oauth.reddit.com/grants/installed_client"],
			["device_id", clientId]
		]),
	});
	return await r.json();
}

authRouter.get("/refreshToken", RateLimit(redditTokenRateLimitConfig), safeExcAsync(async (req, res) => {
	if (req.query["refreshToken"]) {
		try {
			const data = await refreshAccessToken(req.query["refreshToken"].toString());
			res.json({ accessToken: data["access_token"], refreshToken: data["refresh_token"] });
		} catch (e) {
			res.json({ error: `error getting access token` });
		}
	}
	else {
		res.json({ error: "¯\\_(ツ)_/¯"}).status(400);
	}
}));

authRouter.get("/applicationOnlyAccessToken", RateLimit(redditTokenRateLimitConfig), safeExcAsync(async (req, res) => {
	if (!req.query["clientId"]) {
		res.status(400).json({ error: "missing clientId" })
		return;
	}
	res.json(await implicitGrant(req.query["clientId"].toString()));
}));

authRouter.post("/revoke", RateLimit(redditTokenRateLimitConfig), safeExcAsync(async (req, res) => {
	const refreshToken = req.query["refreshToken"].toString();
	const r = await fetch("https://www.reddit.com/api/v1/revoke_token", {
		method: "POST",
		body: new URLSearchParams([
			["token", refreshToken],
			["token_type_hint", "refresh_token"],
		]),
		headers: new Headers({
			Authorization: `Basic ${Buffer.from(appId + ":").toString("base64")}`
		})
	});
	console.log(await r.json());
	res.send("YEP");
}));
