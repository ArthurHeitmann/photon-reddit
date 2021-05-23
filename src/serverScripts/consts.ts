import { config } from "dotenv";
import { Options as rlOptions } from "express-rate-limit";

export const env = process.env.NODE_ENV || "development";
if (env !== "production")
	config();

export const port = process.env.PORT || 8080;
export const __dirname = process.cwd();

// Configure middlewares
export const commonRateLimitConfig: rlOptions = {
	message: "A little fast hugh?",
	headers: false
}
export const basicRateLimitConfig: rlOptions = {
	windowMs: 30 * 1000,		// in a timeframe of 30s
	max: 30,					// 30 requests are allowed
	...commonRateLimitConfig
};
export const analyticsRateLimitConfig: rlOptions = {
	windowMs: 40 * 1000,
	max: 15,
	...commonRateLimitConfig
};
export const youtube_dlRateLimitConfig: rlOptions = {
	windowMs: 30 * 1000,
	max: 40,
	...commonRateLimitConfig
};
