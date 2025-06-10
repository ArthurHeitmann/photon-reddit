import fetch, {Headers, RequestInit, Response} from "node-fetch";
import { photonVersion } from "./version";
import { appId } from "../static/scripts/utils/consts";


export class RedditAuth {
	private accessToken: string = "";
	private accessTokenExpires: number = 0;
	rateLimitUsed: number = 0;
	rateLimitRemaining: number = 100;
	rateLimitResetAt: number = Date.now()/1000 + 100;

	async getAccessTokenWithRefresh(userAgent: string): Promise<string> {
		const now = Date.now();
		if (this.accessToken && this.accessTokenExpires > now)
			return this.accessToken;
		this.accessToken = await this.getAccessToken(userAgent);
		this.accessTokenExpires = now + 1000 * 60 * 60;
		return this.accessToken;
	}

	async oauthRequest<T>(endpoint: string, params: { [q: string]: string }, userAgent: string, method: string = "GET"): Promise<T> {
		const fetchOptions: RequestInit = {
			method: method,
			headers: {
				"Authorization": "Bearer " + await this.getAccessTokenWithRefresh(userAgent),
			},
		};
		params["raw_json"] = "1";
		if (method !== "GET") {
			fetchOptions.body = JSON.stringify(params);
		}
		const url = new URL(`https://oauth.reddit.com${endpoint}`);
		for (const key in params) {
			url.searchParams.append(key, params[key]);
		}
		const response = await fetch(url.toString(), fetchOptions);
		await this.rateLimitCheck(response.headers);
		const text = await response.text();
		return JSON.parse(text);
	}

	async resolvePath(path: string, userAgent: string): Promise<{ url: string, path: string, redirects: number }> {
		let response: Response;
		let url: string;
		let previousUrl: string|undefined;
		let isRedirect = false;
		let i = 0;
		const supportedRedditUrl = /^https:\/\/(\w+\.)?reddit.com\/(r|u|user)\/[^/#?]+([?/#]|$)(?!s\/)/i;	// not a /s/ url
		do {
			response = await fetch(`https://oauth.reddit.com${path}`, {
				method: "HEAD",
				redirect: "manual",
				headers: {
					"Authorization": "Bearer " + await this.getAccessTokenWithRefresh(userAgent),
					"User-Agent": userAgent
				}
			});
			let newUrl = response.headers.get("location");
			if (!newUrl)
				break;
			if (!newUrl.startsWith("http"))
				newUrl = new URL(newUrl, response.url).href;
			url = newUrl;
			if (url === previousUrl)
				break;
			previousUrl = url;
			isRedirect = response.status >= 300 && response.status < 400;
			i++;
		}
		while (isRedirect && !supportedRedditUrl.test(url) && i < 5);
		
		if (!supportedRedditUrl.test(url)) {
			throw new Error("Failed to resolve url");
		}
		const urlObj = new URL(url);
		urlObj.search = "";
		urlObj.hash = "";
		
		return {
			url: urlObj.toString(),
			path: urlObj.pathname,
			redirects: i
		};
	}

	async getAccessToken(userAgent: string): Promise<string> {
		const response = await fetch("https://www.reddit.com/api/v1/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": "Basic " + Buffer.from(appId + ":").toString("base64"),
				"User-Agent": userAgent
			},
			body: new URLSearchParams({
				grant_type: "https://oauth.reddit.com/grants/installed_client",
				device_id: "DO_NOT_TRACK_THIS_DEVICE"
			})
		});
		const json: any = await response.json();
		const accessToken = json["access_token"];
		if (typeof accessToken !== "string" || accessToken.length === 0)
			throw new Error("Invalid access token");
		return accessToken;
	}

	private async rateLimitCheck(headers: Headers): Promise<void> {
		const rlReqUsed = parseInt(headers.get("x-ratelimit-used")!);
		const rlReqRemaining = parseInt(headers.get("x-ratelimit-remaining")!);
		const rlTimeRemaining = parseInt(headers.get("x-ratelimit-reset")!);
		if (isNaN(rlReqUsed) || isNaN(rlReqRemaining) || isNaN(rlTimeRemaining))
			return;
		this.rateLimitUsed = rlReqUsed;
		this.rateLimitRemaining = rlReqRemaining;
		const rateLimitResetAt = Date.now()/1000 + rlTimeRemaining;
		if (rateLimitResetAt > this.rateLimitResetAt)
			this.rateLimitResetAt = rateLimitResetAt;
		if (rlReqRemaining < 15)
			console.log(`Rate limit: ${rlReqRemaining} requests remaining, ${rlTimeRemaining} seconds until reset`);
	}
}
