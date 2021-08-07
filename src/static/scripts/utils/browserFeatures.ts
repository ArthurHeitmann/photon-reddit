

export function supportsIndexedDB(): Promise<boolean> {
	return new Promise((resolve) => {
		const db = indexedDB.open("featureTest");
		db.onsuccess = () => {
			indexedDB.deleteDatabase("firefoxPrivateModeTest");
			resolve(true);
		};
		db.onerror = () => {
			resolve(false);
		}
	})
}

export function supportsServiceWorkers(): boolean {
	return Boolean(navigator.serviceWorker);
}
