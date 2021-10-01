import { tryCompleteLogin } from "../../auth/loginHandler";
import GlobalUserData from "./globalData";
import { getAllKeysInStorage } from "./storageWrapper";
import UserData, { AuthData, guestUserName, tmpLoginUserName } from "./userData";

export default class Users {
	static global: GlobalUserData;
	private static _current: UserData;
	static all: UserData[] = [];

	static async init(): Promise<void> {
		Users.global = await (new GlobalUserData()).init();

		if (await tryCompleteLogin())
			location.replace(Users.global.d.pageBeforeLogin || "/");

		await Users.tryMigrateUserFromLs();

		const currentUser = Users.global.d.lastActiveUser;
		const users = await getAllKeysInStorage("u/");
		for (const user of users) {
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
		if (users.length === 0) {
			const guestUser = new UserData(guestUserName);
			await guestUser.init();
			Users.all.push(guestUser);
			Users._current = guestUser;
			await Users.global.set(["lastActiveUser"], guestUserName);
		}

		window.dispatchEvent(new Event("ph-db-ready"));
	}

	static get current(): UserData {
		return this._current;
	}

	static async switchUser(newUser: UserData) {
		this._current = newUser;
		await Users.global.set(["lastActiveUser"], newUser.name);
		window.dispatchEvent(new Event("ph-user-changed"));
	}

	static async add(auth: AuthData): Promise<void> {
		const newUser = await (new UserData(tmpLoginUserName)).init();
		await newUser.set(["auth"], auth);
		Users.all.push(newUser);
		Users._current = newUser;
		await Users.global.set(["lastActiveUser"], tmpLoginUserName);
	}

	private static hasDbLoaded = false;
	static ensureDataHasLoaded(): Promise<void> {
		return new Promise<void>(resolve => {
			if (Users.hasDbLoaded)
				resolve();
			else
				window.addEventListener("ph-db-ready", () => {
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
		const newUser = await (new UserData(tmpLoginUserName)).init();
		await newUser.set(["auth"], newAuth);
		Users.all.push(newUser);
		Users._current = newUser;
	}
}
