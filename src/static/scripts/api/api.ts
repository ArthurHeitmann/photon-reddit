import Votable from "../components/misc/votable/votable.js";
import { checkTokenExpiry } from "../login/login.js";
import { splitPathQuery } from "../utils/conv.js";

export async function oath2Request(pathAndQuery, params: string[][] = [], options = {}, attempt = 0) {
	pathAndQuery = fixUrl(pathAndQuery);
	const [path, query] = splitPathQuery(pathAndQuery);

	const parameters = new URLSearchParams(query);
	for (const param of params)
		parameters.append(param[0], param[1]);
	parameters.append("raw_json", "1");
	const fetchOptions: RequestInit = {
		...options,
		headers: {
			Authorization: `Bearer ${ localStorage["accessToken"] }`
		},
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

function fixUrl(url: string) {
	return url.replace(/^\/u\//, "/user/");
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
		await oath2Request("/api/vote", [
			["dir", votable.currentVoteDirection], 
			["id", votable.votableId]
		],
		{ method: "POST" });
		return true
	} catch (error) {
		return false	
	}
}
