/**
 * MariaDB Database Schema:
 *
 * Table trackedEvents:
 * - id: INT(11) AUTO_INCREMENT
 * - clientId: VARCHAR(128)
 * - path: TEXT
 * - referer: VARCHAR(128)
 * - timeMillisUtc DECIMAL(15,0)
 *
 * Table browserFeatures:
 * - id: INT(11) AUTO_INCREMENT
 * - featureName: VARCHAR(50)
 * - isAvailable: BOOL
 * - data: DATE default=CURDATE()
 *
 * Table mediaHosts:
 * - mediaHost: VARCHAR(50) default=''
 * - linkHost: VARCHAR(50) default=''
 * - type: VARCHAR(3)
 * - count: INT(11) default=0
 *
 * Table genericEvents:
 * - ID: INT(11) AUTO_INCREMENT
 * - key: VARCHAR(50)
 * - value: TEXT
 * - date: DATE default=curdate()
 * - data2: TEXT default=NULL
 */

import {config} from "dotenv";
import express from "express";
import RateLimit from "express-rate-limit";
import mariadb, {Pool} from "mariadb";
import {analyticsRateLimitConfig, basicRateLimitConfig} from "./consts";
import {isIpFromBot, safeExcAsync} from "./utils";

const env: "production" | "development" | string = process.env.NODE_ENV || "development";
if (env !== "production")
	config();

export const analyticsRouter = express.Router();

let connectionSuccessFull = false;
let pool: Pool;
if (process.env.DB_USER && process.env.DB_PW && process.env.DB_DB && process.env.DB_HOST && process.env.DB_PORT) {
	pool = mariadb.createPool({
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PW,
		database: process.env.DB_DB,
		connectionLimit: 4
	});
	pool.query("SELECT id FROM trackedEvents LIMIT 1;")
		.then(() => {
			connectionSuccessFull = true;
			console.log("Connected to DB");

		})
		.catch(() => {
			connectionSuccessFull = false;
			console.error("Couldn't connect to DB");
		});
}
else {
	console.warn("No DB given");
}

async function getConnection(): Promise<mariadb.PoolConnection> {
	if (!connectionSuccessFull)
		return null;
	try {
		return  await pool.getConnection();
	}
	catch {
		return null;
	}
}

async function trackEvent(clientId: string, path: string, referrer: string, timeMillisUtc: number): Promise<void> {
	const connection = await getConnection();
	if (connection === null)
		return;
	try {
		await connection.query(`
		INSERT INTO trackedEvents 
			(clientId, path, referer, timeMillisUtc) 
			VALUES (
				${connection.escape(clientId)}, 
				${connection.escape(path)}, 
				${connection.escape(referrer)}, 
				${connection.escape(timeMillisUtc)}
			)
		;
	`);
	}
	finally {
		await connection.release();
	}
}

async function getEventsInTimeFrame(timeFrame: number, resolution: number): Promise<number[]> {
	const connection = await getConnection();
	if (connection === null)
		return [];
	const stepSize = timeFrame / resolution;
	const firstEntry = Date.now() - timeFrame;
	const valueRanges = Array(resolution).fill(0)
		.map((el, i) => [
			Math.round(firstEntry + i * stepSize),
			Math.round(firstEntry + (i + 1) * stepSize)
		]);
	const esc = connection.escape.bind(connection);
	try {
		let queryString = `
			SELECT
			${
				valueRanges.map((range, i) => 
					`SUM(IF(timeMillisUtc >= ${esc(range[0])} AND timeMillisUtc < ${esc(range[1])}, 1, 0)) AS "${esc(i)}"`)
					.join(",\n")	
			}
			FROM trackedEvents
			;
		`;
		const rows = await connection.query(queryString);
		return Object.values(rows[0]);
	}
	finally {
		await connection.release();
	}
}

async function getUniqueClientIdsInTimeFrame(timeFrame: number): Promise<string> {
	const connection = await getConnection();
	if (connection === null)
		return "-1";
	try {
		const rows = await connection.query(`
			SELECT COUNT(DISTINCT(clientId)) as cnt
			FROM trackedEvents
			WHERE timeMillisUtc >= ${connection.escape(Date.now() - timeFrame)}
			;
		`);
		return rows[0]["cnt"];
	}
	finally {
		await connection.release();
	}
}

async function getPopularPathsInTimeFrame(timeFrame: number, limit: number): Promise<object[]> {
	const connection = await getConnection();
	if (connection === null)
		return [];
	try {
		const rows = await connection.query({
			sql: `
				SELECT path, COUNT(path) AS percent
				FROM trackedEvents
				WHERE timeMillisUtc >= ${connection.escape(Date.now() - timeFrame)}
				GROUP BY path
				ORDER BY percent DESC
				LIMIT ${connection.escape(limit)}
				;
			`,
			bigIntAsNumber: true
		});
		const rows2 = await connection.query({
			sql: `
				SELECT COUNT(*) as cnt
				FROM trackedEvents
				WHERE timeMillisUtc >= ${connection.escape(Date.now() - timeFrame)}
				;
			`,
			bigIntAsNumber: true
		});
		const totalRows = rows2[0]["cnt"];
		const percentRows = rows.filter(elem => !(elem instanceof Array));
		for (const row of percentRows) {
			row["percent"] /= totalRows;
			row["path"] = row["path"].replace(/(?<=^(\/[^\/]+){2})\/.*/, "");
		}
		return percentRows;
	}
	finally {
		await connection.release();
	}
}

