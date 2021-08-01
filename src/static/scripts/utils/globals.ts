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

import { getMyMultis, getMySubs, redditApiRequest } from "../api/redditApi.js";
import Ph_UserDropDown from "../components/global/userDropDown/userDropDown.js";
import { RedditApiType } from "../types/misc.js";
import { $class } from "./htmlStatics.js";
import { nameOf, stringSortComparer } from "./utils.js";

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
	subredditsData: RedditApiType[] = [];
	multireddits: MultiReddit[] = [];
	multiredditsData: RedditApiType[] = [];
	private inboxUnreadIds: Set<string> = new Set();
	private static refreshEveryNMs = 1000 * 60 * 5;			// 5m

	/** fetch data from reddit and set properties */
	async fetch() {
		// get user data, subscribed subreddits, multireddits
		await Promise.all([
			this.tryLoadFromLocalStorage(nameOf<User>("subreddits"), "subreddits", this.fetchSubs.bind(this)),
			this.tryLoadFromLocalStorage(nameOf<User>("multireddits"), "multis", this.fetchMultis.bind(this)),
		]);
	}

	private async tryLoadFromLocalStorage(userProp: string, lsProp, onFails: () => Promise<void>) {
		try {
			const storedShort: StoredData = JSON.parse(localStorage[lsProp]);
			const storedData: StoredData = JSON.parse(localStorage[lsProp + "Data"]);
			this[userProp] = storedShort.data;
			this[userProp + "Data"] = storedData.data;
			if (Date.now() - storedShort.lastUpdatedMsUTC > User.refreshEveryNMs)
				await onFails();
		} catch (e) {
			await onFails();
		}
	}

	/** fetched by auth.ts to verify that the access token is valid */
	async fetchUser(): Promise<boolean> {
		const userData = await redditApiRequest("/api/v1/me", [], false);
		if ("error" in userData)
			return false;
		thisUser.name = userData["name"] || "";
		return true;
	}

	private async fetchSubs() {
		const subs: RedditApiType = await getMySubs(100);
		while(subs.data.after !== null) {
			const tmpSubs: RedditApiType = await getMySubs(100, subs.data.after);
			subs.data.children.push(...tmpSubs.data.children);
			subs.data.after = tmpSubs.data.after;
		}
		this.subreddits = subs.data.children.map(subData => subData.data["display_name_prefixed"]).sort(stringSortComparer);
		this.subredditsData = subs.data.children.sort(
			(a, b) => stringSortComparer(a.data["display_name"], b.data["display_name"]));

		localStorage.subreddits = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.subreddits
		});
		localStorage.subredditsData = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.subredditsData
		});
	}

	private async fetchMultis() {
		const multis = await getMyMultis() as RedditApiType[];
		this.multiredditsData = multis;
		this.multireddits = <MultiReddit[]> multis
				.map(multi => multi.data)																// simplify, by only using the data property
				.map(multi => Object.entries(multi))													// split
				.map(multi => multi.filter(entries => Object.keys(_MultiReddit).includes(entries[0])))	// remove all entries that are not part of MultiReddit
				.map(filteredEntries => Object.fromEntries(filteredEntries))							// join again

		localStorage.multis = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.multireddits
		});
		localStorage.multisData = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.multiredditsData
		});
	}

	setInboxIdsUnreadState(inboxItemIds: string[], isUnread: boolean): void {
		for (const id of inboxItemIds)
			this.setInboxIdUnreadState(id, isUnread);
	}

	setInboxIdUnreadState(inboxItemId: string, isUnread: boolean): void {
		if (isUnread)
			this.inboxUnreadIds.add(inboxItemId);
		else
			this.inboxUnreadIds.delete(inboxItemId);

		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(this.getInboxUnreadCount());
	}

	setAllInboxIdsAsRead() {
		this.inboxUnreadIds.clear();
		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(0);
	}

	getInboxUnreadCount(): number {
		return this.inboxUnreadIds.size;
	}
}

/** Data about the currently logged in user */
export let thisUser = new User();

// seen posts

// all the follow try/catches are necessary in case the user messes around with the localstorage
if (!localStorage.seenPosts)
	localStorage.seenPosts = "{}";
/** Map all seen posts; key: thing full name, value: time when thing was seen in s */
export let seenPosts: { [fullName: string]: number };
try {
	seenPosts = JSON.parse(localStorage.seenPosts) || {};
}
catch (e) {
	localStorage.seenPosts = "{}";
	seenPosts = {};
}

export function saveSeenPosts(syncFirst = true) {
	if (syncFirst) {
		try {
			// in case from another tab new posts have been seen
			const tmpSeenPosts = JSON.parse(localStorage.seenPosts);
			for (const [name, time] of Object.entries(tmpSeenPosts)) {
				if (!seenPosts[name]) {
					seenPosts[name] = time as number;
				}
			}
		} catch (e) {}
	}

	localStorage.seenPosts = JSON.stringify(seenPosts);
}
setTimeout(saveSeenPosts, 1000 * 30);
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

// page ready

let isPageReady = false;

export function ensurePageLoaded(): Promise<void> {
	return new Promise(resolve => {
		if (isPageReady) {
			isPageReady = true;
			resolve();
		}
		else {
			window.addEventListener(
				"ph-page-ready",
				() => {
					isPageReady = true;
					resolve();
				},
				{ once: true }
			);
		}
	})
}
