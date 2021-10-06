import { PhEvents } from "../types/Events.js";
import { randomString } from "./utils";

export interface MessageFormat {
	type: PhEvents,
	randomId?: string,
	[other: string]: any
}
type MessageCallback = (msg: MessageFormat) => void;

const messageChannelKey = "messageChannel";
const messageListeners: { callback: MessageCallback, typeFilter?: PhEvents }[] = [];

export function onMessageBroadcast(listener: MessageCallback, type?: PhEvents): void {
	messageListeners.push({ callback: listener, typeFilter: type });
}

export function removeMessageListener(listener: MessageCallback): void {
	const i = messageListeners.findIndex(l => l.callback === listener);
	if (i !== -1)
		messageListeners.splice(i, 1);
}

export function broadcastMessage(msg: MessageFormat) {
	msg.randomId = randomString(32);
	localStorage.setItem(messageChannelKey, JSON.stringify(msg));
}

window.addEventListener("storage", onLocalstorageChanged);
function onLocalstorageChanged(e: StorageEvent) {
	if (e.key !== messageChannelKey)
		return;
	const msg: MessageFormat = JSON.parse(e.newValue);
	for (const listener of messageListeners) {
		if (listener.typeFilter && listener.typeFilter !== msg.type)
			continue;
		try {
			listener.callback(msg);
		} catch (e) {
			console.error(e);
		}
	}
}
