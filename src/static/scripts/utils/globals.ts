// /**
//  * Provides some global state functionality
//  *  - is user logged in
//  *  - logged in in user data
//  *  	 - name
//  *  	 - subscribed subreddits
//  *  	 - multireddits,
//  *  	 - number of unread messages
//  *  - manage seen posts
//  */
//
// import { redditApiRequest } from "../api/redditApi";
// import Ph_UserDropDown from "../components/global/userDropDown/userDropDown";
// import { RedditUserInfo } from "../types/redditTypes";
// import { $class } from "./htmlStatics";
// import { MultiManager } from "./MultiManager";
// import { SubredditManager } from "./subredditManager";
//
// export let isLoggedIn: boolean = false;
//
// export function setIsLoggedIn(newIsLoggedIn: boolean): boolean {
// 	return isLoggedIn = newIsLoggedIn;
// }
//
// export interface StoredData<T> {
// 	data: T,
// 	lastUpdatedMsUTC: number
// }
//
// // this user data
// const _MultiReddit = {
// 	display_name: "",
// 	path: ""
// }
// export type MultiReddit = typeof _MultiReddit;
//
// /** Data about the currently logged in user */
// export class User {
// 	name: string;
// 	subreddits = new SubredditManager();
// 	multireddits = new MultiManager();
// 	private inboxUnreadIds: Set<string> = new Set();
// 	static refreshEveryNMs = 1000 * 60 * 5;			// 5m
//
// 	/** fetch data from reddit and set properties */
// 	async fetch() {
// 		// get subscribed subreddits & multireddits
// 		await Promise.all([
// 			this.subreddits.load(),
// 			this.multireddits.load(),
// 		]);
// 	}
//
// 	/** fetched by auth.ts to verify that the access token is valid */
// 	async fetchUser(): Promise<boolean> {
// 		const userData: RedditUserInfo = await redditApiRequest("/api/v1/me", [], false);
// 		if ("error" in userData)
// 			return false;
// 		thisUser.name = userData.name || "";
// 		return true;
// 	}
//
// 	setInboxIdsUnreadState(inboxItemIds: string[], isUnread: boolean): void {
// 		for (const id of inboxItemIds)
// 			this.setInboxIdUnreadState(id, isUnread);
// 	}
//
// 	setInboxIdUnreadState(inboxItemId: string, isUnread: boolean): void {
// 		if (isUnread)
// 			this.inboxUnreadIds.add(inboxItemId);
// 		else
// 			this.inboxUnreadIds.delete(inboxItemId);
//
// 		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(this.getInboxUnreadCount());
// 	}
//
// 	setAllInboxIdsAsRead() {
// 		this.inboxUnreadIds.clear();
// 		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(0);
// 	}
//
// 	getInboxUnreadCount(): number {
// 		return this.inboxUnreadIds.size;
// 	}
// }
//
// /** Data about the currently logged in user */
// export let thisUser = new User();
//
// // seen posts
//
// // all the follow try/catches are necessary in case the user messes around with the localstorage
// if (!localStorage.seenPosts)
// 	localStorage.seenPosts = "{}";
// /** Map all seen posts; key: thing full name, value: time when thing was seen in s */
// export let seenPosts: { [fullName: string]: number };
// try {
// 	seenPosts = JSON.parse(localStorage.seenPosts) || {};
// }
// catch (e) {
// 	localStorage.seenPosts = "{}";
// 	seenPosts = {};
// }
//
// export function saveSeenPosts(syncFirst = true) {
// 	if (syncFirst) {
// 		try {
// 			// in case from another tab new posts have been seen
// 			const tmpSeenPosts = JSON.parse(localStorage.seenPosts);
// 			for (const [name, time] of Object.entries(tmpSeenPosts)) {
// 				if (!seenPosts[name]) {
// 					seenPosts[name] = time as number;
// 				}
// 			}
// 		} catch (e) {}
// 	}
//
// 	localStorage.seenPosts = JSON.stringify(seenPosts);
// }
// setTimeout(saveSeenPosts, 1000 * 30);
// window.addEventListener("beforeunload", () => saveSeenPosts());
//
// export function markPostAsSeen(postFullName: string) {
// 	seenPosts[postFullName] = Math.floor(Date.now() / 1000);
// }
//
// export function unmarkPostAsSeen(postFullName: string) {
// 	delete seenPosts[postFullName];
// }
//
// export function clearSeenPosts() {
// 	localStorage.seenPosts = "{}";
// 	seenPosts = {};
// }
//
// export function hasPostsBeenSeen(postFullName: string): boolean {
// 	return Boolean(seenPosts[postFullName]);
// }
//
// // page ready
//