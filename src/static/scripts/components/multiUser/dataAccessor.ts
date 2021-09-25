import { getFromStorage, setInStorage } from "./storageWrapper";

export default abstract class DataAccessor<T> {
	protected abstract key: string;
	protected abstract default: T;
	protected loaded: T;

	async init(): Promise<this> {
		const storedData = await getFromStorage(this.key);
		if (!storedData) {
			this.loaded = this.default;
			await setInStorage(this.default, this.key);
		}
		else {
			this.loaded = storedData;
		}
		return this;
	}

	// TODO is needed?
	// get<k0 extends keyof T>(...keys: [k0]): Promise<T[k0]>;
	// get<k0 extends keyof T, k1 extends keyof T[k0]>(...keys: [k0, k1]): Promise<T[k0][k1]>;
	// get<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(...keys: [k0, k1]): Promise<T[k0][k1][k2]>;
	// async get(...keys: string[]): Promise<any | undefined> {
	// 	try {
	// 		return await getFromStorage(this.key, ...keys);
	// 	} catch (e) {
	// 		return undefined;
	// 	}
	// }

	/** Only to be used in a read only way */
	get d(): Readonly<T> {
		return this.loaded;
	}

	set<k0 extends keyof T>(keys: [k0], value: T[k0]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0]>(keys: [k0, k1], value: T[k0][k1]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(keys: [k0, k1], value: T[k0][k1][k2]): Promise<void>;
	async set(keys: string[], value: any): Promise<void> {
		await setInStorage(value, this.key, ...keys);
		let loadedTarget = this.loaded;
		for (let i = 0; i < keys.length - 1; i++)
			loadedTarget = loadedTarget[keys[i]];
		loadedTarget[keys[keys.length - 1]] = value;
	}

	protected tryMigrateFromLsToLoaded(lsKeys: string[], loadedKeys: string[], transformer = val => val) {
		try {
			if (!(lsKeys[0] in localStorage))
				return;
			let lsVal: any;
			try {
				lsVal = JSON.parse(localStorage[lsKeys[0]]);
			} catch {
				lsVal = localStorage[lsKeys[0]];
			}
			for (let i = 1; i < lsKeys.length; i++)
				lsVal = lsVal[lsKeys[i]];
			if (lsVal) {
				let target = this.loaded;
				for (let i = 0; i < loadedKeys.length - 1; i++)
					target = target[loadedKeys[i]];
				target[loadedKeys[loadedKeys.length - 1]] = transformer(lsVal);
			}
		}
		catch {}
	}
}
