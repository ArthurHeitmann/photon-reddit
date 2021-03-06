/**
 * Provides some global state functionality
 *  - is user logged in
 *  - logged in in user data
 *  	 - name
 *  	 - subscribed subreddits
 *  	 - multireddits,
 *  	 - number of unread messages
 *  - manage seen posts
 */

import { redditApiRequest } from "../api/redditApi.js";
import { RedditApiType } from "../types/misc.js";
import { stringSortComparer } from "./utils.js";

export let isLoggedIn: boolean = false;

export function setIsLoggedIn(newIsLoggedIn: boolean): boolean {
	return isLoggedIn = newIsLoggedIn;
}

export interface StoredData {
	data: any,
	lastUpdatedMsUTC: number
}

// this user data
const _MultiReddit = {
	display_name: "",
	path: ""
}
export type MultiReddit = typeof _MultiReddit;

/** Data about the currently logged in user */
export class User {
	name: string;
	subreddits: string[] = [];
	multireddits: MultiReddit[] = [];
	inboxUnread: number = 0;
	private static refreshEveryNMs = 2 * 60 * 60 * 1000;		// 2h

	/** fetch data from reddit and set properties */
	async fetch() {
		const userData = await redditApiRequest("/api/v1/me", [], true);
		thisUser.name = userData["name"];
		thisUser.inboxUnread = userData["inbox_count"];

		if (localStorage.subreddits) {
			try {
				const storedSubs: StoredData = JSON.parse(localStorage.subreddits);
				if (Date.now() - storedSubs.lastUpdatedMsUTC > User.refreshEveryNMs) {
					await this.fetchSubs();
				} else {
					this.subreddits = storedSubs.data;
				}
			} catch (e) {
				await this.fetchSubs();
			}
		}
		else
			await this.fetchSubs();

		if (localStorage.multis) {
			try {
				const storedMultis: StoredData = JSON.parse(localStorage.multis);
				if (Date.now() - storedMultis.lastUpdatedMsUTC > User.refreshEveryNMs) {
					await this.fetchMultis();
				} else {
					this.multireddits = storedMultis.data;
				}
			} catch (e) {
				await this.fetchMultis();
			}
		}
		else
			await this.fetchMultis();
	}

	private async fetchSubs() {
		const subs: RedditApiType = await redditApiRequest(
			"/subreddits/mine/subscriber",
			[["limit", "100"]],
			true
		);
		while(subs.data.after !== null) {
			const tmpSubs: RedditApiType = await redditApiRequest(
				"/subreddits/mine/subscriber",
				[["limit", "100"], ["after", subs.data.after]],
				true
			);
			subs.data.children.push(...tmpSubs.data.children);
			subs.data.after = tmpSubs.data.after;
		}
		this.subreddits = subs.data.children.map(subData => subData.data["display_name_prefixed"]).sort(stringSortComparer);

		localStorage.subreddits = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.subreddits
		});
	}

	private async fetchMultis() {
		this.multireddits = <MultiReddit[]>
			(await redditApiRequest("/api/multi/mine", [], true) as RedditApiType[])
				.map(multi => multi.data)						// simplify, by only using the data property
				.map(multi => Object.entries(multi))													// split
				.map(multi => multi.filter(entries => Object.keys(_MultiReddit).includes(entries[0])))		// remove all entries that are not part of MultiReddit
				.map(filteredEntries => Object.fromEntries(filteredEntries))							// join again

		localStorage.multis = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.multireddits
		});
	}
}

/** Data about the currently logged in user */
export let thisUser = new User();

// seen posts

// all the follow try/catches are necessary in case the user messes around with the localstorage
if (!localStorage.seenPosts)
	localStorage.seenPosts = "{}";
/** Map all seen posts; key: thing full name, value: time when thing was seen im ms */
export let seenPosts: { [fullName: string]: number };
try {
	seenPosts = JSON.parse(localStorage.seenPosts) || {};
}
catch (e) {
	localStorage.seenPosts = "{}";
	seenPosts = {};
}

export function saveSeenPosts() {
	try {
		// in case from another tab new posts have been seen
		const tmpSeenPosts = JSON.parse(localStorage.seenPosts);
		for (let [name, time] of Object.entries(tmpSeenPosts)) {
			if (!seenPosts[name])
				seenPosts[name] = time as number;
		}
	}
	catch (e) {}

	localStorage.seenPosts = JSON.stringify(seenPosts);
}
setTimeout(saveSeenPosts, 1000 * 60 * 10);
window.addEventListener("beforeunload", () => saveSeenPosts());

export function markPostAsSeen(postFullName: string) {
	seenPosts[postFullName] = Math.floor(Date.now() / 1000);
}

export function unmarkPostAsSeen(postFullName: string) {
	delete seenPosts[postFullName];
}

export function clearSeenPosts() {
	localStorage.seenPosts = "{}";
	seenPosts = {};
}

export function hasPostsBeenSeen(postFullName: string): boolean {
	return Boolean(seenPosts[postFullName]);
}
