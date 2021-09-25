import { redditApiRequest } from "../../api/redditApi";
import { StoredData } from "../../types/misc";
import { RedditPreferences, RedditUserInfo } from "../../types/redditTypes";
import { $class } from "../../utils/htmlStatics";
import { MultiManager } from "../../utils/MultiManager";
import { SubredditManager } from "../../utils/subredditManager";
import { deepClone } from "../../utils/utils";
import { StoredFeedInfo } from "../feed/feedInfo/feedInfo";
import { defaultSettings } from "../global/photonSettings/photonSettings";
import Ph_UserDropDown from "../global/userDropDown/userDropDown";
import { initialDefaultFabPresets } from "../photon/fab/fabElementConfig";
import DataAccessor from "./dataAccessor";
import { _GlobalOrUserData } from "./globalData";
import { setInStorage, wasDbUpgraded } from "./storageWrapper";
import Users from "./userManagement";

export const guestUserName = "#guest";

export default class UserData extends DataAccessor<_UserData> {
	protected key: string;
	protected default: _UserData = {
		auth: {
			accessToken: null,
			refreshToken: null,
			expiration: null,
			scopes: null,
			pageBeforeLogin: null,
			loginTime: null,
			isLoggedIn: false,
			loginCode: null
		},
		caches: {
			subs: null,
			multis: null,
			feedInfos: {}
		},
		fabConfig: deepClone(initialDefaultFabPresets),
		loginSubPromptDisplayed: false,
		photonSettings: deepClone(defaultSettings),
		redditPreferences: undefined,
		seenPosts: {}
	};
	subreddits = new SubredditManager();
	multireddits = new MultiManager();
	name: string;
	private inboxUnreadIds: Set<string> = new Set();

	constructor(name: string) {
		super();

		this.key = `u/${name}`;
		this.name = name;
	}

	async init(): Promise<this> {
		await super.init();
		if (wasDbUpgraded.wasUpgraded) {
			this.tryMigrateFromLsToLoaded(["fabConfig"], ["fabConfig"]);
			this.tryMigrateFromLsToLoaded(["seenPosts"], ["seenPosts"]);
			this.tryMigrateFromLsToLoaded(["settings"], ["photonSettings"]);
			this.tryMigrateFromLsToLoaded(["accessToken"], ["auth", "accessToken"]);
			this.tryMigrateFromLsToLoaded(["expiration"], ["auth", "expiration"]);
			this.tryMigrateFromLsToLoaded(["isLoggedIn"], ["auth", "isLoggedIn"]);
			this.tryMigrateFromLsToLoaded(["loginTime"], ["auth", "loginTime"]);
			this.tryMigrateFromLsToLoaded(["refreshToken"], ["auth", "refreshToken"]);
			this.tryMigrateFromLsToLoaded(["pageBeforeLogin"], ["auth", "pageBeforeLogin"]);
			this.tryMigrateFromLsToLoaded(["scope"], ["auth", "scopes"]);
			this.tryMigrateFromLsToLoaded(["loginRecommendationFlag"], ["loginSubPromptDisplayed"], val => val === "set");
			await setInStorage(this.loaded, this.key);
		}
		return this;
	}

	async fetchName(): Promise<boolean> {
		const userData: RedditUserInfo = await redditApiRequest("/api/v1/me", [], false);
		if ("error" in userData)
			return false;
		this.name = userData.name || "";
		// if was previously guest (migrated from LS)
		if (this.name && this.key.endsWith(guestUserName)) {
			await this.changeKey(`u/${this.name}`);
			await Users.global.set(["lastActiveUser"], this.name);
		}
		return true;
	}

	async fetchUserData(): Promise<void> {
		await Promise.all([
			Users.current.subreddits.load(),
			Users.current.subreddits.load(),
			Users.current.multireddits.load(),
		]);
	}

	hasPostsBeenSeen(postFullName: string): boolean {
		return postFullName in this.d.seenPosts
	}

	async markPostAsSeen(postFullName: string) {
		await this.set(["seenPosts", postFullName], Math.floor(Date.now() / 1000));
	}

	async unmarkPostAsSeen(postFullName: string) {
		delete this.loaded.seenPosts[postFullName];
		await this.set(["seenPosts"], this.loaded.seenPosts);
	}

	async clearSeenPosts() {
		await this.set(["seenPosts"], {});
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

/**
 * This data is user specific
 */
interface _UserData extends _GlobalOrUserData {
	/** Information for OAuth and login state */
	auth: AuthData;
	/** The users reddit.com preferences */
	redditPreferences: RedditPreferences;
	/** If false, after logging in a info is displayed to subscribe to r/photon_reddit */
	loginSubPromptDisplayed: boolean;
	caches: QuickCaches;
}

interface AuthData {
	accessToken: string,
	refreshToken?: string,
	expiration: number,
	isLoggedIn: boolean,
	scopes: string,
	loginTime: number,
	pageBeforeLogin: string,
	loginCode: string
}

export interface QuickCaches {
	subs: StoredData<any[]> | null,
	multis: StoredData<any[]> | null,
	feedInfos: { [url: string]: StoredFeedInfo<any> }
}
