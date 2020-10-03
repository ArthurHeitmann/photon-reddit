import { appId, redirectURI } from "../consts.js";

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