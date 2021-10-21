const isLockOwnerMap: { [name: string]: boolean } = {};

export async function createLock(name: string): Promise<void> {
	await new Promise<void>(async resolve => {
		if (name in localStorage) {
			const onLsChanged = () => {
				if (name in localStorage)
					return;
				window.removeEventListener("storage", onLsChanged);
				clearTimeout(unlockTimeout);
				resolve();
			};
			window.addEventListener("storage", onLsChanged);
			const unlockFallbackFunc = async () => {
				window.removeEventListener("storage", onLsChanged);
				clearTimeout(unlockTimeout);
				unlock(name);
				resolve();
			};
			const unlockTimeout = setTimeout(unlockFallbackFunc, 7500);
		}
		else {
			resolve();
		}
	});
	isLockOwnerMap[name] = true;
	localStorage.setItem(name, "");
}

export function unlock(name: string): void {
	isLockOwnerMap[name] = false;
	localStorage.removeItem(name);
}

window.addEventListener("beforeunload", () => {
	for (const [name, isOwner] of Object.entries(isLockOwnerMap)) {
		if (isOwner)
			unlock(name);
	}
});
