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
	connectionLimit: 5
});

async function trackEvent(sessionId: string, path: string, referrer: string, timeMillisUtc: number) {
	const connection = await pool.getConnection();
	await connection.query(`
		INSERT INTO trackedEvents 
		    (clientId, path, referer, timeMillisUtc) 
		    VALUES (
		    	${connection.escape(sessionId)}, 
		    	${connection.escape(path)}, 
		    	${connection.escape(referrer)}, 
		    	${connection.escape(timeMillisUtc)}
			)
		;
	`);
}

export async function analyticsRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
	const { sessionId, path, referer, timeMillisUtc } = req.body;
	if (!sessionId || typeof sessionId !== "string" || sessionId.length > 128) {
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
		await trackEvent(sessionId, path, referer || "", timeMillisUtc,);
		res.send("yep");
	}
	catch (e) {
		console.error(e);
		res.send("nope").status(400);
		return;
	}
}
