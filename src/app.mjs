import express from "express";
import { initialAccessToken, refreshAccessToken } from "./static/scripts/login/loginRedirect.mjs";
import fetch from "node-fetch";
const app = express();
app.use(express.static('src/static'));
const port = 8080;
const __dirname = process.cwd();
// redirect from certain reddit api request
app.get("/redirect", (req, res) => {
    if (req.query["state"] && req.query["state"] === "initialLogin") {
        initialAccessToken(req.query["code"].toString()).then((data) => res.redirect(`/setAccessToken?accessToken=${encodeURIComponent(data["access_token"])}&refreshToken=${encodeURIComponent(data["refresh_token"])}`)).catch(error => {
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
        refreshAccessToken(req.query["refreshToken"].toString()).then((data) => res.send(`{ "accessToken": "${encodeURIComponent(data["access_token"])}" }`)).catch(error => {
            console.error(`Error getting access token ${JSON.stringify(error, null, 4)}`);
            res.send(`error getting access token ${JSON.stringify(error, null, 4)}`);
        });
    }
    else {
        res.send('{ "error": "¯\\_(ツ)_/¯"}');
    }
});
const setAccessTokenFile = __dirname + "/src/static/setAccessToken.html";
app.get("/setAccessToken", (req, res) => {
    res.sendFile(setAccessTokenFile);
});
app.get("/getIframeSrc", (req, res) => {
    fetch(req.query["url"].toString()).then(resp => resp.text().then(text => {
        let matches = text.match(/<source\s+src="[^<>\]!+"]*"\s+type="[\w\/]+"\s*\/?>/g);
        matches = matches.map(src => src.replace(/\s+/g, " "));
        res.send(JSON.stringify({
            "src": matches
        }));
    }));
});
const indexFile = __dirname + "/src/static/index.html";
// catch all paths
app.get('*', (req, res) => {
    res.sendFile(indexFile);
});
app.listen(port, () => {
    console.log(`Started app on port ${port}!`);
});
