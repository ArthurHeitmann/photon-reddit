import bodyParser from "body-parser";
import express from "express";
import RateLimit from "express-rate-limit";
import helmet from "helmet";
import { analyticsRouter } from "./serverScripts/analytics.js";
import {
	__dirname,
	basicRateLimitConfig,
	port,
} from "./serverScripts/consts.js";
import { photonApiRouter } from "./serverScripts/photonApi.js";
import { cacheControl, checkSslAndWww, safeExc} from "./serverScripts/utils.js";

const app = express();

// middlewares

app.use(helmet({
	contentSecurityPolicy: false
}));
app.use(safeExc(checkSslAndWww));
app.use(safeExc(cacheControl));
app.use(express.static('src/static'));
app.use(bodyParser.json());

// paths

app.use("/api", photonApiRouter);
// /data instead of /analytics used to avoid getting blocked by adblockers
app.use("/data", analyticsRouter);

const indexFile = __dirname + "/src/static/index.html"
// catch all paths and check ssl, since app.use middleware doesn't seem to get called here
app.get("*", [RateLimit(basicRateLimitConfig), checkSslAndWww], safeExc((req, res) => {
	res.sendFile(indexFile);
}));

app.listen(port, () => {
	console.log(`Started app on port ${port}!`)
});
