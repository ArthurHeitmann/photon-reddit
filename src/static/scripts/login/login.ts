import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import { appId, redirectURI } from "../utils/consts.js";
import { isLoggedIn, setIsLoggedIn } from "../utils/globals.js";

const tokenDuration = "permanent";
const scope = ["identity", "edit", "flair", "history", "modconfig", "modflair", "modlog", "modposts", "modwiki", "mysubreddits", "privatemessages", "read", "report", "save", "submit", "subscribe", "vote", "wikiedit", "wikiread"];

export function initiateLogin() {
	const requestURI = "https://www.reddit.com/api/v1/authorize?" + 
	`client_id=${ encodeURIComponent(appId) }&` +
	`response_type=code&` +
	`state=initialLogin&` +
	`redirect_uri=${ encodeURIComponent(redirectURI) }&` +
	`duration=${ tokenDuration }&` +
	`scope=${ encodeURIComponent(scope.join(" ")) }`;

	location.href = requestURI;
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
	const newTokenText = await response.text();
	const newToken = JSON.parse(newTokenText);
	if (newToken.accessToken) {
		localStorage.accessToken = newToken.accessToken;
		localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
		console.log("successfully refreshed access token");			// TODO remove
		return setIsLoggedIn(true);
	}
	else {
		console.error(`error getting new token (${newTokenText})`);
		new Ph_Toast(Level.Error, "Error updating access token");
		return setIsLoggedIn(false);
	}
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
checkTokenExpiry();
setInterval(checkTokenExpiry, 30000);
