import Ph_Toast, { Level } from "../components/misc/toast/toast.js";
import Votable from "../components/misc/votable/votable.js";
import { checkTokenExpiry } from "../login/login.js";
import { isLoggedIn } from "../utils/globals.js";
import { splitPathQuery } from "../utils/utils.js";

export async function redditApiRequest(pathAndQuery, params: string[][], requiresLogin: boolean, options = {}) {
	if (requiresLogin && !isLoggedIn) {
		new Ph_Toast(Level.Error, "You need to be logged in tu use this feature");
		throw "This feature requires te be logged in";
	}

	if (requiresLogin || isLoggedIn)
		return  await oath2Request(pathAndQuery, params, options);
	else
		return  await simpleApiRequest(pathAndQuery, params);
}

async function simpleApiRequest(pathAndQuery, params: string[][]) {
	pathAndQuery = fixUrl(pathAndQuery);
	let [path, query] = splitPathQuery(pathAndQuery);
	path = path.replace(/\/?$/, "/.json")

	const parameters = new URLSearchParams(query);
	for (const param of params)
		parameters.append(param[0], param[1]);
	parameters.append("raw_json", "1");

	try {
		const response = await fetch(`https://www.reddit.com${path}?${parameters.toString()}`);
		return await response.json();
	} catch (e) {
		// maybe the token has expired, try to refresh it; try again up to 3 times
		return { error: e }
	}

}

async function oath2Request(pathAndQuery, params: string[][], options: Object, attempt = 0) {
	pathAndQuery = fixUrl(pathAndQuery, attempt);
	const [path, query] = splitPathQuery(pathAndQuery);

	const parameters = new URLSearchParams(query);
	for (const param of params)
		parameters.append(param[0], param[1]);
	parameters.append("raw_json", "1");
	const fetchOptions: RequestInit = {
		...options,
		headers: new Headers ({
			Authorization: `Bearer ${ localStorage["accessToken"] }`,
		}),
	};
	try {
		const response = await fetch(`https://oauth.reddit.com${ path }?${ parameters.toString() }`, fetchOptions);
		return await response.json();
	} catch (e) {
		// maybe the token has expired, try to refresh it; try again up to 3 times
		if (attempt < 3 && await checkTokenExpiry())
			return await oath2Request(path, params, options, attempt + 1);
		else
			return { error: e }
	}
}

function fixUrl(url: string, attempt = 0) {
	url = url.replace(/^\/u\//, "/user/");
	url = url.replace(/(\/(u|user)\/\w+\/)posts\/?/, "$1submitted/")
	if (attempt > 0)
		url = url.replace(/^\/user\/\w+\/m\//, "/me/m/")		// TODO do this by default if username == logged in user 
	return url;
}

export async function mySubreddits() {
	return await redditApiRequest("subreddits/mine/subscriber", [], true);
}

export enum VoteDirection {
	up = "1",
	down = "-1",
	none = "0"
}

export function voteDirectionFromLikes(likes: boolean) {
	switch (likes) {
		case null:
			return VoteDirection.none;
		case true:
			return VoteDirection.up;
		case false:
			return VoteDirection.down;
		default:
			throw "Invalid likes value";
	}
}

export async function vote(votable: Votable): Promise<boolean> {
	try {
		const resp = await redditApiRequest("/api/vote", [
			["dir", votable.currentVoteDirection], 
			["id", votable.votableId]
		],
		true, { method: "POST" });
		return Object.keys(resp).length === 0 && resp.constructor === Object;		// basically does what resp === {} should (but doesn't) do
	} catch (error) {
		return false	
	}
}

export async function save(votable: Votable): Promise<boolean> {
	try {
		const resp = await redditApiRequest(votable.isSaved ? "/api/save" : "/api/unsave", [
			["id", votable.votableId]
		],
		true, { method: "POST" });
		return Object.keys(resp).length === 0 && resp.constructor === Object;		// basically does what resp === {} should (but doesn't) do
	} catch (error) {
		return false	
	}
}
