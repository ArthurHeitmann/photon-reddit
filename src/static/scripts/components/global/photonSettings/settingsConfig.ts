import {$class} from "../../../utils/htmlStatics";
import {makeElement} from "../../../utils/utils";
import {photonWebVersion} from "../../../utils/version";
import Users from "../../../multiUser/userManagement";
import Ph_Changelog from "../../photon/changelog/changelog";
import Ph_Tutorial from "../../photon/tutorial/tutorial";
import {FiltersSetting} from "./filtersSetting";
import Ph_PhotonSettings from "./photonSettings";
import {
	BooleanSetting,
	HTMLElementSetting,
	MultiOptionSetting,
	NumberSetting,
	SettingsApi,
	SettingsSection,
	TextSetting,
	TimeSetting
} from "./photonSettingsData";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import {SortPostsOrder, SortPostsOrderNamed} from "../../../types/misc";
import { resetAuthData } from "../../../auth/auth";

export enum ImageLoadingPolicy {
	alwaysPreview = "alwaysPreview",
	originalInFs = "originalInFs",
	alwaysOriginal = "alwaysOriginal",
}

export enum NsfwPolicy {
	never = "never",
	covered = "covered",
	always = "always",
}

export enum FeedDisplayType {
	cards = "cards",
	compact = "compact",
	grid = "grid",
	gridCompact = "gridCompact",
	individual = "individual",
}

export enum AllowIframesDecision {
	allow = "allow",
	block = "block",
	ask = "ask",
}

export enum UiTheme {
	light = "light",
	dark = "dark",
}

export interface PhotonSettings {
	imageLoadingPolicy?: ImageLoadingPolicy,
	loadInlineMedia?: boolean,
	firstShowControlBar?: boolean,
	imageLimitedHeight?: number,
	preferHigherVideoQuality?: boolean,
	autoplayVideos?: boolean,
	globalVideoVolume?: boolean,
	nsfwPolicy?: NsfwPolicy,
	markSeenPosts?: boolean,
	hideSeenPosts?: boolean,
	clearFeedCacheAfterMs?: number,
	clearSeenPostAfterMs?: number,
	enableFab?: boolean,
	isIncognitoEnabled?: boolean,
	tooltipsVisible?: boolean,
	messageCheckIntervalMs?: number,
	subredditBlacklist?: string[],
	userShortCacheTTLMs?: number,
	displayRedditEmojis?: boolean,
	emptyAreaClickGoesBack?: boolean
	userBlacklist?: string[],
	tileTextBlacklist?: string[],
	flairTextBlacklist?: string[],
	applyUserBlacklistToComments?: boolean,
	hidePostFlairs?: boolean,
	hidePostTitle?: boolean,
	hidePostTopInfo?: boolean,
	hidePostLeftBar?: boolean,
	hideCrosspostInfo?: boolean,
	hideSubredditMiniIcon?: boolean,
	feedWidth?: number
	postAndCommentsWidth?: number,
	beforeExitConfirmation?: boolean,
	autoCollapsePinnedComment?: boolean,
	altVolumeFunction?: boolean,
	animateFullscreenTransition?: boolean,
	feedDisplayType?: FeedDisplayType,
	allowIframes?: AllowIframesDecision,
	defaultFrontpageSort?: SortPostsOrder,
	highlightNewComments?: boolean,
	theme?: UiTheme,
	highlightSeenPosts?: boolean,
	absoluteTimestamps?: boolean,
	// useAltSubredditSearchApi?: boolean,
	customAppId?: string,
}

