import { config } from "dotenv";

export const env = process.env.NODE_ENV || "development";
if (env !== "production")
	config();

export const port = process.env.PORT || 8080;
export const __dirname = process.cwd();
export const tokenDuration = "permanent";
export const scope = ["account", "creddits", "edit", "flair", "history", "identity", "livemanage", "modconfig", "modcontributors", "modflair", "modlog", "modmail", "modothers", "modposts", "modself", "modtraffic", "modwiki", "mysubreddits", "privatemessages", "read", "report", "save", "structuredstyles", "submit", "subscribe", "vote", "wikiedit", "wikiread"];

// Configure middlewares
export const commonRateLimitConfig = {
	message: "A little fast hugh?",
	headers: false
}
export const basicRateLimitConfig = {
	windowMs: 30 * 1000,		// in a timeframe of 30s
	max: 30,					// 30 requests are allowed
	...commonRateLimitConfig
};
export const redditTokenRateLimitConfig = {
	windowMs: 60 * 1000,
	max: 5,
	...commonRateLimitConfig
};
export const analyticsRateLimitConfig = {
	windowMs: 40 * 1000,
	max: 15,
	...commonRateLimitConfig
};
export const youtube_dlRateLimitConfig = {
	windowMs: 30 * 1000,
	max: 40,
	...commonRateLimitConfig
};
