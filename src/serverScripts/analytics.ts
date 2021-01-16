import { config } from "dotenv";
const env = process.env.NODE_ENV || 'development';
if (env !== "production")
	config();

import express from "express";
import mariadb from "mariadb";

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

export async function analyticsRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
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
	if (!timeMillisUtc || typeof timeMillisUtc !== "number"  || referer.length > 128) {
		res.send("Invalid parameters").status(400);
		return;
	}
	try {
		await trackEvent(clientId, path, referer || "", timeMillisUtc,);
		res.send("yep");
	}
	catch (e) {
		console.error(e);
		res.send("nope").status(400);
		return;
	}
}

export async function eventsByTime(req: express.Request, res: express.Response, next: express.NextFunction) {
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
}
