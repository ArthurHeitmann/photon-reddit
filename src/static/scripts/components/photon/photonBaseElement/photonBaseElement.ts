import {PhEvents} from "../../../types/Events";

export default class Ph_PhotonBaseElement extends HTMLElement {
	private windowEventListeners: { eventName: string, listener: EventListener }[] = [];
	isCleanupProtected = false;

	constructor() {
		super();

		this.toggleAttribute("requiresCleanup", true);
	}

	addWindowEventListener<K extends keyof WindowEventMap>(eventName: K | string, f: EventListener, options?: boolean | AddEventListenerOptions) {
		this.windowEventListeners.push({ eventName, listener: f });
		window.addEventListener(eventName, f, options);
	}

	cleanup() {
		if (this.isCleanupProtected)
			return;
		for (const event of this.windowEventListeners)
			window.removeEventListener(event.eventName, event.listener);
		this.windowEventListeners = [];
	}

	connectedCallback() {
		this.dispatchEvent(new Event(PhEvents.added));
	}

	disconnectedCallback() {
		this.dispatchEvent(new Event(PhEvents.removed));
	}

	remove() {
		this.cleanup();
		super.remove()
	}
}

customElements.define("ph-base", Ph_PhotonBaseElement);