// interface MediaHost {
// 	mediaHost: string, linkHost: string, type: string
// }
//
// async function trackMediaHost(hosts: MediaHost[]): Promise<void> {
// 	const connection = await getConnection();
// 	if (connection === null)
// 		return;
// 	const insertValues = hosts
// 		.map(host => `(${connection.escape(host.mediaHost)}, ${connection.escape(host.linkHost)}, ${connection.escape(host.type)}, 1)`)
// 		.join(",");
// 	try {
// 		await connection.query(`
// 			INSERT INTO mediaHosts
// 				VALUES ${insertValues}
// 				ON DUPLICATE KEY UPDATE count = count + 1
// 		`);
// 	}
// 	finally {
// 		await connection.release();
// 	}
// }

async function trackBrowserFeature(featureName: string, isAvailable: boolean): Promise<void> {
	const connection = await getConnection();
	if (connection === null)
		return;

	try {
		await connection.query(`
			INSERT INTO browserFeatures
				(featureName, isAvailable)
			 	VALUES (${connection.escape(featureName)}, ${connection.escape(isAvailable)})
		`);
	}
	finally {
		await connection.release();
	}
}

async function trackGenericProperty(key: string, value: string, data2: string): Promise<void> {
	const connection = await getConnection();
	if (connection === null)
		return;

	try {
		await connection.query(`
			INSERT INTO genericEvents
				(\`key\`, value, data2)
			 	VALUES (${connection.escape(key)}, ${connection.escape(value)}, ${connection.escape(data2)})
		`);
	}
	finally {
		await connection.release();
	}
}

analyticsRouter.post("/event", RateLimit(analyticsRateLimitConfig), safeExcAsync(async (req, res) => {
	if (env === "production"  && await isIpFromBot(req)) {
		res.send("yep");
		console.log("not logging bot");
		return;
	}
	let { clientId, path, referer } = req.body;
	if (!path)
		path = "/";
	if (!clientId || typeof clientId !== "string" || clientId.length > 128) {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	if (typeof path !== "string" ) {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	if (referer && (typeof referer !== "string" || referer.length > 128)) {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	const serverTimeUtc = Date.now();

	res.send("yep");
	try {
		await trackEvent(clientId, path.toLowerCase(), referer.toLowerCase() || "", serverTimeUtc);
	}
	catch (e) {
		console.error("Error tracking event", e);
	}
}));

async function analyticsQueryMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
	const pw = req.headers.cookie?.split("; ")
		.find((cookie: string) => cookie.startsWith("analyticsPw"))
		?.split("=")[1];

	if (!pw || pw !== process.env.analyticsPw) {
		res.status(401).json({ error: "invalid password" });
		return;
	}
	next();
}

analyticsRouter.get("/events", RateLimit(basicRateLimitConfig), analyticsQueryMiddleware, safeExcAsync(async (req, res) => {
	const timeFrame = parseInt(req.query["timeFrame"]?.toString());
	const resolution = parseInt(req.query["resolution"]?.toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	if (resolution <= 0 || !isFinite(resolution) || typeof resolution !== "number" || resolution > 100) {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	try {
		const values = await getEventsInTimeFrame(timeFrame, resolution);
		res.send(values);
	}
	catch (e) {
		res.status(400).send("nope")
	}
}));

analyticsRouter.get("/uniqueClients", RateLimit(basicRateLimitConfig), analyticsQueryMiddleware, safeExcAsync(async (req, res) => {
	const timeFrame = parseInt(req.query["timeFrame"]?.toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}

	try {
		const values = await getUniqueClientIdsInTimeFrame(timeFrame);
		res.send(values.toString());
	}
	catch (e) {
		res.status(400).send("nope")
	}
}));

analyticsRouter.get("/popularPaths", RateLimit(basicRateLimitConfig), analyticsQueryMiddleware, safeExcAsync(async (req, res) => {
	const timeFrame = parseInt(req.query["timeFrame"]?.toString());
	const limit = parseInt(req.query["limit"]?.toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	if (limit <= 0 || !isFinite(limit) || typeof limit !== "number" || limit > 50) {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}

	try {
		const values = await getPopularPathsInTimeFrame(timeFrame, limit);
		res.send(values);
	}
	catch (e) {
		res.status(400).send("nope")
	}
}));

analyticsRouter.post("/mediaHost", safeExcAsync(async (req, res) => {
	res.send("yep");
	// const rawHosts = req.body;
	// if (!(rawHosts instanceof Array)) {
	// 	res.status(400).json({ error: "invalid parameters" });
	// 	return;
	// }
	// const hosts = rawHosts.map(data => (<MediaHost> {
	// 	mediaHost: (new URL(data["mediaUrl"])).hostname,
	// 	linkHost: (new URL(data["linkUrl"])).hostname,
	// 	type: data.type
	// }));
	//
	// try {
	// 	await trackMediaHost(hosts);
	// 	res.send("yep");
	// }
	// catch (e) {
	// 	console.error(e);
	// 	res.status(400).send("nope")
	// }
}));

analyticsRouter.post("/browserFeatures", safeExcAsync(async (req, res) => {
	const { featureName, isAvailable } = req.body;
	if (typeof featureName !== "string" || typeof isAvailable !== "boolean") {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	try {
		await trackBrowserFeature(featureName, isAvailable);
		res.send("yep");
	}
	catch (e) {
		res.send("nope").status(400);
	}
}));

analyticsRouter.post("/genericProperty", safeExcAsync(async (req, res) => {
	const { key, value, data2 } = req.body;
	if (typeof key !== "string" || key.length > 50 || typeof value !== "string" || typeof data2 !== "string") {
		res.status(400).json({ error: "invalid parameters" });
		return;
	}
	try {
		await trackGenericProperty(key.toString(), value.toString(), data2.toString());
		res.send("yep");
	}
	catch (e) {
		res.send("nope").status(400);
	}
}));
