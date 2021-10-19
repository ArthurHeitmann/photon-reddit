
let _isIdbSupported: boolean = null;
export function supportsIndexedDB(): Promise<boolean> {
	return new Promise((resolve) => {
		// try load cached from localstorage
		if (_isIdbSupported === null && ["true", "false"].includes(localStorage.idbSupported))
			_isIdbSupported = localStorage.idbSupported === "true";
		// try return memory cached version
		if (_isIdbSupported !== null) {
			resolve(_isIdbSupported);
			return;
		}
		// test if supported
		if (!indexedDB) {
			resolve(_isIdbSupported = false);
			return;
		}
		const db = indexedDB.open("featureTest");
		db.onsuccess = () => {
			indexedDB.deleteDatabase("featureTest");
			localStorage.setItem("idbSupported", "true");
			resolve(_isIdbSupported = true);
		};
		db.onerror = () => {
			localStorage.setItem("idbSupported", "false");
			resolve(_isIdbSupported = false);
		};
	});
}

export function supportsServiceWorkers(): boolean {
	return Boolean(navigator.serviceWorker);
}
