import express from "express";
import { initialAccessToken, refreshAccessToken } from "./static/scripts/login/loginRedirect.js"
const app = express();
app.use(express.static('src/static'));
const port = 8080;

const __dirname = process.cwd();


// redirect from certain reddit api request
app.get("/redirect", (req, res) => {
	if (req.query["state"] && req.query["state"] === "initialLogin") {
		initialAccessToken(req.query["code"].toString()).then(
			(data: Object) => res.redirect(
				`/setAccessToken?accessToken=${encodeURIComponent(data["access_token"])}&refreshToken=${encodeURIComponent(data["refresh_token"])}`)
		).catch(error => {
			console.error(`Error getting access token ${error}`);
			res.send(`error getting access token ${error}`);
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
			console.error(`Error getting access token ${error}`);
			res.send(`error getting access token ${error}`);
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


const indexFile = __dirname + "/src/static/index.html"
// catch all paths
app.get('*', (req, res) => {
	res.sendFile(indexFile);
});


app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
