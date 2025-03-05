import {getInitialAccessToken, revokeToken} from "../api/redditAuthApi";
import Ph_BeforeLoginInfo from "../components/misc/beforeLoginInfo/beforeLoginInfo";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import Users from "../multiUser/userManagement";
import {redirectURI, scope, tokenDuration} from "../utils/consts";
import {extractQuery, randomString} from "../utils/utils";
import { getAppId } from "./auth";

export function initiateLogin(_skipOriginCheck = false) {
	if (!redirectURI.startsWith(location.origin) && !_skipOriginCheck) {
		new Ph_Toast(
			Level.warning,
			"Redirect URI differs from current URI! Login will not work correctly! Still continue?",
			{ onConfirm: () => initiateLogin(true), groupId: "login different uri" }
		)
		return;
	}

	new Ph_BeforeLoginInfo();
}

export async function redirectToLoginPage() {
	const loginCode = randomString(128);
	const loginUrl = "https://www.reddit.com/api/v1/authorize?" +
		`client_id=${ encodeURIComponent(getAppId()) }&` +
		`response_type=code&` +
		`state=${loginCode}&` +
		`redirect_uri=${ encodeURIComponent(redirectURI) }&` +
		`duration=${ tokenDuration }&` +
		`scope=${ encodeURIComponent(scope.join(" ")) }`;
	await Users.global.set(["loginCode"], loginCode);
	await Users.global.set(["pageBeforeLogin"], history.state?.url || "/");
	location.href = loginUrl;
}

/** After logging in reddit redirects to <origin>/redirect with an authorization code in the parameter  */
export async function tryCompleteLogin(): Promise<boolean> {
	if (/^\/redirect/.test(history.state?.url || location.pathname))
		return  await finishLogin();
	return false;
}

/** exchange authorization code for first access & refresh token */
export async function finishLogin(): Promise<boolean> {
	const query = new URLSearchParams(extractQuery(history.state?.url || location.search));
	const queryState = query.get("state");
	const savedState = Users.global.d.loginCode;
	if (queryState && savedState && queryState === savedState) {
		try {
			const data = await getInitialAccessToken(query.get("code").toString());
			if ("error" in data)
				throw data;
			await Users.add({
				appId: getAppId(),
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				scopes: data.scope,
				expiration: Date.now() + (59 * 60 * 1000),
				loginTime: Date.now(),
				isLoggedIn: true,
			});
			return true;
		} catch (e) {
			console.error(e);
			new Ph_Toast(Level.error, "Error completing login");
			return false;
		}
	}
	else {
		new Ph_Toast(Level.error, "Wrong redirect parameters");
		return false;
	}
}

export async function logOutCurrentUser() {
	if (!await revokeToken()) {
		new Ph_Toast(Level.error, "Couldn't confirm logout");
		throw "Couldn't confirm logout";
	}
}
