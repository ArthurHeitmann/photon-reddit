import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { isLoggedIn, setIsLoggedIn } from "../utils/globals.js";

export function initiateLogin() {
	location.href = "/login";
}

/**
 * @returns true: access token is still valid or was just successfully updates; 
 * 		    false: no access token is set or couldn't be renewed
 */
export async function checkTokenExpiry(): Promise<boolean> {
	// check if token and expiration date are set

	if (!localStorage.accessToken || !localStorage.expiration)
		return setIsLoggedIn(false);
	// parse expiration date
	const expiration = parseInt(localStorage.expiration);
	if (!expiration)
		return setIsLoggedIn(false);
	let timeToExpiration = expiration - Date.now();
	// return if more than 60 seconds until expiry
	if (timeToExpiration > 60000)
		return setIsLoggedIn(true);
	
	const response = await fetch(`/refreshToken?refreshToken=${ encodeURIComponent(localStorage.refreshToken) }`);
	const newTokens = await response.json();
	if (newTokens["error"] || !newTokens["accessToken"]) {
		new Ph_Toast(Level.Error, "Error refreshing access token");
		console.error("Error refreshing access token");
		console.error(newTokens);
		return setIsLoggedIn(false);
	}
	localStorage.accessToken = newTokens.accessToken;
	if (newTokens.refreshToken)
		localStorage.refreshToken = newTokens.refreshToken;
	localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
	console.log("successfully refreshed access token");
	return setIsLoggedIn(true);
}

export function isAccessTokenValid(): boolean {
	// check if token and expiration date are set
	if (!localStorage.accessToken || !localStorage.expiration || !isLoggedIn)
		return false;
	// parse expiration date
	const expiration = parseInt(localStorage.expiration);
	if (!expiration)
		return false;
	let timeToExpiration = expiration - Date.now();
	// valid if more than 5s left
	return timeToExpiration > 5000;
}

// check if token has expired every 30 seconds
setInterval(checkTokenExpiry, 30000);
