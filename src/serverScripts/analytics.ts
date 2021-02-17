import { config } from "dotenv";
const env = process.env.NODE_ENV || 'development';
if (env !== "production")
	config();

import express from "express";
import mariadb from "mariadb";
import RateLimit from "express-rate-limit";
import { analyticsRateLimitConfig, basicRateLimitConfig } from "./consts.js";
import { safeExcAsync } from "./utils.js";

export const analyticsRouter = express.Router();

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PW,
	database: "cebjr7ve9iuq6def",
	connectionLimit: 4
});

async function trackEvent(clientId: string, path: string, referrer: string, timeMillisUtc: number) {
	const connection = await pool.getConnection();
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
		connection.release();
	}
}

async function getEventsInTimeFrame(timeFrame: number, resolution: number): Promise<number[]> {
	const connection = await pool.getConnection();
	const stepSize = timeFrame / resolution;
	const firstEntry = Date.now() - timeFrame;
	const valueRanges = Array(resolution).fill(0)
		.map((el, i) => [
			Math.round(firstEntry + i * stepSize),
			Math.round(firstEntry + (i + 1) * stepSize)
		]);
	const esc = connection.escape;
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
		connection.release();
	}
}

async function getUniqueClientIdsInTimeFrame(timeFrame: number) {
	const connection = await pool.getConnection();
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
		connection.release();
	}
}

async function getPopularPathsInTimeFrame(timeFrame: number, limit: number) {
	const connection = await pool.getConnection();
	try {
		const rows = await connection.query(`
			SELECT path, COUNT(path) AS percent
			FROM trackedEvents
			WHERE timeMillisUtc >= ${connection.escape(Date.now() - timeFrame)}
			GROUP BY path
			ORDER BY percent DESC
			LIMIT ${connection.escape(limit)}
			;
		`);
		const rows2 = await connection.query(`
			SELECT COUNT(*) as cnt
			FROM trackedEvents
			WHERE timeMillisUtc >= ${connection.escape(Date.now() - timeFrame)}
			;
		`);
		const totalRows = rows2[0]["cnt"];
		const percentRows = rows.filter(elem => !(elem instanceof Array));
		for (const row of percentRows) {
			row["percent"] /= totalRows;
			row["path"] = row["path"].replace(/(?<=^(\/[^\/]+){2})\/.*/, "");
		}
		return percentRows;
	}
	finally {
		connection.release();
	}
}

analyticsRouter.post("/event", RateLimit(analyticsRateLimitConfig), safeExcAsync(async (req, res) => {
	const { clientId, path, referer, timeMillisUtc } = req.body;
	if (!clientId || typeof clientId !== "string" || clientId.length > 128) {
		res.send("Invalid parameters").status(400);
		return;
	}
	if (!path || typeof path !== "string" ) {
		res.send("Invalid parameters").status(400);
		return;
	}
	if (referer && (typeof referer !== "string" || referer.length > 128)) {
		res.send("Invalid parameters").status(400);
		return;
	}
	if (!timeMillisUtc || typeof timeMillisUtc !== "number" || referer.length > 128) {
		res.send("Invalid parameters").status(400);
		return;
	}
	try {
		await trackEvent(clientId, path.toLowerCase(), referer.toLowerCase() || "", timeMillisUtc,);
		res.send("yep");
	}
	catch (e) {
		console.error(e);
		res.send("nope").status(400);
		return;
	}
}));

async function analyticsQueryMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
	const pw = req.headers.cookie?.split("; ")
		.find((cookie: string) => cookie.startsWith("analyticsPw"))
		?.split("=")[1];

	if (!pw || pw !== process.env.analyticsPw) {
		res.status(401);
		return;
	}

	next();
}

analyticsRouter.get("/events", RateLimit(basicRateLimitConfig), analyticsQueryMiddleware, safeExcAsync(async (req, res) => {
	const timeFrame = parseInt(req.query["timeFrame"].toString());
	const resolution = parseInt(req.query["resolution"].toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.send("Invalid parameters").status(400);
		return;
	}
	if (resolution <= 0 || !isFinite(resolution) || typeof resolution !== "number" || resolution > 100) {
		res.send("Invalid parameters").status(400);
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
	const timeFrame = parseInt(req.query["timeFrame"].toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.send("Invalid parameters").status(400);
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
	const timeFrame = parseInt(req.query["timeFrame"].toString());
	const limit = parseInt(req.query["limit"].toString());
	if (timeFrame <= 0 || !isFinite(timeFrame) || typeof timeFrame !== "number") {
		res.send("Invalid parameters").status(400);
		return;
	}
	if (limit <= 0 || !isFinite(limit) || typeof limit !== "number" || limit > 50) {
		res.send("Invalid parameters").status(400);
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
