
export default class Ph_PhotonBaseElement extends HTMLElement {
	windowEventListeners: { eventName: string, listener: EventListener }[] = [];

	constructor() {
		super();

		this.toggleAttribute("requiresCleanup", true);
	}

	addWindowEventListener(eventName: string, f: EventListener, options?: boolean | AddEventListenerOptions) {
		this.windowEventListeners.push({ eventName, listener: f });
		window.addEventListener(eventName, f, options);
	}

	cleanup() {
		for (let event of this.windowEventListeners)
			window.removeEventListener(event.eventName, event.listener);
		this.windowEventListeners = [];
	}

	connectedCallback() {
		this.dispatchEvent(new Event("ph-added"));
	}

	disconnectedCallback() {
		this.dispatchEvent(new Event("ph-removed"));
	}

	remove() {
		this.cleanup();
		super.remove()
	}
}
