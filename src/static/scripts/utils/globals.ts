import { redditApiRequest } from "../api/api.js";
import { RedditApiType } from "./types.js";

export let isLoggedIn: boolean = false;

export function setIsLoggedIn(newIsLoggedIn: boolean): boolean {
	return isLoggedIn = newIsLoggedIn;
}

interface StoredData {
	data: any,
	lastUpdatedMsUTC: number
}

const _MultiReddit = {
	display_name: "",
	icon_url: "",
	subreddits: [""],
	visibility: "",
	over_18: false,
}
type MultiReddit = typeof _MultiReddit;

export class User {
	name: string;
	subreddits: string[] = [];
	multiReddits: MultiReddit[] = [];
	private static refreshEveryNMs = 2 * 60 * 60 * 1000;

	async fetch() {
		thisUser.name = (await redditApiRequest("/api/v1/me", [], true))["name"];

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
					this.multiReddits = storedMultis.data;
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
		this.subreddits = subs.data.children.map(subData => subData.data["display_name_prefixed"]).sort();

		localStorage.subreddits = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.subreddits
		});
	}

	private async fetchMultis() {
		// my first attempt at functional programming lol
		(this.multiReddits = <MultiReddit[]>
			(await redditApiRequest("/api/multi/mine", [], true) as RedditApiType[])
				.map(multi => multi.data)						// simplify, by only using the data property
				.map(multi => Object.entries(multi))													// split
				.map(multi => multi.filter(entries => Object.keys(_MultiReddit).includes(entries[0])))		// remove all entries that are not part of MultiReddit
				.map(filteredEntries => Object.fromEntries(filteredEntries)))							// join again
			.forEach(multi => multi.subreddits = multi.subreddits.map(subs => subs["name"]));			// fix subreddits

		localStorage.multis = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.multiReddits
		});
	}
}

export let thisUser = new User();
