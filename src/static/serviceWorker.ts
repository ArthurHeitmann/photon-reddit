/**
 * This service worker is responsible for updating & caching files, if there are more recent versions
 */
const version = "0.1.0";
const CACHE_NAME = `photon-cache-${version}`;
const filetypesToCache = [
	".css",
	".js",
	".png",
	".jpg",
	".svg",
];
const forceCacheFiles = [
	"/offline.html",
	"/style/main.css",
	"/img/appIcons/favicon-16x16.png",
	"/favicon.ico"
];
enum Environment {
	PRODUCTION, DEVELOPMENT
}
let environment: Environment;

self.addEventListener("install", (e: InstallEvent) => {
	console.log("Installing sw...");
	environment = location.hostname === "localhost" ? Environment.DEVELOPMENT : Environment.PRODUCTION;
	e.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => {
				return cache.addAll(forceCacheFiles);
			})
	);
	console.log("Installed sw!");
});

self.addEventListener("activate", (e: ActivateEvent) => {
	console.log("Activating sw...");
	e.waitUntil((async () => {
		await clients.claim();

		const allCaches = await caches.keys();
		await Promise.all(allCaches.map(cacheName => {
			if (cacheName !== CACHE_NAME)
				return caches.delete(cacheName)
		}));
	})());
	console.log("Activated sw!");
});

self.addEventListener('fetch', (event: FetchEvent) => {
	const url = new URL(event.request.url);

	if (url.origin !== location.origin)
		return;

	let isDocument = event.request.destination === "document";
	if (!filetypesToCache.some(type => url.pathname.endsWith(type)) && !isDocument)
		return;

	let useCaches = environment === Environment.PRODUCTION;
	useCaches = useCaches && !isDocument;

	event.respondWith(
		(async () => {
			const cacheMatch = await caches.match(event.request)
			if (cacheMatch && useCaches)
				return cacheMatch;

			let response: Response;
			try {
				response = await fetch(event.request);
			}
			catch {
				response = null;
			}

			if(!response || response.status !== 200 || response.type !== 'basic') {
				if (isDocument && (!response || response.type === "basic")) {		// if document and connection problem --> offline page
					const cache = await caches.open(CACHE_NAME);
					const keys = await cache.keys();
					const offlineRequest = keys.find(request => request.url.endsWith("/offline.html"));
					return await cache.match(offlineRequest);
				}
				return response;
			}

			const responseToCache = response.clone();

			if (!isDocument) {
				caches.open(CACHE_NAME)
					.then(cache => cache.put(event.request, responseToCache));
			}

			return response;
		})()
	);
});

self.addEventListener("message", async (e: MessageEvent) => {
	if (e.data["action"] === "updateAll") {
		await skipWaiting();
		const allClients = await clients.matchAll();
		for (let client of allClients)
			client.postMessage({ action: "reload" });
	}
});
