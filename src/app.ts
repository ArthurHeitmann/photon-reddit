import express from "express";
import { retrieveAccessToken } from "./static/scripts/login/loginRedirect.js"
const app = express();
app.use(express.static('src/static'));
const port = 8080;

const __dirname = process.cwd();


// redirect from certain reddit api request
app.get("/redirect", (req, res) => {
	if (req.query["state"] && req.query["state"] === "initialLogin") {
		try {
			retrieveAccessToken(req.query["code"].toString()).then(
				(token: string) => res.redirect(`/setAccessToken?token=${ encodeURIComponent(token) }`)
			);
		} catch (error) {
			console.error(`Error getting access token ${error}`);
			res.send(`error getting access token ${error}`);
			return;
		}
	}
	else {
		res.send(`¯\\_(ツ)_/¯`);
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
