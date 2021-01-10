import express, { NextFunction, RequestHandler } from "express";
import fetch from "node-fetch";
import { initialAccessToken, refreshAccessToken, appId, redirectURI } from "./loginRedirect.js";

const app = express();
app.use(express.static('src/static'));
const port = process.env.PORT || 8080;

const __dirname = process.cwd();
const tokenDuration = "permanent";
const scope = ["identity", "edit", "flair", "history", "modconfig", "modflair", "modlog", "modposts", "modwiki", "mysubreddits", "privatemessages", "read", "report", "save", "submit", "subscribe", "vote", "wikiedit", "wikiread"];

function checkSsl(req: Request, res: Response, next: NextFunction) {
	// @ts-ignore
	console.log(`${req.hostname}|${req.originalUrl}`);
	console.log(req.secure);
	// @ts-ignore
	if (req.secure || req.hostname === "localhost")
		next();
	else {
		// @ts-ignore
		res.redirect(`https://${req.hostname}${req.originalUrl}`)
	}

}

app.use(checkSsl as unknown as RequestHandler);

app.get("/login", (req, res) => {
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
app.get("/redirect", (req, res) => {
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


app.get("/refreshToken", (req, res) => {
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

app.get("/getIframeSrc", (req, res) => {
	fetch(req.query["url"].toString()).then(resp => resp.text().then(text => {
		let matches: string[] = text.match(/<source\s+src="[^<>\]!+"]*"\s+type="[\w\/]+"\s*\/?>/g);
		matches = matches.map(src => src.replace(/\s+/g, " "));
		res.send(JSON.stringify({
			"src": matches
		}));
	}));
});

const indexFile = __dirname + "/src/static/index.html"
// catch all paths
app.get('*', (req, res) => {
	res.sendFile(indexFile);
});


app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
