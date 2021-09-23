
const dbName= "photonDb";
const objectStoreName = "users";
const version = 1;

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

export async function getFromDb(...keyPath: string[]): Promise<any> {
	const db = await openDb();
	let value = await getDbObjectStoreValue(db, objectStoreName, keyPath[0]);
	for (let i = 1; i < keyPath.length; i++)
		value = value[keyPath[i]];
	return value;
}

export function setInDb(value: any, ...keyPath: string[]): Promise<void> {
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

export async function getFromLs(...keyPath: string[]): Promise<any> {
	let value = JSON.parse(localStorage.getItem(keyPath[0]));
	for (let i = 1; i < keyPath.length; i++)
		value = value[keyPath[i]];
	return value;
}

export async function setInLs(value: any, ...keyPath: string[]): Promise<void> {
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
