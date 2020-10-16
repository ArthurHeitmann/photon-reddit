import { checkTokenExpiry } from "../login/login.js";
import { splitPathQuery } from "../utils/conv.js";

export async function oath2Request(pathAndQuery, params: string[][] = [], attempt = 0) {
	pathAndQuery = fixUrl(pathAndQuery);
	const [path, query] = splitPathQuery(pathAndQuery);

	const parameters = new URLSearchParams(query);
	for (const param of params)
		parameters.append(param[0], param[1]);
	parameters.append("raw_json", "1");
	const fetchOptions = { 
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
			return await oath2Request(path, params, attempt + 1);
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

// probably not needed
// export async function subredditPosts(
// 	subreddit: string, 
// 	options: string[][] = [],
// 	sort: sortPosts = sortPosts.default, 
// 	time: sortPostsTime = sortPostsTime.default,
// ) {
// 	return await oath2Request(`${ subreddit }/${ sort }`, 
// 		sort && sort == sortPosts.top 
// 		? 
// 		[...options, ["t", time]]
// 		: 
// 		options
// 	);
// }
