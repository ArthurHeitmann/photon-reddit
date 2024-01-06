import {throttle} from "../utils/utils";
import Users from "../multiUser/userManagement";
import {RedditApiUsageRecord} from "../types/misc";
import {trackApiUsage} from "./photonApi";

export async function onApiUsage(endpoint: string, api: string, generalize = true, used: number|undefined = undefined, remaining: number|undefined = undefined) {
	if (generalize)
		endpoint = generalizeEndpoint(endpoint);
	const newRecord: RedditApiUsageRecord = {
		clientId: Users.global.d.analytics.clientId,
		timeMillisUtc: Date.now(),
		endpoint,
		api,
		used,
		remaining
	};
	let pendingUsages = Users.global.d.pendingRedditApiUsages;
	pendingUsages = [...pendingUsages, newRecord];
	await Users.global.set(["pendingRedditApiUsages"], pendingUsages);
	sendTrackedUsageThrottled();
}

async function sendTrackedUsages() {
	let pendingUsages = Users.global.d.pendingRedditApiUsages;
	await Promise.all([
		trackApiUsage(pendingUsages),
		Users.global.set(["pendingRedditApiUsages"], []),
	]);
}
const sendTrackedUsageThrottled = throttle(sendTrackedUsages, 1000 * 5, {leading: false, trailing: true});

function generalizeEndpoint(endpoint: string): string {
	// remove duplicate slashes
	endpoint = endpoint.replace(/\/+/g, "/");
	// remove everything after 8th slash
	const parts = endpoint.split("/");
	if (parts.length > 8)
		endpoint = parts.slice(0, 8).join("/");
	// /r/[subreddit] -> /r/...
	endpoint = endpoint.replace(/\/r\/[^/#?]+/g, "/r/[subreddit]");
	// /u|user/[username] -> /user/...
	endpoint = endpoint.replace(/\/u(ser)?\/[^/#?]+/g, "/user/[username]");
	// /comments/[...] -> /comments/...
	endpoint = endpoint.replace(/\/comments\/.+/g, "/comments/[...]");
	// /m/[multireddit] -> /m/...
	endpoint = endpoint.replace(/\/m\/[^/#?]+/g, "/m/[multi]");
	// /message/messages/[...] -> /message/messages/...
	endpoint = endpoint.replace(/\/message\/messages\/[^/#?]+/g, "/message/messages/[message]");
	return endpoint;
}
