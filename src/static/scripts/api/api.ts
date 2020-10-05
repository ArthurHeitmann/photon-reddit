import { checkTokenExpiry } from "../login/login.js";

export async function oath2Request(path, params: string[][] = [], attempt = 0) {
	const parameters = new URLSearchParams(params);
	parameters.append("raw_json", "1");
	const fetchOptions = { 
		headers: {
			Authorization: `Bearer ${ localStorage["accessToken"] }`
		},
	};
	try {
		const response = await fetch(`https://oauth.reddit.com/${ path }?${ parameters.toString() }`, fetchOptions);
		return await response.json();
	} catch (e) {
		// maybe the token has expired, try to refresh it; try again up to 3 times
		if (attempt < 3 && await checkTokenExpiry())
			return await oath2Request(path, params, attempt + 1);
		else
			return { error: e }
	}
}

export enum sortPosts {
	default = "",
	hot = "hot",
	new = "new",
	top = "top",
	rising = "rising",
	controversial = "controversial",
	gilded = "gilded",
}

export enum sortPostsTime {
	default = "",
	hour = "hour",
	day = "day",
	week = "week",
	month = "month",
	year = "year",
	all = "all",
}

export enum sortComments {
	default = "",
	best = "best",
	top = "top",
	new = "new",
	controversial = "controversial",
	old = "old",
	qa = "qa",
}

export async function mySubreddits() {
	return await oath2Request("subreddits/mine/subscriber");
}

export async function subredditPosts(
	subreddit: string, 
	options: string[][] = [],
	sort: sortPosts = sortPosts.default, 
	time: sortPostsTime = sortPostsTime.default,
) {
	return await oath2Request(`${ subreddit }/${ sort }`, 
		sort && sort == sortPosts.top 
		? 
		[...options, ["t", time]]
		: 
		options
	);
}
