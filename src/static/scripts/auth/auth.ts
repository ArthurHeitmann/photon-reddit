import { getImplicitGrant, getRefreshAccessToken } from "../api/redditAuthApi.js";
import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { clientId } from "../unsuspiciousFolder/unsuspiciousFile.js";
import { isLoggedIn, setIsLoggedIn, thisUser } from "../utils/globals.js";
import { logOut } from "./loginHandler.js";

export enum AuthState {
	loggedIn, implicitGrant
}

export async function checkTokenRefresh(): Promise<boolean> {
	if (!hasTokenExpired())
		return;

	if (isLoggedInLS())
		return await refreshAccessToken();
	else
		return await implicitGrant();
}

export async function checkAuthOnPageLoad(): Promise<AuthState> {
	if (!("isLoggedIn" in localStorage) || !["true", "false"].includes(localStorage.isLoggedIn))
		localStorage.isLoggedIn = "refreshToken" in localStorage;		// implicit grant doesn't have refresh token

	// has localstorage potentially usable auth data
	if (!isLoggedInLS()	|| isLoggedInLS() && localStorage.refreshToken) {
		if (isLoggedInLS()) {
			// before returning AuthState.loggedIn verifyTokenWorks() must somewhere be called
			setIsLoggedIn(true);
			if (hasTokenExpired() && !await refreshAccessToken()) {
				if (!verifyTokenWorks)
					authError("Failed to refresh authentication! If this is breaking the website, log out & reload?");
			}
			else if (!await verifyTokenWorks() && !await refreshAccessToken()) {
				authError("Invalid authentication! If this is breaking the website, log out & reload?");
			}
			return AuthState.loggedIn;
		}
		else {
			setIsLoggedIn(false);
			if (hasTokenExpired() && !await implicitGrant() || !await verifyTokenWorks() && !await implicitGrant())
				authError("Failed to get authentication! Do you want to clear data & reload?");
			return AuthState.implicitGrant;
		}
	}
	// no usable auth data
	else {
		setIsLoggedIn(false);
		if (!await implicitGrant())
			authError("Failed to get authentication! Do you want to clear data & reload?");
		return AuthState.implicitGrant;
	}
}

function authError(msg: string) {
	new Ph_Toast(Level.warning, msg, { onConfirm: logOut });
}

async function implicitGrant(): Promise<boolean> {
	const newToken = await getImplicitGrant(clientId.slice(0, 25));
	if (newToken["error"]) {
		console.error("error getting implicit grant", newToken);
		return false;
	}
	localStorage.isLoggedIn = "false";
	localStorage.accessToken = newToken.access_token;
	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
	return true;
}

async function refreshAccessToken(): Promise<boolean> {
	const newTokens = await getRefreshAccessToken(localStorage.refreshToken);
	if (newTokens["error"]) {
		console.error("Error refreshing access token", newTokens);
		return false;
	}
	localStorage.accessToken = newTokens.access_token;
	if (newTokens.refresh_token)
		localStorage.refreshToken = newTokens.refresh_token;
	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
	return true;
}

async function verifyTokenWorks(): Promise<boolean> {
	return await thisUser.fetchUser();
}

function hasTokenExpired(): boolean {
	const expiration = parseInt(localStorage.expiration);
	// invalidate 1 minutes ahead of expiration
	return !expiration || expiration - Date.now() < 1000 * 60;
}

function isLoggedInLS(): boolean {
	return localStorage.isLoggedIn === "true";
}
