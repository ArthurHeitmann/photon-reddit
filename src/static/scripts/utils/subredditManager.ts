import { getMySubs, redditInfo, subscribe } from "../api/redditApi";
import Ph_Toast, { Level } from "../components/misc/toast/toast";
import { RedditSubredditObj } from "../types/redditTypes";
import { UserSubscriptions } from "./UserSubscriptions";
import { stringSortComparer } from "./utils";

export interface SubsChangeEvent {
	subreddit: RedditSubredditObj,
	isUserSubscribed: boolean,
	index: number
}

export class SubredditManager extends UserSubscriptions<RedditSubredditObj, SubsChangeEvent> {

	async load() {
		let cached = this.loadUserContentFromLs("subs");
		if (cached && "error" in cached)
			cached = null
		if (cached === null)
			await this.fetchSubreddits();
	}

	private async fetchSubreddits() {
		const subs = await getMySubs(100);
		if ("error" in subs) {
			new Ph_Toast(Level.error, "Error getting subreddits");
			return;
		}
		while(subs.data.after !== null) {
			const tmpSubs = await getMySubs(100, subs.data.after);
			if ("error" in tmpSubs)
				return;
			subs.data.children.push(...tmpSubs.data.children);
			subs.data.after = tmpSubs.data.after;
		}

		this.userContent = subs.data.children.sort(SubredditManager.subredditsSort);
		this.cacheUserContentLs("subs", true);
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
		this.cacheUserContentLs("subs", false);
		return true;
	}

	private static subredditsSort(a, b) {
		return stringSortComparer(a.data.display_name, b.data.display_name);
	}
}
