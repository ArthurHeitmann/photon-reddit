import { appId, redirectURI } from "./../consts.js"
import fetch from "node-fetch"

export async function retrieveAccessToken(code: string): Promise<string> {
	const formBody = new URLSearchParams("grant_type=authorization_code&" +
		`code=${ code }&` +
		`redirect_uri=${ redirectURI }`);
	const response = await fetch("https://www.reddit.com/api/v1/access_token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(appId + ":").toString("base64")}`,
		},
		body: formBody
	});

	const responseData = await response.json();
    if (responseData["error"])
		throw responseData;
	console.log(responseData);
    return responseData["access_token"];
}
