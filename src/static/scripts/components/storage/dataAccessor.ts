import { supportsIndexedDB } from "../../utils/browserFeatures";
import { getFromDb, getFromLs, setInDb, setInLs } from "./indexedDbWrapper";

export default abstract class DataAccessor<T> {
    abstract prefix: string;

	get<k0 extends keyof T>(...keys: [k0]): Promise<T[k0]>;
	get<k0 extends keyof T, k1 extends keyof T[k0]>(...keys: [k0, k1]): Promise<T[k0][k1]>;
	get<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(...keys: [k0, k1]): Promise<T[k0][k1][k2]>;
	async get(...keys: string[]): Promise<any> {
		return await supportsIndexedDB()
			? await getFromDb(this.prefix, ...keys)
			: await getFromLs(this.prefix, ...keys)
	}

	set<k0 extends keyof T>(keys: [k0], value: T[k0]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0]>(keys: [k0, k1], value: T[k0][k1]): Promise<void>;
	set<k0 extends keyof T, k1 extends keyof T[k0], k2 extends keyof T[k0][k1]>(keys: [k0, k1], value: T[k0][k1][k2]): Promise<void>;
	async set(keys: string[], value: any): Promise<any> {
		return await supportsIndexedDB()
			? await setInDb(value, this.prefix, ...keys)
			: await setInLs(value, this.prefix, ...keys);
	}
}
