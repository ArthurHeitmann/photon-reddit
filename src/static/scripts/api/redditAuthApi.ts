/** Get access and refresh Tokens and implicit grants */

import Users from "../components/multiUser/userManagement";
import { appId, redirectURI } from "../utils/consts";

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
		const response = await fetch("https://www.reddit.com/api/v1/access_token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${btoa(appId + ":")}`,
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
		const r = await fetch("https://www.reddit.com/api/v1/revoke_token", {
			method: "POST",
			body: new URLSearchParams([
				["token", Users.current.d.auth.refreshToken],	// revoking a refresh token, revokes all a related access tokens
				["token_type_hint", "refresh_token"],
			]),
			headers: new Headers({
				Authorization: `Basic ${btoa(appId + ":")}`,
			})
		});
		return r.status === 200;
	}
	catch (e) {
		console.error(e);
		return false;
	}
}
