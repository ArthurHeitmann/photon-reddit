import { supportsIndexedDB } from "../../utils/browserFeatures";
import { broadcastMessage } from "../../utils/messageCommunication";

const dbName= "photonDb";
const objectStoreName = "users";
const version = 1;
interface DbUpgrade {
	wasUpgraded: boolean,
	fromVersion: number,
	toVersion: number,
}
export const wasDbUpgraded: DbUpgrade = {
	wasUpgraded: false,
	fromVersion: null,
	toVersion: null
};

function openDb(): Promise<IDBDatabase> {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const openRequest = window.indexedDB.open(dbName, version);
		openRequest.onsuccess = () => resolve(openRequest.result);
		openRequest.onerror = () => reject(openRequest.error);
		openRequest.onupgradeneeded = onDbUpgradeNeeded;
	});
}

function onDbUpgradeNeeded(this: IDBOpenDBRequest, e: IDBVersionChangeEvent) {
	const db = this.result;
	db.createObjectStore(objectStoreName);
	wasDbUpgraded.wasUpgraded = true;
	wasDbUpgraded.fromVersion = e.oldVersion;
	wasDbUpgraded.toVersion = e.newVersion;
}

function getDbObjectStoreValue(db: IDBDatabase, storeName: string, key: string): Promise<IDBObjectStore> {
	return new Promise<IDBObjectStore>((resolve, reject) => {
		const transaction = db.transaction(objectStoreName, "readonly");
		const objectStore = transaction.objectStore(objectStoreName);
		const idbRequest = objectStore.get(key);
		idbRequest.onerror = () => reject(idbRequest.error);
		idbRequest.onsuccess = e => {
			const res = idbRequest.result;
			resolve(idbRequest.result);
		};
	});
}

async function getFromDb(...keyPath: string[]): Promise<any> {
	const db = await openDb();
	let value = await getDbObjectStoreValue(db, objectStoreName, keyPath[0]);
	for (let i = 1; i < keyPath.length; i++)
		value = value[keyPath[i]];
	return value;
}

function setInDb(value: any, ...keyPath: string[]): Promise<void> {
	return new Promise(async (resolve, reject) => {
		const db = await openDb();
		let newVal = value;
		try {
			if (keyPath.length > 1) {
				const currentObj = await getDbObjectStoreValue(db, objectStoreName, keyPath[0]);
				let nestedObject = currentObj;
				for (let i = 1; i < keyPath.length - 1; i++) {
					nestedObject = nestedObject[keyPath[i]];
				}
				nestedObject[keyPath[keyPath.length - 1]] = value;
				newVal = currentObj;
			}
		} catch (e) {
			reject(e);
		}
		const transaction = db.transaction(objectStoreName, "readwrite");
		const objectStore = transaction.objectStore(objectStoreName);
		const putRequest = objectStore.put(newVal, keyPath[0]);
		putRequest.onsuccess = () => resolve();
		putRequest.onerror = () => reject(putRequest.error);
	});
}

function getAllKeysInDb(prefix: string): Promise<string[]> {
	return new Promise<string[]>(async (resolve, reject) => {
		const db = await openDb();
		const transaction = db.transaction(objectStoreName, "readonly");
		const objectStore = transaction.objectStore(objectStoreName);
		const allKeysRequest = objectStore.getAllKeys();
		allKeysRequest.onsuccess = () => resolve(
			allKeysRequest.result
				.map(key => String(key))
				.filter(key => key.startsWith(prefix))
		);
		allKeysRequest.onerror = () => reject(allKeysRequest.error);
	});
}

function deleteKeyFromDb(key: string): Promise<void> {
	return new Promise(async (resolve, reject) => {
		const db = await openDb();
		const transaction = db.transaction(objectStoreName, "readwrite");
		const objectStore = transaction.objectStore(objectStoreName);
		const deleteRequest = objectStore.delete(key);
		deleteRequest.onsuccess = () => resolve();
		deleteRequest.onerror = e => reject(e);
	});
}

function getFromLs(...keyPath: string[]): any {
	let value = JSON.parse(localStorage.getItem(keyPath[0]));
	for (let i = 1; i < keyPath.length; i++)
		value = value[keyPath[i]];
	return value;
}

function setInLs(value: any, ...keyPath: string[]): void {
	let newVal = value;
	if (keyPath.length > 1) {
		const currentObject = JSON.parse(localStorage.getItem(keyPath[0]));
		let nestedObject = currentObject;
		for (let i = 1; i < keyPath.length - 1; i++) {
			nestedObject = nestedObject[keyPath[i]];
		}
		nestedObject[keyPath[keyPath.length - 1]] = value;
		newVal = currentObject;
	}
	localStorage.setItem(keyPath[0], JSON.stringify(newVal));
}

function getAllKeysInLs(prefix: string): string[] {
	return Object
		.keys(localStorage)
		.filter(key => key.startsWith(prefix));
}
function deleteKeyFromLs(key: string): void {
	localStorage.removeItem(key);
}

export async function getFromStorage(...keyPath: string[]): Promise<any> {
	if (await supportsIndexedDB())
		return await getFromDb(...keyPath);
	else
		return getFromLs(...keyPath);
}

export async function setInStorage(value: any, ...keyPath: string[]): Promise<void> {
	if (await supportsIndexedDB())
		await setInDb(value, ...keyPath);
	else
		setInLs(value, ...keyPath);
	broadcastMessage({ type: "dataChanged" });
}

export async function getAllKeysInStorage(key: string = ""): Promise<string[]> {
	if (await supportsIndexedDB())
		return await getAllKeysInDb(key);
	else
		return getAllKeysInLs(key);
}

export async function deleteKey(key: string): Promise<void> {
	if (await supportsIndexedDB())
		await deleteKeyFromDb(key);
	else
		deleteKeyFromLs(key);
	broadcastMessage({ type: "dataChanged" });
}
