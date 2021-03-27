/**
 * This service worker is responsible for updating css and js files, if there are more recent versions
 */

const CACHE_NAME = 'photon-cache-v1';
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
	"/img/appIcons/favicon-16x16.png"
];
enum Environment {
	PRODUCTION, DEVELOPMENT
}
let environment: Environment;

self.addEventListener("install", (e: InstallEvent) => {
	e.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => {
				console.log('Opened cache');
				return cache.addAll(forceCacheFiles);
			})
	);
});

self.addEventListener("activate", (e: ActivateEvent) => {
	environment = location.hostname === "localhost" ? Environment.DEVELOPMENT : Environment.PRODUCTION;
})

self.addEventListener('fetch', (event: FetchEvent) => {
	if (!event.request.url.startsWith(location.origin))
		return;

	let isDocument = event.request.destination === "document";
	if (!filetypesToCache.some(type => event.request.url.endsWith(type)) && !isDocument) {
		// console.log("skipping");
		return;
	}
	// console.log("fetch", event.request.url);

	let useCaches = environment === Environment.PRODUCTION;
	useCaches = useCaches && !isDocument;

	event.respondWith(
		(async () => {
			const cacheMatch = await caches.match(event.request)

			// Cache hit - return response
			if (cacheMatch && useCaches)
				return cacheMatch;

			let response: Response;
			try {
				response = await fetch(event.request);
			}
			catch {
				response = null;
			}

			// Check if we received a valid response
			if(!response || response.status !== 200 || response.type !== 'basic') {
				if (isDocument && (!response || response.type === "basic")) {		// if document and probably offline --> offline page
					const cache = await caches.open(CACHE_NAME);
					const keys = await cache.keys();
					const offlineRequest = keys.find(request => request.url.endsWith("/offline.html"));
					return await cache.match(offlineRequest);
				}
				return response;
			}

			// IMPORTANT: Clone the response. A response is a stream
			// and because we want the browser to consume the response
			// as well as the cache consuming the response, we need
			// to clone it so we have two streams.
			const responseToCache = response.clone();

			caches.open(CACHE_NAME)
				.then(cache => cache.put(event.request, responseToCache));

			return response;
		})()
	);
});

/**
 * At the moment service worker modules aren't supported yet.
 * Once they are this function should be replace with: import { extractPath } from "./scripts/utils/utils.js";
 *
 * extracts the path part from an uri; example: "reddit.com/r/all?query" --> "/r/all"
 */
function extractPath(uri: string):string {
	const matches = uri.match(/(?<!\/)\/(?!\/)[^?#]*/);
	return matches && matches[0] || "";
}
