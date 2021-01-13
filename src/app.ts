import express, { NextFunction, RequestHandler } from "express";
import helmet from "helmet";
// const RateLimit = require("express-rate-limit") as (options) => (req, res, next) => void;
import RateLimit from "express-rate-limit";
import fetch from "node-fetch";
import { initialAccessToken, refreshAccessToken, appId, redirectURI } from "./loginRedirect.js";

const app = express();
const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';
const __dirname = process.cwd();
const tokenDuration = "permanent";
const scope = ["identity", "edit", "flair", "history", "modconfig", "modflair", "modlog", "modposts", "modwiki", "mysubreddits", "privatemessages", "read", "report", "save", "submit", "subscribe", "vote", "wikiedit", "wikiread"];
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

function checkSslAndWww(req: express.Request, res: express.Response, next: express.NextFunction) {
	if ((env === "development" || req.headers['x-forwarded-proto'] === "https") && !(/^www\./.test(req.hostname)))
		next();
	else
		res.redirect(`https://${req.hostname.replace(/^www\./, "")}${req.originalUrl}`)
}

app.use(express.static('src/static'));
app.use(helmet());
app.use(checkSslAndWww);

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
app.get("/redirect", RateLimit(redditTokenRateLimitConfig), (req, res) => {
	if (req.query["state"] && req.query["state"] === "initialLogin") {
		initialAccessToken(req.query["code"].toString()).then(
			(data: Object) => res.redirect(
				`/setAccessToken?accessToken=${encodeURIComponent(data["access_token"])}&refreshToken=${encodeURIComponent(data["refresh_token"])}`)
		).catch(error => {
			console.error(`Error getting access token ${JSON.stringify(error, null, 4)}`);
			res.send(`error getting access token ${JSON.stringify(error, null, 4)}`);
		});
	}
	else {
		res.setHeader('Content-Type', 'application/json');
		res.send('{ "error": "¯\\_(ツ)_/¯"}');
	}
});


app.get("/refreshToken", RateLimit(redditTokenRateLimitConfig), (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	if (req.query["refreshToken"]) {
		refreshAccessToken(req.query["refreshToken"].toString()).then(
			(data: Object) => 
				res.send(`{ "accessToken": "${encodeURIComponent(data["access_token"])}" }`)
		).catch(error => {
			console.error(`Error getting access token ${JSON.stringify(error, null, 4)}`);
			res.send(`error getting access token ${JSON.stringify(error, null, 4)}`);
		});
	}
	else {
		res.send('{ "error": "¯\\_(ツ)_/¯"}');
	}
});


const setAccessTokenFile = __dirname + "/src/static/setAccessToken.html"
app.get("/setAccessToken", (req, res) => {
	res.sendFile(setAccessTokenFile);
});

app.get("/getIframeSrc", RateLimit(getIframeSrcRateLimitConfig), (req, res) => {
	fetch(req.query["url"].toString()).then(resp => resp.text().then(text => {
		let matches: string[] = text.match(/<source\s+src="[^<>\]!+"]*"\s+type="[\w\/]+"\s*\/?>/g);
		matches = matches.map(src => src.replace(/\s+/g, " "));
		res.send(JSON.stringify({
			"src": matches
		}));
	}));
});

const indexFile = __dirname + "/src/static/index.html"
// catch all paths and check ssl, since app.use middleware doesn't seem to get called here
app.get('*', [RateLimit(basicRateLimitConfig), checkSslAndWww], (req, res) => {
	res.sendFile(indexFile);
});

app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
