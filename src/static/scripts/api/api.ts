async function oath2Request(path, params: string[][] = []): Promise<Object> {
	const parameters = new URLSearchParams(params);
	const fetchOptions = { 
		headers: {
			Authorization: `Bearer ${ localStorage["accessToken"] }`
		},
	};
	try {
		const response = await fetch(`https://oauth.reddit.com/${ path }?${ parameters.toString() }`, fetchOptions);
		return await response.json();
	} catch (e) {
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
	sort: sortPosts = sortPosts.default, 
	time: sortPostsTime = sortPostsTime.default
) {
	return await oath2Request(`${ subreddit }/${ sort }`, 
		sort && sort == sortPosts.top 
		? 
		[["t", time]]
		: 
		[]
	);
}

