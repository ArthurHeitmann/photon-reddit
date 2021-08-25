import { getMySubs, redditInfo, subscribe } from "../api/redditApi";
import { RedditApiType } from "../types/misc";
import { StoredData, User } from "./globals";
import { stringSortComparer } from "./utils";

export interface SubscriptionChangeEvent {
	subreddit: RedditApiType,
	isUserSubscribed: boolean,
	index: number
}
export type OnSubscriptionChangeCallback = (e: SubscriptionChangeEvent) => void;

export class SubredditManager {
	private subreddits: RedditApiType[] = [];
	private changeSubscribers: OnSubscriptionChangeCallback[] = [];

	async loadSubreddits() {
		try {
			const storedData: StoredData = JSON.parse(localStorage["subreddits"]);
			this.subreddits = storedData.data;
			if (Date.now() - storedData.lastUpdatedMsUTC > User.refreshEveryNMs)
				await this.fetchSubreddits();
		} catch (e) {
			await this.fetchSubreddits();
		}
	}

	private async fetchSubreddits() {
		const subs: RedditApiType = await getMySubs(100);
		while(subs.data.after !== null) {
			const tmpSubs: RedditApiType = await getMySubs(100, subs.data.after);
			subs.data.children.push(...tmpSubs.data.children);
			subs.data.after = tmpSubs.data.after;
		}

		this.subreddits = subs.data.children.sort(SubredditManager.subredditsSort);
		this.cacheSubreddits();
	}

	isSubscribedTo(subreddit: string): boolean {
		return this.subreddits.findIndex(sub => sub.data["display_name"] === subreddit) !== -1;
	}

	/** @return success */
	async setIsSubscribed(subredditFullName: string, isSubscribed): Promise<boolean> {
		const r = await subscribe(subredditFullName, isSubscribed);
		if (!r)
			return false;
		if (isSubscribed) {
			const subInfo = await redditInfo(subredditFullName);
			if (!subInfo)
				return false;
			this.subreddits.push(subInfo);
			this.subreddits.sort(SubredditManager.subredditsSort);
			const currentSubIndex = this.subreddits.findIndex(sub => sub.data["name"] === subredditFullName);
			this.dispatchSubscriptionChange(subInfo, true, currentSubIndex);
		}
		else {
			const currentSubIndex = this.subreddits.findIndex(sub => sub.data["name"] === subredditFullName);
			if (currentSubIndex === -1)
				return false;
			const subredditData = this.subreddits[currentSubIndex];
			this.subreddits.splice(currentSubIndex, 1);
			this.dispatchSubscriptionChange(subredditData, false, currentSubIndex);
		}
		this.cacheSubreddits();
		return true;
	}

	listenForSubscriptionChanges(handler: OnSubscriptionChangeCallback) {
		this.changeSubscribers.push(handler);
	}

	disconnectListener(handler: OnSubscriptionChangeCallback) {
		const index = this.changeSubscribers.findIndex(listener => listener === handler);
		if (index !== -1)
			this.changeSubscribers.splice(index, 1);
	}

	private dispatchSubscriptionChange(subreddit: RedditApiType, isUserSubscribed: boolean, index: number) {
		const event: SubscriptionChangeEvent = {
			subreddit, isUserSubscribed, index
		};
		for (const handler of this.changeSubscribers)
			handler(event);
	}

	get rawData(): RedditApiType[] {
		return this.subreddits;
	}

	private cacheSubreddits() {
		localStorage.subreddits = JSON.stringify(<StoredData> {
			lastUpdatedMsUTC: Date.now(),
			data: this.subreddits
		});
	}

	private static subredditsSort(a, b) {
		return stringSortComparer(a.data["display_name"], b.data["display_name"]);
	}
}