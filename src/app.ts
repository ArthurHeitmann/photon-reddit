import bodyParser from "body-parser";
import compression from "compression";
import express from "express";
import RateLimit from "express-rate-limit";
import helmet from "helmet";
import {analyticsRouter} from "./serverScripts/analytics";
import {__dirname, basicRateLimitConfig, port,} from "./serverScripts/consts";
import {photonApiRouter} from "./serverScripts/photonApi";
import {cacheControl, checkSslAndWww, imgThemeOverride, safeExc, safeExcAsync} from "./serverScripts/utils";

const app = express();
// middlewares

app.use(compression())
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginEmbedderPolicy: false,
}));
app.use(safeExc(checkSslAndWww));
// app.use(safeExc(cacheControl));
app.use("/img", safeExcAsync(imgThemeOverride));
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
	console.log(`Server running on http://localhost:${port}`)
});