// default config
export const defaultSettings: PhotonSettings = {
	imageLoadingPolicy: ImageLoadingPolicy.originalInFs,
	loadInlineMedia: false,
	firstShowControlBar: true,
	imageLimitedHeight: 70,
	preferHigherVideoQuality: true,
	autoplayVideos: true,
	globalVideoVolume: true,
	nsfwPolicy: NsfwPolicy.covered,
	markSeenPosts: true,
	hideSeenPosts: false,
	clearFeedCacheAfterMs: 1000 * 60 * 60 * 2,
	clearSeenPostAfterMs: 1000 * 60 * 60 * 24 * 365,
	enableFab: true,
	isIncognitoEnabled: false,
	tooltipsVisible: true,
	messageCheckIntervalMs: 0,
	userShortCacheTTLMs: 1000 * 60 * 5,
	displayRedditEmojis: true,
	emptyAreaClickGoesBack: true,
	subredditBlacklist: [],
	userBlacklist: [],
	tileTextBlacklist: [],
	flairTextBlacklist: [],
	applyUserBlacklistToComments: false,
	hidePostFlairs: false,
	hidePostTitle: false,
	hidePostTopInfo: false,
	hidePostLeftBar: false,
	hideCrosspostInfo: false,
	hideSubredditMiniIcon: false,
	feedWidth: 50,
	postAndCommentsWidth: 60,
	beforeExitConfirmation: false,
	autoCollapsePinnedComment: false,
	altVolumeFunction: false,
	animateFullscreenTransition: false,
	feedDisplayType: FeedDisplayType.cards,
	allowIframes: AllowIframesDecision.ask,
	defaultFrontpageSort: SortPostsOrder.default,
	highlightNewComments: true,
	theme: UiTheme.dark,
	highlightSeenPosts: false,
	absoluteTimestamps: false,
	// useAltSubredditSearchApi: false,
	customAppId: "",
};

