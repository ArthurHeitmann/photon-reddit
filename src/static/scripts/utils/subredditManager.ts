import { getMySubs, redditInfo, subscribe } from "../api/redditApi";
import { RedditApiObj, RedditSubredditObj } from "../types/redditTypes";
import { StoredData, User } from "./globals";
import { UserSubscriptions } from "./UserSubscriptions";
import { stringSortComparer } from "./utils";

export interface SubscriptionChangeEvent {
	subreddit: RedditApiObj,
	isUserSubscribed: boolean,
	index: number
}

export class SubredditManager extends UserSubscriptions<RedditSubredditObj, SubscriptionChangeEvent> {

	async load() {
		try {
			const storedData: StoredData<RedditSubredditObj[]> = JSON.parse(localStorage.subreddits);
			this.userContent = storedData.data;
			if (Date.now() - storedData.lastUpdatedMsUTC > User.refreshEveryNMs)
				await this.fetchSubreddits();
		} catch (e) {
			await this.fetchSubreddits();
		}
	}

	private async fetchSubreddits() {
		const subs = await getMySubs(100);
		while(subs.data.after !== null) {
			const tmpSubs = await getMySubs(100, subs.data.after);
			subs.data.children.push(...tmpSubs.data.children);
			subs.data.after = tmpSubs.data.after;
		}

		this.userContent = subs.data.children.sort(SubredditManager.subredditsSort);
		this.cacheSubreddits();
	}

	isSubscribedTo(subreddit: string): boolean {
		return this.userContent.findIndex(sub => sub.data.display_name === subreddit) !== -1;
	}

	/** @return success */
	async setIsSubscribed(subredditFullName: string, isSubscribed): Promise<boolean> {
		const r = await subscribe(subredditFullName, isSubscribed);
		if (!r)
			return false;
		if (isSubscribed) {
			const subInfo = await redditInfo(subredditFullName) as RedditSubredditObj;
			if (!subInfo)
				return false;
			this.userContent.push(subInfo);
			this.userContent.sort(SubredditManager.subredditsSort);
			const currentSubIndex = this.userContent.findIndex(sub => sub.data.name === subredditFullName);
			this.dispatchChange({ subreddit: subInfo, isUserSubscribed: true, index: currentSubIndex });
		}
		else {
			const currentSubIndex = this.userContent.findIndex(sub => sub.data.name === subredditFullName);
			if (currentSubIndex === -1)
				return false;
			const subredditData = this.userContent[currentSubIndex];
			this.userContent.splice(currentSubIndex, 1);
			this.dispatchChange({ subreddit: subredditData, isUserSubscribed: false, index: currentSubIndex });
		}
		this.cacheSubreddits();
		return true;
	}

	private cacheSubreddits() {
		localStorage.subreddits = JSON.stringify(<StoredData<RedditSubredditObj[]>> {
			lastUpdatedMsUTC: Date.now(),
			data: this.userContent
		});
	}

	private static subredditsSort(a, b) {
		return stringSortComparer(a.data.display_name, b.data.display_name);
	}
}