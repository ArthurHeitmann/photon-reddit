/**
 * This service worker is responsible for updating & caching files, if there are more recent versions
 */
const version = "1.4.2";			/// <change version script>
const CACHE_NAME = `photon-cache-${version}`;
interface CacheDescription {
	hostname: "/" | string,
	path: string,
	fileEnding?: string
}
const typesToCache: CacheDescription[] = [
	{ hostname: "/", path: "/", fileEnding: "css|js|png|jpg|svg" },
	{ hostname: "/", path: "/api/youtube-dl" },
	// { hostname: "v.redd.it", path: "/", fileEnding: "mpd" },
	// { hostname: "api.imgur.com", path: "/" },
	// { hostname: "api.gfycat.com", path: "/" },
	// { hostname: "api.redgifs.com", path: "/" },
];
const forceCacheFiles = [
	"/index.html",
	"/offline.html",
	"/style/main.css",
	"/img/appIcons/favicon-16x16.png",
	"/favicon.ico"
];
const ttl = 1000 * 60 * 60 * 24 * 7;		// 7 days
enum Environment {
	production, development
}

self.addEventListener("install", (e: InstallEvent) => {
	console.log("Installing sw...");

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

self.addEventListener("fetch", (event: FetchEvent) => {
	const environment = location.hostname === "localhost" ? Environment.development : Environment.production;
	const url = new URL(event.request.url);

	let isDocument = event.request.destination === "document";
	if (!shouldUrlBeCached(url) && !isDocument)
		return;

	let useCaches = environment === Environment.production;
	useCaches = useCaches && !isDocument;

	event.respondWith(
		(async () => {
			const cacheMatch = await caches.match(event.request)
			const isExpired = cacheMatch && isResponseExpired(cacheMatch.headers);
			if (cacheMatch && useCaches && !isExpired)
				return cacheMatch;

			let response: Response;
			try {
				response = await fetch(event.request);
			}
			catch {
				response = null;
			}

			if(!response || response.status !== 200) {
				if (event.request.url.includes("useCachedIndexHtml")) {				// load index.html from cache even if offline
					const cache = await caches.open(CACHE_NAME);
					const keys = await cache.keys();
					const offlineRequest = keys.find(request => request.url.endsWith("/index.html"));
					return await cache.match(offlineRequest);
				}
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
	let postMessage;
	if (e.data["action"] === "updateAll") {
		await skipWaiting();
		postMessage = { action: "reload" };
	}
	else if (e.data["action"] === "purgeSvgsCache") {
		await purgeSvgsCache();
		postMessage = { action: "purgeSvgsCacheDone" };
	}

	if (postMessage) {
		const allClients = await clients.matchAll();
		for (const client of allClients)
			client.postMessage(postMessage);
	}
});

function shouldUrlBeCached(url: URL): boolean {
	const matchingTypes = typesToCache
		.filter(type => type.hostname === "*" || type.hostname === url.hostname || type.hostname === "/" && url.hostname === location.hostname)
		.filter(type => url.pathname.startsWith(type.path))
		.filter(type => !type.fileEnding || (new RegExp(`\.(${type.fileEnding})$`)).test(url.pathname));
	return matchingTypes.length > 0;
}

function isResponseExpired(headers: Headers): boolean {
	const date = headers.get("date");
	if (!date)
		return false;

	const now = Date.now();
	const dateValue = new Date(date).getTime();
	if (isNaN(dateValue))
		return false;
	return now - dateValue > ttl;
}

async function purgeSvgsCache() {
	const cache = await caches.open(CACHE_NAME);
	const keys = await cache.keys();
	const svgKeys = keys.filter(key => new URL(key.url).pathname.endsWith(".svg"));
	await Promise.all(svgKeys.map(key => cache.delete(key)));
}

// keep this, so that tsc treats this file as a module
export {};