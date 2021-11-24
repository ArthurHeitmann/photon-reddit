import { getImplicitGrant, getRefreshAccessToken } from "../api/redditAuthApi";
import Ph_Toast, { Level } from "../components/misc/toast/toast";
import Users from "../components/multiUser/userManagement";

export enum AuthState {
	loggedIn, implicitGrant
}

export async function checkTokenRefresh(): Promise<boolean> {
	await Users.current.lockAuthData();
	if (!hasTokenExpired()) {
		Users.current.unlockAuthData();
		return;
	}

	let result: boolean;
	if (Users.current.d.auth.isLoggedIn)
		result = await refreshAccessToken();
	else
		result = await implicitGrant();
	Users.current.unlockAuthData();
	return result;
}

export async function checkAuthOnPageLoad(): Promise<AuthState> {
	// An over engineered way to check the auth state. Has some fallback in case of data corruption
	// has storage potentially usable auth data
	await Users.current.lockAuthData();
	try {
		if (!Users.current.d.auth.isLoggedIn || Users.current.d.auth.refreshToken) {
			if (Users.current.d.auth.isLoggedIn) {
				// before returning AuthState.loggedIn verifyTokenWorks() must somewhere be called
				if (hasTokenExpired() && !await refreshAccessToken()) {
					if (!await verifyTokenWorks()) {
						authError("Failed to refresh authentication! If this is breaking the website, log out & reload?");
					}
				} else if (!await verifyTokenWorks() && !await refreshAccessToken()) {
					authError("Invalid authentication! If this is breaking the website, log out & reload?");
				}
				return AuthState.loggedIn;
			} else {
				if (hasTokenExpired() && !await implicitGrant() || !await verifyTokenWorks() && !await implicitGrant()) {
					authError("Failed to get authentication! Do you want to clear data & reload?");
				}
				return AuthState.implicitGrant;
			}
		}
		// no usable auth data
		else {
			await Users.current.set(["auth", "isLoggedIn"], false);
			if (!await implicitGrant()) {
				authError("Failed to get authentication! Do you want to clear data & reload?");
			}
			return AuthState.implicitGrant;
		}
	}
	catch (e) {
		console.error("Error initializing auth");
		console.error(e);
		new Ph_Toast(Level.error, "Bad Error happened while authenticating with Reddit");
		return AuthState.implicitGrant;
	}
	finally {
		Users.current.unlockAuthData();
	}
}

function authError(msg: string) {
	new Ph_Toast(Level.warning, msg, { onConfirm: () => Users.remove(Users.current) });
}

async function implicitGrant(): Promise<boolean> {
	const newToken = await getImplicitGrant(Users.global.d.analytics.clientId.slice(0, 25));
	if (newToken["error"]) {
		console.error("error getting implicit grant", newToken);
		return false;
	}
	await Users.current.set(["auth", "isLoggedIn"], false);
	await Users.current.set(["auth", "accessToken"], newToken.access_token);
	await Users.current.set(["auth", "expiration"], Date.now() + (59 * 60 * 1000));
	return true;
}

async function refreshAccessToken(): Promise<boolean> {
	const newTokens = await getRefreshAccessToken(Users.current.d.auth.refreshToken);
	if (newTokens["error"]) {
		console.error("Error refreshing access token", newTokens);
		return false;
	}
	await Users.current.set(["auth", "accessToken"],  newTokens.access_token);
	if (newTokens.refresh_token)
		await Users.current.set(["auth", "refreshToken"],  newTokens.refresh_token);
	await Users.current.set(["auth", "expiration"],  Date.now() + (59 * 60 * 1000));
	return true;
}

function verifyTokenWorks(): Promise<boolean> {
	return Users.current.fetchName();
}

function hasTokenExpired(): boolean {
	const expiration = Users.current.d.auth.expiration;
	// invalidate 1 minutes ahead of expiration
	return !expiration || expiration - Date.now() < 1000 * 60;
}
