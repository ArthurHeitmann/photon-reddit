import { config } from "dotenv";
const env = process.env.NODE_ENV || 'development';
if (env !== "production")
	config();

import express from "express";
import helmet from "helmet";
import RateLimit from "express-rate-limit";
import expressAsyncHandler from "express-async-handler";
import fetch from "node-fetch";
import { initialAccessToken, refreshAccessToken, appId, redirectURI } from "./serverScripts/loginRedirect.js";
import { analyticsRoute, eventsByTime, popularPathsByTime, uniqueClientsByTime } from "./serverScripts/analytics.js";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 8080;
const __dirname = process.cwd();
const tokenDuration = "permanent";
const scope = ["identity", "edit", "flair", "history", "modconfig", "modflair", "modlog", "modposts", "modwiki", "mysubreddits", "privatemessages", "read", "report", "save", "submit", "subscribe", "vote", "wikiedit", "wikiread"];

// Configure middlewares
const commonRateLimitConfig = {
	message: "A little fast hugh?",
	headers: false
}
const basicRateLimitConfig = {
	windowMs: 30 * 1000,
	max: 30,
	...commonRateLimitConfig
};
const redditTokenRateLimitConfig = {
	windowMs: 60 * 1000,
	max: 5,
	...commonRateLimitConfig
};
const getIframeSrcRateLimitConfig = {
	windowMs: 60 * 1000,
	max: 15,
	...commonRateLimitConfig
};
const analyticsRateLimitConfig = {
	windowMs: 40 * 1000,
	max: 15,
	...commonRateLimitConfig
};

function checkSslAndWww(req: express.Request, res: express.Response, next: express.NextFunction) {
	if ((env === "development" || req.headers['x-forwarded-proto'] === "https") && !(/^www\./.test(req.hostname)))
		next();
	else
		res.redirect(`https://${req.hostname.replace(/^www\./, "")}${req.originalUrl}`)
}

app.use(helmet({
	contentSecurityPolicy: false
}));
app.use(checkSslAndWww);
app.use(express.static('src/static', env !== "production" ? {} : {
	maxAge: "1d",
	setHeaders: (res, path, stat) => {
		if (/\.(html|js|css)$/.test(path))
			res.setHeader("Cache-Control", `public, max-age=${env === "production" ? 1200 : 5}`);
	}
}));
app.use(bodyParser.json());

app.get("/login", RateLimit(basicRateLimitConfig), (req, res) => {
	const loginUrl = "https://www.reddit.com/api/v1/authorize?" +
		`client_id=${ encodeURIComponent(appId) }&` +
		`response_type=code&` +
		`state=initialLogin&` +
		`redirect_uri=${ encodeURIComponent(redirectURI) }&` +
		`duration=${ tokenDuration }&` +
		`scope=${ encodeURIComponent(scope.join(" ")) }`;

	res.redirect(loginUrl);
});

// redirect from certain reddit api request
app.get("/redirect", RateLimit(redditTokenRateLimitConfig), expressAsyncHandler(async (req, res) => {
	if (req.query["state"] && req.query["state"] === "initialLogin") {
		try {
			const data = await initialAccessToken(req.query["code"].toString());
			res.redirect(
				`/setAccessToken?accessToken=${encodeURIComponent(data["access_token"])}&refreshToken=${encodeURIComponent(data["refresh_token"])}`);
		} catch (e) {
			console.error(`Error getting access token ${JSON.stringify(e, null, 4)}`);
			res.send(`error getting access token ${JSON.stringify(e, null, 4)}`);
		}
	}
	else {
		res.setHeader('Content-Type', 'application/json');
		res.send('{ "error": "¯\\_(ツ)_/¯"}');
	}
}));


app.get("/refreshToken", RateLimit(redditTokenRateLimitConfig), expressAsyncHandler(async (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	if (req.query["refreshToken"]) {
		try {
			const data = await refreshAccessToken(req.query["refreshToken"].toString());
			res.send(`{ "accessToken": "${encodeURIComponent(data["access_token"])}" }`);
		} catch (e) {
			console.error(`Error getting access token ${JSON.stringify(e, null, 4)}`);
			res.send(`error getting access token ${JSON.stringify(e, null, 4)}`);
		}
	}
	else {
		res.send('{ "error": "¯\\_(ツ)_/¯"}');
	}
}));

const setAccessTokenFile = __dirname + "/src/static/setAccessToken.html"
app.get("/setAccessToken", (req, res) => {
	res.sendFile(setAccessTokenFile);
});

app.get("/getIframeSrc", RateLimit(getIframeSrcRateLimitConfig), expressAsyncHandler(async (req, res) => {
	const response = await fetch(req.query["url"].toString());
	const html = await response.text();
	let matches: string[] = html.match(/<source\s+src="[^<>\]!+"]*"\s+type="[\w\/]+"\s*\/?>/g);
	matches = matches.map(src => src.replace(/\s+/g, " "));
	res.send(JSON.stringify({
		"src": matches
	}));
}));

//unsuspicious to avoid adblocker blocking
app.post("/unsuspiciousPath", RateLimit(analyticsRateLimitConfig), expressAsyncHandler(analyticsRoute));

app.get("/eventsByTime", eventsByTime);

app.get("/uniqueClientsByTime", uniqueClientsByTime);

app.get("/popularPathsByTime", popularPathsByTime);

const indexFile = __dirname + "/src/static/index.html"
// catch all paths and check ssl, since app.use middleware doesn't seem to get called here
app.get('*', [RateLimit(basicRateLimitConfig), checkSslAndWww], (req, res) => {
	res.sendFile(indexFile);
});

app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
