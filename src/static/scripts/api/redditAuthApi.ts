/** Get access and refresh Tokens and implicit grants */

import { getAppId } from "../auth/auth";
import Users from "../multiUser/userManagement";
import {redirectURI} from "../utils/consts";
import {onApiUsage} from "./redditApiUsageTracking";

interface AccessTokenReturn {
	access_token?: string,
	refresh_token?: string,
	token_type?: "bearer",
	expires_in?: number,
	scope?: string,
	error?: string
}

async function getAccessToken(params: URLSearchParams, additionHeaders: HeadersInit = {}): Promise<AccessTokenReturn> {
	try {
		onApiUsage("/api/v1/access_token", "reddit_auth");
		const response = await fetch("https://www.reddit.com/api/v1/access_token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${btoa(getAppId() + ":")}`,
				...additionHeaders
			},
			body: params
		});

		return await response.json();
	}
	catch (e) {
		console.error(e);
		return { error: "Error getting access token" }
	}
}

export async function getInitialAccessToken(code: string): Promise<AccessTokenReturn> {
	const formBody = new URLSearchParams(
		"grant_type=authorization_code&" +
		`code=${ code }&` +
		`redirect_uri=${ redirectURI }`
	);
	return await getAccessToken(formBody);
}

export async function getRefreshAccessToken(refreshToken: string): Promise<AccessTokenReturn> {
	const formBody = new URLSearchParams(
		"grant_type=refresh_token&" +
		`refresh_token=${ refreshToken }`
	);
	return await getAccessToken(formBody);
}

export async function getImplicitGrant(clientId: string): Promise<AccessTokenReturn> {
	if (clientId.length < 20 || clientId.length > 30)
		return { error: "clientId length must be >= 20 && <= 30" };

	return await getAccessToken(
		new URLSearchParams([
			["grant_type", "https://oauth.reddit.com/grants/installed_client"],
			["device_id", clientId]
		]),
		{ "Content-Type": "application/x-www-form-urlencoded" }
	);
}

export async function revokeToken(): Promise<boolean> {
	try {
		onApiUsage("/api/v1/revoke_token", "reddit_auth");
		const revokeRequests = await Promise.all(
			[Users.current.d.auth.refreshToken, Users.current.d.auth.accessToken]
				.map(token => fetch("https://www.reddit.com/api/v1/revoke_token", {
					method: "POST",
					body: new URLSearchParams([
						["token", token],
					]),
					headers: new Headers({
						Authorization: `Basic ${btoa(getAppId() + ":")}`,
					})
				}))
		);
		return revokeRequests.every(req => req.status === 200);
	}
	catch (e) {
		console.error(e);
		return false;
	}
}
