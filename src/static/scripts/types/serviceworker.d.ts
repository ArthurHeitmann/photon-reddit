// required web worker types

interface ExtendableEventInit extends EventInit {
}

/** Extends the lifetime of the install and activate events dispatched on the global scope as part of the service worker lifecycle. This ensures that any functional events (like FetchEvent) are not dispatched until it upgrades database schemas and deletes the outdated cache entries. */
interface ExtendableEvent extends Event {
	waitUntil(f: any): void;
}

declare var ExtendableEvent: {
	prototype: ExtendableEvent;
	new(type: string, eventInitDict?: ExtendableEventInit): ExtendableEvent;
};

/** This is the event type for fetch events dispatched on the service worker global scope. It contains information about the fetch, including the request and how the receiver will treat the response. It provides the event.respondWith() method, which allows us to provide a response to this fetch. */
interface FetchEvent extends ExtendableEvent {
	readonly clientId: string;
	readonly preloadResponse: Promise<any>;
	readonly replacesClientId: string;
	readonly request: Request;
	readonly resultingClientId: string;
	respondWith(r: Response | Promise<Response>): void;
}

declare var FetchEvent: {
	prototype: FetchEvent;
	new(type: string, eventInitDict: FetchEventInit): FetchEvent;
};

interface NotificationEventInit extends ExtendableEventInit {
	action?: string;
	notification: Notification;
}

/** This Push API interface provides methods which let you retrieve the push data sent by a server in various formats. */
interface PushMessageData {
	arrayBuffer(): ArrayBuffer;
	blob(): Blob;
	json(): any;
	text(): string;
}

declare var PushMessageData: {
	prototype: PushMessageData;
	new(): PushMessageData;
};

type PushMessageDataInit = BufferSource | string;

interface PushEventInit extends ExtendableEventInit {
	data?: PushMessageDataInit;
}

/** This Push API interface represents a push message that has been received. This event is sent to the global scope of a ServiceWorker. It contains the information sent from an application server to a PushSubscription. */
interface PushEvent extends ExtendableEvent {
	readonly data: PushMessageData | null;
}

declare var PushEvent: {
	prototype: PushEvent;
	new(type: string, eventInitDict?: PushEventInit): PushEvent;
};

/** The parameter passed into the onnotificationclick handler, the NotificationEvent interface represents a notification click event that is dispatched on the ServiceWorkerGlobalScope of a ServiceWorker. */
interface NotificationEvent extends ExtendableEvent {
	readonly action: string;
	readonly notification: Notification;
}

declare var NotificationEvent: {
	prototype: NotificationEvent;
	new(type: string, eventInitDict: NotificationEventInit): NotificationEvent;
};

interface SyncEventInit extends ExtendableEventInit {
	lastChance?: boolean;
	tag: string;
}

/** A sync action that is dispatched on the ServiceWorkerGlobalScope of a ServiceWorker.  */
interface SyncEvent extends ExtendableEvent {
	readonly lastChance: boolean;
	readonly tag: string;
}

declare var SyncEvent: {
	prototype: SyncEvent;
	new(type: string, init: SyncEventInit): SyncEvent;
};


/**
 * Copyright (c) 2018, Tiernan Cridland
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
 * granted, provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 *
 * Service Worker Typings to supplement lib.webworker.ts
 * @author Tiernan Cridland
 * @email tiernanc@gmail.com
 * @license: ISC
 *
 * lib.webworker.d.ts as well as an es5+ library (es5, es2015, etc) are required.
 * Recommended to be used with a triple slash directive in the files requiring the typings only.
 * e.g. your-service-worker.js, register-service-worker.js
 * e.g. /// <reference path="path/to/serviceworker.d.ts" />
 */

// Registration

interface WorkerNavigator {
	readonly serviceWorker: ServiceWorkerContainer;
}

