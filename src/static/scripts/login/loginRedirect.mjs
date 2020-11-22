import { appId, redirectURI } from "../utils/consts.mjs";
import fetch from "node-fetch";
async function getAccessToken(params) {
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(appId + ":").toString("base64")}`,
        },
        body: params
    });
    const responseData = await response.json();
    if (responseData["error"])
        throw responseData;
    return responseData;
}
export async function initialAccessToken(code) {
    const formBody = new URLSearchParams("grant_type=authorization_code&" +
        `code=${code}&` +
        `redirect_uri=${redirectURI}`);
    return await getAccessToken(formBody);
}
export async function refreshAccessToken(refreshToken) {
    const formBody = new URLSearchParams("grant_type=refresh_token&" +
        `refresh_token=${refreshToken}`);
    return await getAccessToken(formBody);
}
