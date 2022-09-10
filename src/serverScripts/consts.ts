import {config} from "dotenv";
import {Options as rlOptions} from "express-rate-limit";

export const env = process.env.NODE_ENV || "development";
if (env !== "production")
	config();

export const port = process.env.PORT || 8080;
export const __dirname = process.cwd();

// Configure middlewares
export const commonRateLimitConfig: Partial<rlOptions> = {
	message: "A little fast hugh?",
	legacyHeaders: false,
	// standardHeaders: true,
}
export const basicRateLimitConfig: Partial<rlOptions> = {
	...commonRateLimitConfig,
	windowMs: 30 * 1000,		// in a timeframe of 30s
	max: 30,					// 30 requests are allowed
};
export const analyticsRateLimitConfig: Partial<rlOptions> = {
	...commonRateLimitConfig,
	windowMs: 40 * 1000,
	max: 15,
};
export const youtube_dlRateLimitConfig: Partial <rlOptions> = {
	...commonRateLimitConfig,
	windowMs: 30 * 1000,
	max: 40,
};
export const proxyRateLimitConfig: Partial <rlOptions> = {
	...commonRateLimitConfig,
	windowMs: 30 * 1000,
	max: 45,
};

export const tokenRequestRateLimitConfig: Partial<rlOptions> = {
	...commonRateLimitConfig,
	windowMs: 60 * 60 * 1000,
	max: 12,
};
