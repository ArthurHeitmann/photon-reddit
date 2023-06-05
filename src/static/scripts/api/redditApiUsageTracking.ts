import {throttle} from "../utils/utils";
import Users from "../multiUser/userManagement";
import {RedditApiUsageRecord} from "../types/misc";
import {trackRedditApiUsage} from "./photonApi";

export async function onRedditApiUsage(endpoint: string) {
	// remove everything after 5th slash
	const parts = endpoint.split("/");
	if (parts.length > 5)
		endpoint = parts.slice(0, 5).join("/");
	const newRecord: RedditApiUsageRecord = {
		clientId: Users.global.d.analytics.clientId,
		timeMillisUtc: Date.now(),
		endpoint,
	}
	let pendingUsages = Users.global.d.pendingRedditApiUsages;
	pendingUsages = [...pendingUsages, newRecord];
	await Users.global.set(["pendingRedditApiUsages"], pendingUsages);
	sendTrackedUsageThrottled();
}

async function sendTrackedUsages() {
	let pendingUsages = Users.global.d.pendingRedditApiUsages;
	await Promise.all([
		trackRedditApiUsage(pendingUsages),
		Users.global.set(["pendingRedditApiUsages"], []),
	]);
}
const sendTrackedUsageThrottled = throttle(sendTrackedUsages, 1000 * 5, {leading: false, trailing: true});
