import Votable from "../components/misc/votable/votable.js";
import { checkTokenExpiry } from "../login/login.js";
import { splitPathQuery } from "../utils/conv.js";

export async function oath2Request(pathAndQuery, params: string[][] = [], options = {}, attempt = 0) {
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
			"User-Agent": "web:reddit-photon:0.1 (by u/RaiderBV)"
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
	if (attempt > 0)
		url = url.replace(/^\/user\/\w+\/m\//, "/me/m/")		// TODO do this by default if username == logged in user 
	return url;
}

export async function mySubreddits() {
	return await oath2Request("subreddits/mine/subscriber");
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
			throw new Error("Invalid likes value");
	}
}

export async function vote(votable: Votable): Promise<boolean> {
	try {
		const resp = await oath2Request("/api/vote", [
			["dir", votable.currentVoteDirection], 
			["id", votable.votableId]
		],
		{ method: "POST" });
		return Object.keys(resp).length === 0 && resp.constructor === Object;		// basic does what resp === {} should (but doesn't) do
	} catch (error) {
		return false	
	}
}
