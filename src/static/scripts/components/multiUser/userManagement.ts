import GlobalUserData from "./globalData";
import { getAllKeysInStorage } from "./storageWrapper";
import UserData, { guestUserName } from "./userData";

export default class Users {
	static global: GlobalUserData;
	static current: UserData;
	static all: UserData[] = [];

	static async init(): Promise<void> {
		Users.global = await (new GlobalUserData()).init();
		const currentUser = Users.global.d.lastActiveUser;

		const users = await getAllKeysInStorage("u/");
		for (const user of users) {
			const username = user.slice(2);
			const newUser = await (new UserData(username)).init();
			if (username === currentUser)
				Users.current = newUser;
			Users.all.push(newUser);
		}
		if (users.length === 0) {
			const guestUser = new UserData(guestUserName);
			await guestUser.init();
			Users.all.push(guestUser);
			Users.current = guestUser;
			await Users.global.set(["lastActiveUser"], guestUserName);
		}
		window.dispatchEvent(new Event("ph-db-ready"));
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
}
