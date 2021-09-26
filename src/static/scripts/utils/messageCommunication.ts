import { randomString } from "./utils";

export interface MessageFormat {
	type: string,
	randomId?: string,
	[other: string]: any
}
type MessageCallback = (msg: MessageFormat) => void;

const messageChannelKey = "messageChannel";
const messageListeners: MessageCallback[] = [];

export function onMessageBroadcast(listener: MessageCallback): void {
	messageListeners.push(listener);
}

export function removeMessageListener(listener: MessageCallback): void {
	const i = messageListeners.findIndex(l => l === listener);
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
		try {
			listener(msg);
		} catch (e) {
			console.error(e);
		}
	}
}