interface ServiceWorkerContainer {
	readonly controller: ServiceWorker;
	readonly ready: Promise<ServiceWorkerRegistration>;
	oncontrollerchange: ((this: ServiceWorkerContainer, event: Event) => any) | null;
	onerror: ((this: ServiceWorkerContainer, event?: Event) => any) | null;
	// @ts-ignore
	onmessage: ((this: ServiceWorkerContainer, event: ServiceWorkerMessageEvent) => any) | null;
	getRegistration(scope?: string): Promise<ServiceWorkerRegistration>;
	getRegistrations(): Promise<ServiceWorkerRegistration[]>;
	register(url: string, options?: ServiceWorkerRegistrationOptions): Promise<ServiceWorkerRegistration>;
}

interface ServiceWorkerMessageEvent extends Event {
	readonly data: any;
	readonly lastEventId: string;
	readonly origin: string;
	readonly ports: ReadonlyArray<MessagePort> | null;
	readonly source: ServiceWorker | MessagePort | null;
}

interface ServiceWorkerRegistrationOptions {
	scope?: string;
}

// Client API

interface Client {
	readonly frameType: ClientFrameType;
}

type ClientFrameType = "auxiliary" | "top-level" | "nested" | "none";

// Events

/** This ServiceWorker API interface represents the event object of a message event fired on a service worker (when a channel message is received on the ServiceWorkerGlobalScope from another context) — extends the lifetime of such events. */
interface ExtendableMessageEvent extends ExtendableEvent {
	readonly data: any;
	readonly lastEventId: string;
	readonly origin: string;
	readonly ports: ReadonlyArray<MessagePort>;
	readonly source: Client | ServiceWorker | MessagePort | null;
}

interface ActivateEvent extends ExtendableEvent {
}

interface InstallEvent extends ExtendableEvent {
	readonly activeWorker: ServiceWorker;
}

// Fetch API

interface Body {
	// @ts-ignore
	readonly body: ReadableStream;
}

interface Headers {
	entries(): string[][];
	keys(): string[];
	values(): string[];
}

interface Response extends Body {
	readonly useFinalURL: boolean;
	clone(): Response;
	error(): Response;
	redirect(): Response;
}

// Notification API

interface Notification {
	// @ts-ignore
	readonly actions: NotificationAction[];
	readonly requireInteraction: boolean;
	readonly silent: boolean;
	readonly tag: string;
	readonly renotify: boolean;
	readonly timestamp: number;
	readonly title: string;
	// @ts-ignore
	readonly vibrate: number[];
	close(): void;
	requestPermission(): Promise<string>;
}

interface NotificationAction {
}

// ServiceWorkerGlobalScope

/** This ServiceWorker API interface represents the scope of a service worker client that is a document in a browser context, controlled by an active worker. The service worker client independently selects and uses a service worker for its own loading and sub-resources. */
interface WindowClient extends Client {
	readonly ancestorOrigins: ReadonlyArray<string>;
	readonly focused: boolean;
	readonly visibilityState: VisibilityState;
	focus(): Promise<WindowClient>;
	navigate(url: string): Promise<WindowClient | null>;
}

/** Provides access to Client objects. Access it via self.clients within a service worker. */
interface Clients {
	claim(): Promise<void>;
	get(id: string): Promise<any>;
	matchAll(options?: ClientQueryOptions): Promise<ReadonlyArray<Client>>;
	openWindow(url: string): Promise<WindowClient | null>;
}

interface FetchEventInit extends ExtendableEventInit {
	clientId?: string;
	preloadResponse?: Promise<any>;
	replacesClientId?: string;
	request: Request;
	resultingClientId?: string;
}

declare var clients: Clients;
declare var onactivate: ((event?: ActivateEvent) => any) | null;
declare var onfetch: ((event?: FetchEvent) => any) | null;
declare var oninstall: ((event?: InstallEvent) => any) | null;
declare var onnotificationclick: ((event?: NotificationEvent) => any) | null;
declare var onnotificationclose: ((event?: NotificationEvent) => any) | null;
declare var onpush: ((event?: PushEvent) => any) | null;
declare var onpushsubscriptionchange: (() => any) | null;
declare var onsync: ((event?: SyncEvent) => any) | null;
declare var registration: ServiceWorkerRegistration;

declare function skipWaiting(): void;