export const getSettingsSections = (): SettingsSection[] => [
	{
		name: "Post",
		iconUrl: "/img/post.svg",
		settings: [
			new BooleanSetting("markSeenPosts", "Mark seen posts", "Mark posts you have scrolled past. Seen posts are only stored in your browser.", SettingsApi.Photon),
			new BooleanSetting("hideSeenPosts", "Hide seen posts", "Hide posts marked as seen (above option). When viewing a user all posts are always visible.", SettingsApi.Photon),
			new TimeSetting({ allowRange: [1, Number.MAX_SAFE_INTEGER] }, "clearSeenPostAfterMs", "Store seen posts for", "Seen posts are stored for this time duration (format examples: 1y 13d, 6months 3 days, 1hour).", SettingsApi.Photon),
			new BooleanSetting("highlightSeenPosts", "Highlight seen posts", "Seen posts will appear darker.", SettingsApi.Photon),
			new MultiOptionSetting([
				{ text: "Cards", value: FeedDisplayType.cards },
				{ text: "Compact", value: FeedDisplayType.compact },
				{ text: "Grid", value: FeedDisplayType.grid },
				{ text: "Grid Compact", value: FeedDisplayType.gridCompact },
				{ text: "Individual", value: FeedDisplayType.individual },
			], "feedDisplayType", "Posts display type", "Cards: big posts, best compatibility (default) | Compact: old reddit inspired | Grid: for sensory overload | Individual: quick switching between threads", SettingsApi.Photon),
			new MultiOptionSetting([
				{ text: "Hide NSFW", value: NsfwPolicy.never },
				{ text: "Blur NSFW", value: NsfwPolicy.covered },
				{ text: "Show NSFW", value: NsfwPolicy.always },
			], "nsfwPolicy", "NSFW post visibility", "NSFW post visibility when viewing in feed. 1. Completely hidden 2. Blur + Warning on post 3. Normal visibility", SettingsApi.Photon),
			new MultiOptionSetting(Object.values(SortPostsOrder).map(value => (
				{ text: SortPostsOrderNamed[value], value: value }
			)), "defaultFrontpageSort", "Default Frontpage sort order", "Only applies when logged in", SettingsApi.Photon),
			new BooleanSetting("hideSubredditMiniIcon", "Hide small subreddit icon", "Enable to Hide a small icon next to the subreddit name", SettingsApi.Photon),
		]
	},
	{
		name: "Comments",
		iconUrl: "/img/commentEmpty.svg",
		settings: [
			new BooleanSetting("autoCollapsePinnedComment", "Auto collapse pinned comment", "For example auto mod comments", SettingsApi.Photon),
			new BooleanSetting("highlightNewComments", "Highlight new comments", "Highlight new comments since when revisiting a post", SettingsApi.Photon),
		]
	},
	{
		name: "Filters",
		iconUrl: "/img/filter.svg",
		settings: [
			new FiltersSetting("subredditBlacklist", "Subreddits", "Posts from these subreddits will be hidden. They are still visible when visiting the actual subreddit.", SettingsApi.Photon, input => input.replace(/^\/?r\//, "")),
			new FiltersSetting("userBlacklist", "Users", "Posts from these users will be hidden. They are still visible when visiting the users profile.", SettingsApi.Photon, input => input.replace(/^\/?(u|user)\//, "")),
			new BooleanSetting("applyUserBlacklistToComments", "Hide comments from filtered users", "", SettingsApi.Photon),
			new FiltersSetting("tileTextBlacklist", "Post Tile", "Posts where the title contains on of these keywords will be hidden.", SettingsApi.Photon),
			new FiltersSetting("flairTextBlacklist", "Flair", "Posts with flairs that contain on of these keywords will be hidden.", SettingsApi.Photon),
		]
	},
	{
		name: "Images",
		iconUrl: "/img/fileImage.svg",
		settings: [
			new MultiOptionSetting(
				[
					{ text: "Only previews", value: ImageLoadingPolicy.alwaysPreview },
					{ text: "Original in fullscreen", value: ImageLoadingPolicy.originalInFs },
					{ text: "Always originals", value: ImageLoadingPolicy.alwaysOriginal },
				], "imageLoadingPolicy", "Image quality", "Decide whether images in posts are loaded in max resolution or preview quality", SettingsApi.Photon
			),
		]
	},
	{
		name: "Videos",
		iconUrl: "/img/fileVideo.svg",
		settings: [
			new BooleanSetting("preferHigherVideoQuality", "Prefer higher video quality", "On: Use max resolution Off: Use lower resolution (if available) (360p, 480p)", SettingsApi.Photon),
			new BooleanSetting("autoplayVideos", "Autoplay videos", "Play videos when they are on screen.", SettingsApi.Photon),
			new BooleanSetting("globalVideoVolume", "Sync video volume", "When changing volume on video, sync volume to all other videos.", SettingsApi.Photon),
			new BooleanSetting("altVolumeFunction", "Finer volume control", "Volume initially grows slower (by x², volume: 0.0 - 1.0)", SettingsApi.Photon),
		]
	},
	{
		name: "UI",
		iconUrl: "/img/settings2.svg",
		settings: [
			new MultiOptionSetting(
				[
					{ text: "Dark", value: UiTheme.dark },
					{ text: "Light", value: UiTheme.light },
				], "theme", "Theme", "Requires reload", SettingsApi.Photon
			),
			new BooleanSetting("loadInlineMedia", "Expand media previews", "Expand previews for links with media (e.g. imgur.com/..., reddit.com/.../.png).", SettingsApi.Photon),
			new NumberSetting({ allowRange: [0, Number.MAX_SAFE_INTEGER] }, "imageLimitedHeight", "Max media height", "Set the maximum height for images/videos in % of screen height. Set height to \"0\" to disable height limits.", SettingsApi.Photon),
			new NumberSetting({ allowRange: [10, 200], allowFloats: true }, "feedWidth", "Posts feed width", "Width of posts in your feed. (Also used for messages, comments, etc.) (Unit is absolute)", SettingsApi.Photon),
			new NumberSetting({ allowRange: [10, 200], allowFloats: true }, "postAndCommentsWidth", "Comments view width", "Width when viewing a posts comments. (Unit is absolute)", SettingsApi.Photon),
			new BooleanSetting("displayRedditEmojis", "Display Reddit Emojis", "", SettingsApi.Photon),
			new BooleanSetting("firstShowControlBar", "Initially show bottom bar", "Initially show or hide controls bar on the bottom of images and videos.", SettingsApi.Photon),
			new BooleanSetting("enableFab", "Enable FAB", "Enable Floating Action Button (bottom left corner).", SettingsApi.Photon),
			new BooleanSetting("absoluteTimestamps", "Absolute Timestamps", "Display absolute timestamps instead of relative ones (Requires reload).", SettingsApi.Photon),
			new BooleanSetting("tooltipsVisible", "Show tooltips", "Toggle tooltips when hovering some UI elements.", SettingsApi.Photon),
			new BooleanSetting("animateFullscreenTransition", "Animate fullscreen transition", "", SettingsApi.Photon),
			new BooleanSetting("hidePostTitle", "Hide post titles", "", SettingsApi.Photon),
			new BooleanSetting("hidePostTopInfo", "Hide post general info", "Hide Subreddit, user, post time", SettingsApi.Photon),
			new BooleanSetting("hidePostFlairs", "Hide post flair", "", SettingsApi.Photon),
			new BooleanSetting("hidePostLeftBar", "Hide post left action bar", "", SettingsApi.Photon),
			new BooleanSetting("hideCrosspostInfo", "Hide crosspost info", "", SettingsApi.Photon),
		]
	},
	{
		name: "Reddit Prefs",
		iconUrl: "/img/settings2.svg",
		settings: [
			new HTMLElementSetting(makeElement("h3", {}, [
				makeElement("span", null, "Here are your Reddit Preferences from "),
				makeElement("a", {
					href: "https://old.reddit.com/prefs",
					target: "_blank",
					rel: "noopener",
					excludeLinkFromSpa: ""
				}, "https://old.reddit.com/prefs")
			])),
			new MultiOptionSetting([
				{ text: "Confidence", value: "confidence" },
				{ text: "Top", value: "top" },
				{ text: "New", value: "new" },
				{ text: "Controversial", value: "controversial" },
				{ text: "Old", value: "old" },
				{ text: "Random", value: "random" },
				{ text: "Q & A", value: "qa" },
				{ text: "Live", value: "live" },
			], "default_comment_sort", "Default Comment Sort", "", SettingsApi.Reddit),
			new BooleanSetting("enable_followers", "Enable Followers", "Allow people to follow you.", SettingsApi.Reddit),
			new BooleanSetting("hide_from_robots", "Hide Profile from Search Engines", "Hide your profile from search results (like Google, Bing, DuckDuckGo, ...)", SettingsApi.Reddit),
			new BooleanSetting("ignore_suggested_sort", "Ignore Suggested Sort", "Ignore suggested sort set by subreddit moderators.", SettingsApi.Reddit),
			new NumberSetting({ allowRange: [1, 500] }, "num_comments", "Number of Comments", "Number of comments to load when viewing a post.", SettingsApi.Reddit),
			new NumberSetting({ allowRange: [1, 100] }, "numsites", "Number of loaded Posts", "Number of posts loaded when viewing a subreddit or scrolling.", SettingsApi.Reddit),
			new BooleanSetting("over_18", "Over 18", "Enable to show NSFW posts", SettingsApi.Reddit),
			new BooleanSetting("search_include_over_18", "Include NSFW results in searches", "", SettingsApi.Reddit),
			new BooleanSetting("show_presence", "Show Online Status", "Other people can see if you are online.", SettingsApi.Reddit)
		]
	},
	{
		name: "Reddit Auth",
		iconUrl: "/img/key.svg",
		settings: [
			new TextSetting("customAppId", "Custom App ID", "To apply changes, click \"Reset Authentication Data\" below", SettingsApi.Photon, "paste your app id here"),
			new HTMLElementSetting(makeElement("p", {}, [
				makeElement("strong", {}, "You should create your own reddit app, to avoid problems with too many people using the official website or in case the official site stops working for some reason. It only only takes a few minutes. Here's is a short guide:")
			])),
			new HTMLElementSetting(makeElement("ol", {}, [
				makeElement("li", null, ["Go to ", makeElement("a", { href: "https://www.reddit.com/prefs/apps", target: "_blank" }, "https://www.reddit.com/prefs/apps")]),
				makeElement("li", null, "Click on \"Create App\""),
				makeElement("li", null, [
					"Fill out the form. Use the following values:",
					makeElement("ul", {}, [
						makeElement("li", null, "Name: My Own Reddit App"),
						makeElement("li", null, "App type: installed app (important)"),
						makeElement("li", null, "Description:"),
						makeElement("li", null, "About url:"),
						makeElement("li", null, "Redirect uri: https://photon-reddit.com/redirect"),
					]),
				]),
				makeElement("li", null, "Click on \"Create app\""),
				makeElement("li", null, "Copy the line with random characters underneath \"installed app\" (example: bZSh7oMYEQl7XP3c45OEdk)"),
				makeElement("li", null, "Paste the text into the field above"),
				makeElement("li", null, [
					"To apply the changes, click on the \"Reset Authentication Data\" button. This will log you out of any accounts you are currently logged in with and reload the page.",
					makeElement("button", {
						class: "button",
						onclick: async () => {
							if (Users.all.length > 1) {
								new Ph_Toast(Level.warning, `Log out ${Users.all.length - 1} account?`, {
									onConfirm: () => resetAuthData(true)
								});
							}
							else {
								resetAuthData(true);
							}
						}
					}, "Reset Authentication Data")
				]),
			])),
		]
	},
	{
		name: "Other",
		iconUrl: "/img/circle.svg",
		settings: [
			new BooleanSetting("emptyAreaClickGoesBack", "Click empty area to go back", "", SettingsApi.Photon),
			new BooleanSetting("isIncognitoEnabled", "Incognito mode", "Randomize the tab title & url.", SettingsApi.Photon),
			new BooleanSetting("beforeExitConfirmation", "Require exit confirmation", "Display warning when trying to leave page", SettingsApi.Photon),
			new MultiOptionSetting([
				{ text: "Ask", value: AllowIframesDecision.ask },
				{ text: "Allow", value: AllowIframesDecision.allow },
				{ text: "Block", value: AllowIframesDecision.block },
			], "allowIframes", "Allow embedded iframes", "Allow loading external websites (like YouTube or Twitter). These websites can potentially place cookies or track you.", SettingsApi.Photon),
			// new BooleanSetting("useAltSubredditSearchApi", "Use alternative subreddit search", "Use a different API for searching subreddits. (May be slower)", SettingsApi.Photon),
			new TimeSetting({ allowRange: [1, Number.MAX_SAFE_INTEGER] }, "clearFeedCacheAfterMs", "Subreddit info cache duration", "", SettingsApi.Photon),
			new TimeSetting({ allowRange: [1, Number.MAX_SAFE_INTEGER] }, "userShortCacheTTLMs", "Short Cache Duration", "For your subscriptions", SettingsApi.Photon),
			new TimeSetting({
				allowRange: [1000 * 60 * 5, Number.MAX_SAFE_INTEGER],
				allowList: [0]
			}, "messageCheckIntervalMs", "New messages checking interval", "Use \"0\" to disable. Min interval is 5 minutes. Message polling is only done while website is open.", SettingsApi.Photon),
			new HTMLElementSetting(makeElement("div", null, [
				makeElement("button", {
					class: "button",
					onclick: async () => {
						const seenPostsCount = Object.keys(Users.global.d.seenPosts).length;
						await Users.global.clearSeenPosts();
						new Ph_Toast(Level.success, `Cleared ${seenPostsCount} seen posts`, { timeout: 1500 });
					}
				}, "Clear seen posts"),
				makeElement("button", {
					class: "button",
					onclick: async () => {
						Promise.all([
							...Users.all.map(user => user.set(["caches"], {
								subs: null,
								multis: null,
								feedInfos: {},
							}))
						]).then(() => {
							new Ph_Toast(Level.success, "", { timeout: 1500 });
						});
					}
				}, "Clear Caches"),
				makeElement("button", { class: "button", onclick: () => Ph_Changelog.show() }, "Show Changelog"),
				makeElement("button", {
					class: "button", onclick() {
						($class("photonSettings")[0] as Ph_PhotonSettings).hide();
						new Ph_Tutorial();
					}
				}, "Start Tutorial"),
				makeElement("div", null, `v${photonWebVersion}`)
			])),
		]
	},
];
