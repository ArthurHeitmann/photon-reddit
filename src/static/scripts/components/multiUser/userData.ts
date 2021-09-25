import { redditApiRequest } from "../../api/redditApi";
import { RedditPreferences, RedditUserInfo } from "../../types/redditTypes";
import { MultiManager } from "../../utils/MultiManager";
import { SubredditManager } from "../../utils/subredditManager";
import { deepClone } from "../../utils/utils";
import { initialDefaultFabPresets } from "../photon/fab/fabElementConfig";
import DataAccessor from "./dataAccessor";
import { _GlobalOrUserData } from "./globalData";
import { setInStorage, wasDbUpgraded } from "./storageWrapper";
import Users from "./userManagement";

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
		fabConfig: deepClone(initialDefaultFabPresets),
		loginSubPromptDisplayed: false,
		photonSettings: undefined,
		redditPreferences: undefined,
		seenPosts: {}
	};
	subreddits = new SubredditManager();
	multireddits = new MultiManager();
	inboxUnreadCount: number = 0;
	name: string;

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
			this.tryMigrateFromLsToLoaded(["scope"], ["auth", "scopes"]);
			this.tryMigrateFromLsToLoaded(["loginRecommendationFlag"], ["loginSubPromptDisplayed"], val => val === "set");
			await setInStorage(this.loaded, this.key);
		}
		return this;
	}

	async clearSeenPosts() {
		await this.set(["seenPosts"], {});
	}

	async fetchName(): Promise<boolean> {
		const userData: RedditUserInfo = await redditApiRequest("/api/v1/me", [], false);
		if ("error" in userData)
			return false;
		this.name = userData.name || "";
		return true;
	}

	async fetchUserData(): Promise<void> {
		await Promise.all([
			Users.current.subreddits.load(),
			Users.current.subreddits.load(),
			Users.current.multireddits.load(),
		]);
	}
}

/**
 * This data is user specific
 */
interface _UserData extends _GlobalOrUserData {
	// always user
	/** Information for OAuth and login state */
	auth: AuthData;
	/** The users reddit.com preferences */
	redditPreferences: RedditPreferences;
	/** If false, after logging in a info is displayed to subscribe to r/photon_reddit */
	loginSubPromptDisplayed: boolean;
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
