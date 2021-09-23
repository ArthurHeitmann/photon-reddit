import { RedditPreferences } from "../../types/redditTypes";
import { MultiManager } from "../../utils/MultiManager";
import { SubredditManager } from "../../utils/subredditManager";
import { PhotonSettings } from "../global/photonSettings/photonSettings";
import { FabPreset } from "../photon/fab/fabElementConfig";
import { SeenPosts } from "./globalData";

export default class UserData {
	caches = {
		subreddits: new SubredditManager(),
		multireddits: new MultiManager()
	}
}

interface _UserData {
	// always user
	auth: AuthData;
	redditPreferences: RedditPreferences;
	inboxUnreadCount: number;
	// user or global fallback
	fabConfig: FabPreset;
	photonSettings: PhotonSettings;
	seenPosts: SeenPosts;
}

interface AuthData {
	accessToken: string,
	refreshToken?: string,
	expiration: number,
	isLoggedIn: boolean,
	scopes: string,
	logInTime: number,
	pageBeforeLogin: string
}
