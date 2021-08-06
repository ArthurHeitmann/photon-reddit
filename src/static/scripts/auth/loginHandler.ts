import { getInitialAccessToken, revokeToken } from "../api/redditAuthApi";
import Ph_BeforeLoginInfo from "../components/misc/beforeLoginInfo/beforeLoginInfo";
import Ph_Toast, { Level } from "../components/misc/toast/toast";
import { appId, redirectURI, scope, tokenDuration } from "../utils/consts";
import { extractQuery, randomString } from "../utils/utils";

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

export function redirectToLoginPage() {
	const loginCode = randomString(128);
	localStorage.loginCode = loginCode;
	const loginUrl = "https://www.reddit.com/api/v1/authorize?" +
		`client_id=${ encodeURIComponent(appId) }&` +
		`response_type=code&` +
		`state=${loginCode}&` +
		`redirect_uri=${ encodeURIComponent(redirectURI) }&` +
		`duration=${ tokenDuration }&` +
		`scope=${ encodeURIComponent(scope.join(" ")) }`;

	localStorage.pageBeforeLogin = history.state?.url || "/";
	location.href = loginUrl;
}

/** After logging in reddit redirects to <origin>/redirect with an authorization code in the parameter  */
export async function checkOrCompleteLoginRedirect() {
	if (/^\/redirect/.test(history.state?.url || location.pathname)) {
		await finishLogin();
	}
}

/** exchange authorization code for first access & refresh token */
export async function finishLogin() {
	const query = new URLSearchParams(extractQuery(history.state?.url || location.search));
	const queryState = query.get("state");
	const savedState = localStorage.loginCode;
	localStorage.removeItem("loginCode");
	if (queryState && savedState && queryState === savedState) {
		try {
			const data = await getInitialAccessToken(query.get("code").toString());
			if ("error" in data)
				throw data;
			localStorage.accessToken = data.access_token;
			localStorage.refreshToken = data.refresh_token;
			localStorage.scope = data.scope;
			// set expiry to be 59 minutes from now
			localStorage.expiration = (Date.now() + (59 * 60 * 1000)).toString();
			localStorage.loginTime = Date.now();
			localStorage.isLoggedIn = "true";
			const pageBeforeLogin = localStorage.pageBeforeLogin;
			localStorage.removeItem("pageBeforeLogin");
			location.replace(pageBeforeLogin || "/");
		} catch (e) {
			console.error(e);
			new Ph_Toast(Level.error, "Error completing login");
		}
	}
	else {
		new Ph_Toast(Level.error, "Wrong redirect parameters");
	}
}

export async function logOut() {
	const success = await revokeToken();
	if (success) {
		clearAuthLocalData();
	}
	else {
		new Ph_Toast(Level.error, "Couldn't confirm logout. Complete cleanup anyway?", { onConfirm: clearAuthLocalData });
	}
}

function clearAuthLocalData() {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("isLoggedIn");
	localStorage.removeItem("expiration");
	localStorage.removeItem("scope");
	location.reload();
}