
let _isIdbSupported: boolean = null;
export function supportsIndexedDB(): Promise<boolean> {
	return new Promise((resolve) => {
		if (_isIdbSupported !== null) {
			resolve(_isIdbSupported);
			return;
		}
		if (!indexedDB) {
			resolve(_isIdbSupported = false);
			return;
		}
		const db = indexedDB.open("featureTest");
		db.onsuccess = () => {
			indexedDB.deleteDatabase("featureTest");
			resolve(_isIdbSupported = true);
		};
		db.onerror = () => {
			resolve(_isIdbSupported = false);
		};
	});
}

export function supportsServiceWorkers(): boolean {
	return Boolean(navigator.serviceWorker);
}
