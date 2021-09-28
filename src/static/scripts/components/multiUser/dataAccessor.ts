import { onMessageBroadcast } from "../../utils/messageCommunication";
import { deleteKey, getFromStorage, setInStorage } from "./storageWrapper";

export default abstract class DataAccessor<T> {
	protected abstract key: string;
	protected abstract default: T;
	protected loaded: T;

	async init(): Promise<this> {
		onMessageBroadcast(this.refreshData.bind(this), "dataChanged");

		let storedData: any;
		try {
			storedData = await getFromStorage(this.key);
		} catch {}
		if (!storedData) {
			this.loaded = this.default;
			await setInStorage(this.default, this.key);
		}
		else {
			this.loaded = storedData;
		}
		return this;
	}

	/** Get all stored data. Only to be used in a read only way */
	get d(): Readonly<T> {
		return this.loaded;
	}

	set<k0 extends keyof T>(keys: [k0], value: T[k0]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0]>(keys: [k0, k1], value: T[k0][k1]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(keys: [k0, k1, k2], value: T[k0][k1][k2]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1], k3 extends keyof T[k0][k1][k2]>(keys: [k0, k1, k2, k3], value: T[k0][k1][k2][k3]): Promise<void>;
	async set(keys: string[], value: any): Promise<void> {
		await setInStorage(value, this.key, ...keys);
		let loadedTarget = this.loaded;
		for (let i = 0; i < keys.length - 1; i++)
			loadedTarget = loadedTarget[keys[i]];
		loadedTarget[keys[keys.length - 1]] = value;
	}

	remove<k0 extends keyof T>(...keys: [k0]): Promise<T[k0]>;
	remove<k0 extends keyof T, k1 extends keyof T[k0]>(...keys: [k0, k1]): Promise<T[k0][k1]>;
	remove<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(...keys: [k0, k1, k2]): Promise<T[k0][k1][k2]>;
	async remove(...keys: string[]): Promise<any | undefined> {
		let loadedTarget = this.loaded;
		for (let i = 0; i < keys.length - 1; i++)
			loadedTarget = loadedTarget[keys[i]];
		delete loadedTarget[keys[keys.length - 1]];
		await setInStorage(this.loaded, this.key);
	}

	protected async changeKey(newKey: string) {
		await deleteKey(this.key);
		await setInStorage(this.loaded, newKey);
		this.key = newKey;
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
			let target = this.loaded;
			for (let i = 0; i < loadedKeys.length - 1; i++)
				target = target[loadedKeys[i]];
			target[loadedKeys[loadedKeys.length - 1]] = transformer(lsVal);
			localStorage.removeItem(lsKeys[0]);
		}
		catch {}
	}

	protected async refreshData() {
		this.loaded = await getFromStorage(this.key);
	}
}
