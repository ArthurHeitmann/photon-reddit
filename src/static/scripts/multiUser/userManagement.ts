import {checkTokenRefresh} from "../auth/auth";
import {logOutCurrentUser, tryCompleteLogin} from "../auth/loginHandler";
import {PhEvents} from "../types/Events";
import {createLock, unlock} from "../utils/lock";
import Ph_MessageNotification from "../components/message/messageNotification/messageNotification";
import GlobalUserData from "./globalData";
import {deleteKey, getAllKeysInStorage} from "./storageWrapper";
import UserData, {AuthData, guestUserName, tmpLoginUserName} from "./userData";

export default class Users {
	static global: GlobalUserData;
	private static _current: UserData;
	static all: UserData[] = [];
	static isSwitchingUser = false;

	static async init(): Promise<void> {
		await createLock("dbInitLock");
		Users.global = await (new GlobalUserData()).init();

		if (await tryCompleteLogin())
			location.replace(Users.global.d.pageBeforeLogin || "/");

		await Users.tryMigrateUserFromLs();

		const currentUser = Users.global.d.lastActiveUser;
		const users = await getAllKeysInStorage("u/");
		for (const user of users) {
			if (Users.all.find(u => u.key === user))
				continue;
			const username = user.slice(2);
			const newUser = await (new UserData(username)).init();
			if (username === currentUser)
				Users._current = newUser;
			Users.all.push(newUser);
		}
		if (Users.all.length > 0 && !Users._current) {
			Users._current = Users.all[0];
			await Users.global.set(["lastActiveUser"], Users._current.name);
		}
		if (users.length === 0 || !Users.all.some(user => user.isGuest)) {
			const guestUser = new UserData(guestUserName);
			await guestUser.init();
			Users.all.push(guestUser);
			if (users.length === 0) {
				Users._current = guestUser;
				await Users.global.set(["lastActiveUser"], guestUserName);
			}
		}

		unlock("dbInitLock");
		window.dispatchEvent(new Event(PhEvents.dbReady));
	}

	static get current(): UserData {
		return Users._current;
	}

	static async switchUser(newUser: UserData) {
		Users.isSwitchingUser = true;
		Users._current = newUser;
		await Users.global.set(["lastActiveUser"], newUser.name);
		await checkTokenRefresh();
		if (newUser.d.auth.isLoggedIn) {
			await Promise.all([
				newUser.fetchUserData(),
				Ph_MessageNotification.checkForNewMessages()
			]);
		}
		window.dispatchEvent(new Event(PhEvents.userChanged));
		Users.isSwitchingUser = false;
	}

	static async add(auth: AuthData): Promise<void> {
		const newUser = await (new UserData(tmpLoginUserName)).init();
		await newUser.set(["auth"], auth);
		await newUser.set(["userData", "name"], tmpLoginUserName);
		Users.all.push(newUser);
		Users._current = newUser;
		await Users.global.set(["lastActiveUser"], tmpLoginUserName);
	}

	static async remove(user: UserData) {
		const current = Users.current;
		if (user.d.auth.isLoggedIn) {
			Users._current = user;
			try {
				await logOutCurrentUser();
			} finally {
				Users._current = current;
			}
		}
		if (user === Users.current)
			await Users.switchUser(Users.all[0]);
		await deleteKey(user.key);
	}

	static async resetAll() {
		for (const user of Users.all) {
			if (user.d.auth.isLoggedIn) {
				Users._current = user;
				try {
					await logOutCurrentUser();
				} catch (e) {
					console.error(e);
				}
			}
			await deleteKey(user.key);
		}
		const guest = new UserData(guestUserName);
		await guest.init();
		Users.all = [guest];
		Users._current = guest;
		await Users.global.set(["lastActiveUser"], guestUserName);
	}

	private static hasDbLoaded = false;
	static ensureDataHasLoaded(): Promise<void> {
		return new Promise<void>(resolve => {
			if (Users.hasDbLoaded)
				resolve();
			else
				window.addEventListener(PhEvents.dbReady, () => {
					Users.hasDbLoaded = true;
					resolve();
				});
		});
	}

	private static async tryMigrateUserFromLs() {
		if (!(localStorage.accessToken && localStorage.isLoggedIn))
			return;
		function tryMigrateFromLs(lsKey): any | undefined {
			let lsVal: any;
			try {
				lsVal = JSON.parse(localStorage[lsKey]);
			} catch {
				lsVal = localStorage[lsKey];
			}
			localStorage.removeItem(lsKey);
			return lsVal;
		}

		const newAuth: AuthData = {
			accessToken: tryMigrateFromLs("accessToken"),
			expiration: tryMigrateFromLs("expiration"),
			isLoggedIn: tryMigrateFromLs("isLoggedIn"),
			loginTime: tryMigrateFromLs("loginTime"),
			refreshToken: tryMigrateFromLs("refreshToken"),
			scopes: tryMigrateFromLs("scope"),
		}
		localStorage.removeItem("pageBeforeLogin");
		const newUser = await (new UserData(newAuth.isLoggedIn ? tmpLoginUserName : guestUserName)).init();
		await newUser.set(["auth"], newAuth);
		Users.all.push(newUser);
		Users._current = newUser;
		await Users.global.set(["lastActiveUser"], newUser.name);
	}
}
