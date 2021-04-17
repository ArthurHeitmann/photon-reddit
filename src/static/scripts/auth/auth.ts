import { redditApiRequest } from "../api/redditApi.js";
import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { clientId } from "../unsuspiciousFolder/unsuspiciousFile.js";
import { isLoggedIn, setIsLoggedIn } from "../utils/globals.js";

export function initiateLogin() {
	localStorage.pageBeforeLogin = history.state.url || "/";
	location.href = "/login";
}

export enum AuthState {
	loggedIn, implicitGrant
}

export async function logOut() {
	await fetch(`/auth/revoke?refreshToken=${location["refreshToken"]}`);
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("isLoggedIn");
	localStorage.removeItem("expiration");
	location.reload();
}

export async function checkAuthOnPageLoad(): Promise<AuthState> {
	if (!("isLoggedIn" in localStorage) || !["true", "false"].includes(localStorage.isLoggedIn))
		localStorage.isLoggedIn = "refreshToken" in localStorage;		// implicit grant doesn't have refresh token

	// has localstorage potentially usable auth data
	if (!isLoggedInLS()	|| isLoggedInLS() && localStorage.refreshToken) {
		if (isLoggedInLS()) {
			setIsLoggedIn(true);
			if (hasTokenExpired() && !await refreshAccessToken()) {
				authError("Failed to refresh authentication! If this is breaking the website, log out & reload?");
			}
			else if (!await verifyTokenWorks() && !await refreshAccessToken()) {
				authError("Invalid authentication! If this is breaking the website, log out & reload?");
			}
			return AuthState.loggedIn;
		}
		else {
			setIsLoggedIn(false);
			if (hasTokenExpired() && !await getImplicitGrant() || !await verifyTokenWorks() && !await getImplicitGrant())
				authError("Failed to get authentication! Do you want to clear data & reload?");
			return AuthState.implicitGrant;
		}
	}
	// no usable auth data
	else {
		setIsLoggedIn(false);
		if (!await getImplicitGrant())
			authError("Failed to get authentication! Do you want to clear data & reload?");
		return AuthState.implicitGrant;
	}
}

function authError(msg: string) {
	new Ph_Toast(Level.warning, msg, { onConfirm: logOut });
}

export async function checkTokenRefresh(): Promise<boolean> {
	if (!hasTokenExpired())
		return;

	if (isLoggedInLS())
		return await refreshAccessToken();
	else
		return await getImplicitGrant();
}

async function getImplicitGrant(): Promise<boolean> {
	const r = await fetch(`/auth/applicationOnlyAccessToken?clientId=${encodeURIComponent(clientId.slice(0, 25))}`);
	const data = await r.json();
	if (data["error"]) {
		console.error("error getting implicit grant", data);
		return false;
	}
	localStorage.isLoggedIn = "false";
	localStorage.accessToken = data.access_token;
	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
	return true;
}

async function refreshAccessToken(): Promise<boolean> {
	const r = await fetch(`/auth/refreshToken?refreshToken=${ encodeURIComponent(localStorage.refreshToken) }`);
	const newTokens = await r.json();
	if (newTokens["error"]) {
		console.error("Error refreshing access token", newTokens);
		return false;
	}
	localStorage.accessToken = newTokens.accessToken;
	if (newTokens.refreshToken)
		localStorage.refreshToken = newTokens.refreshToken;
	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
	return true;
}

async function verifyTokenWorks(): Promise<boolean> {
	const r = await redditApiRequest("/api/v1/me", [], true);
	return !("error" in r) && "features" in r;
}

function hasTokenExpired(): boolean {
	const expiration = parseInt(localStorage.expiration);
	// invalidate 5 minutes ahead of expiration (otherwise a server restart at the expiration time might cause issues)
	return !expiration || expiration - Date.now() < 1000 * 60 * 5;
}

function isLoggedInLS(): boolean {
	return localStorage.isLoggedIn === "true";
}
