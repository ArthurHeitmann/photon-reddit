import GlobalUserData from "./globalData";
import { getAllKeysInStorage } from "./storageWrapper";
import UserData from "./userData";

export default class Users {
	static global: GlobalUserData;
	static current: UserData;
	static all: UserData[] = [];

	static async init(): Promise<void> {
		Users.global = await (new GlobalUserData()).init();
		const currentUser = Users.global.d.lastActiveUser;

		const users = await getAllKeysInStorage("u/");
		for (const user of users) {
			const newUser = new UserData(user.slice(2));
			await newUser.init();
			if (user === currentUser)
				Users.current = newUser;
			Users.all.push(newUser);
		}
		if (users.length === 0) {
			const anon = new UserData("#anon");
			await anon.init();
			Users.all.push(anon);
			Users.current = anon;
			await Users.global.set(["lastActiveUser"], "#anon");
		}
	}
}
