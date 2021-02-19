import { redditApiRequest } from "../api/redditApi.js";
import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { clientId } from "../unsuspiciousFolder/unsuspiciousFile.js";
import { isLoggedIn, setIsLoggedIn } from "../utils/globals.js";

export function initiateLogin() {
	localStorage.pageBeforeLogin = history.state.url || "/";
	location.href = "/login";
}

export enum AuthState {
	LoggedIn, ImplicitGrant
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
			else if (!await verifyTokenWorksLoggedIn() || !await refreshAccessToken()) {
				authError("Invalid authentication! If this is breaking the website, log out & reload?");
			}
			return AuthState.LoggedIn;
		}
		else {
			setIsLoggedIn(false);
			if (hasTokenExpired() && !await getImplicitGrant() || !await verifyTokenWorksImplicit() || !await getImplicitGrant())
				authError("Failed to get authentication! Do you want to clear data & reload?");
			return AuthState.ImplicitGrant;
		}
	}
	// no usable auth data
	else {
		setIsLoggedIn(false);
		if (!await getImplicitGrant())
			authError("Failed to get authentication! Do you want to clear data & reload?");
		return AuthState.ImplicitGrant;
	}
}

function authError(msg: string) {
	new Ph_Toast(Level.Warning, msg, { onConfirm: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("expiration");
		location.reload();
	} });
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
	const r = await fetch(`/applicationOnlyAccessToken?clientId=${encodeURIComponent(clientId.slice(0, 25))}`);
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
	const r = await fetch(`/refreshToken?refreshToken=${ encodeURIComponent(localStorage.refreshToken) }`);
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

async function verifyTokenWorksLoggedIn(): Promise<boolean> {
	const r = await redditApiRequest("/api/v1/me", [], true);
	return !("error" in r);
}

async function verifyTokenWorksImplicit(): Promise<boolean> {
	const r = await redditApiRequest("/r/all/new", [], false);
	return !("error" in r);
}

function hasTokenExpired(): boolean {
	const expiration = parseInt(localStorage.expiration);
	// invalidate 5 minutes ahead of expiration (otherwise a server restart at the expiration time might cause issues)
	return !expiration || expiration - Date.now() < 1000 * 60 * 5;
}

function isLoggedInLS(): boolean {
	return localStorage.isLoggedIn === "true";
}



// /**
//  * @returns true: access token is still valid or was just successfully updates;
//  * 		    false: no access token is set or couldn't be renewed
//  */
// export async function checkTokenExpiry(): Promise<boolean> {
// 	// check if token and expiration date are set
//
// 	if (!localStorage.accessToken || !localStorage.expiration)
// 		return setIsLoggedIn(false);
// 	// parse expiration date
// 	const expiration = parseInt(localStorage.expiration);
// 	if (!expiration)
// 		return setIsLoggedIn(false);
// 	let timeToExpiration = expiration - Date.now();
// 	// return if more than 60 seconds until expiry
// 	if (timeToExpiration > 60000)
// 		return setIsLoggedIn(true);
//
// 	const response = await fetch(`/refreshToken?refreshToken=${ encodeURIComponent(localStorage.refreshToken) }`);
// 	const newTokens = await response.json();
// 	if (newTokens["error"] || !newTokens["accessToken"]) {
// 		new Ph_Toast(Level.Error, "Error refreshing access token");
// 		console.error("Error refreshing access token");
// 		console.error(newTokens);
// 		return setIsLoggedIn(false);
// 	}
// 	localStorage.accessToken = newTokens.accessToken;
// 	if (newTokens.refreshToken)
// 		localStorage.refreshToken = newTokens.refreshToken;
// 	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
// 	console.log("successfully refreshed access token");
// 	return setIsLoggedIn(true);
// }
//
// export function isAccessTokenValid(): boolean {
// 	// check if token and expiration date are set
// 	if (!localStorage.accessToken || !localStorage.expiration || !isLoggedIn)
// 		return false;
// 	// parse expiration date
// 	const expiration = parseInt(localStorage.expiration);
// 	if (!expiration)
// 		return false;
// 	let timeToExpiration = expiration - Date.now();
// 	// valid if more than 5s left
// 	return timeToExpiration > 5000;
// }
//
// // check if token has expired every 30 seconds
// setInterval(checkTokenExpiry, 30000);
