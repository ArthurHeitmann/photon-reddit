import express from "express";
import helmet from "helmet";
import RateLimit from "express-rate-limit";
import expressAsyncHandler from "express-async-handler";
import fetch from "node-fetch";
import { analyticsRouter } from "./serverScripts/analytics.js";
import { appId, redirectURI } from "./serverScripts/config.js";
import {
	__dirname,
	basicRateLimitConfig,
	env,
	port,
	redditTokenRateLimitConfig,
	scope,
	tokenDuration, youtube_dlRateLimitConfig
} from "./serverScripts/consts.js";
import { initialAccessToken, refreshAccessToken } from "./serverScripts/loginRedirect.js";
import bodyParser from "body-parser";
import youtube_dl from "youtube-dl";

const app = express();

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
	maxAge: env === "production" ? "1d" : "0"
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

// redirect from certain reddit api requests (like login)
app.get("/redirect", RateLimit(redditTokenRateLimitConfig), expressAsyncHandler(async (req, res) => {
	if (req.query["state"] && req.query["state"] === "initialLogin") {
		try {
			const data = await initialAccessToken(req.query["code"].toString());
			res.redirect(
				`/setAccessToken.html?accessToken=${encodeURIComponent(data["access_token"])}&refreshToken=${encodeURIComponent(data["refresh_token"])}`);
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

app.get("/youtube-dl", RateLimit(youtube_dlRateLimitConfig), (req, res) => {
	youtube_dl.getInfo(req.query["url"], [], (err, info) => {
		res.json({ url: info.url });
	});
});

// /data instead of /analytics used to avoid getting blocked by adblockers
app.use("/data", analyticsRouter);

const indexFile = __dirname + "/src/static/index.html"
// catch all paths and check ssl, since app.use middleware doesn't seem to get called here
app.get('*', [RateLimit(basicRateLimitConfig), checkSslAndWww], (req, res) => {
	res.sendFile(indexFile);
});

app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
