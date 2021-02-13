/**
 * Normal button that dispatches a "ph-added"/"ph-removed" event when added/removed from the DOM
 */
export default class Ph_BetterButton extends HTMLButtonElement {
	connectedCallback() {
		this.dispatchEvent(new Event("ph-added"));
	}

	disconnectedCallback() {
		this.dispatchEvent(new Event("ph-removed"));
	}
}

customElements.define("ph-better-button", Ph_BetterButton, { extends: "button" });
