import { hasHTML } from "../../../../utils/utils.js";

export default class Ph_SpeedChanger extends HTMLElement {
	private readonly slowerBtn: HTMLButtonElement;
	private readonly currentSpeedElem: HTMLElement;
	private readonly fasterBtn: HTMLButtonElement;
	private currentSpeedIndex = 4;
	private static speedOptions = [0.1, 0.25, 0.5, 0.75, 1, 1.1, 1.25, 1.5, 2, 4, 8, 16];

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.slowerBtn = document.createElement("button");
		this.slowerBtn.className = "speedBtn transparentButtonAlt";
		this.slowerBtn.innerHTML = `<img src="/img/fastForward.svg" alt="faster">`;
		this.slowerBtn.addEventListener("click", () => {
			this.currentSpeedIndex = Math.max(0, this.currentSpeedIndex - 1);
			this.updateSpeedDisplay();
			this.dispatchEvent(new CustomEvent(
				"ph-speed-changed",
				{ detail: Ph_SpeedChanger.speedOptions[this.currentSpeedIndex] }
			));
		});
		this.currentSpeedElem = document.createElement("div");
		this.fasterBtn = document.createElement("button");
		this.fasterBtn.className = "speedBtn transparentButtonAlt";
		this.fasterBtn.innerHTML = `<img src="/img/fastForward.svg" alt="faster">`;
		this.fasterBtn.addEventListener("click", () => {
			this.currentSpeedIndex = Math.min(Ph_SpeedChanger.speedOptions.length - 1, this.currentSpeedIndex + 1);
			this.updateSpeedDisplay();
			this.dispatchEvent(new CustomEvent(
				"ph-speed-changed",
				{ detail: Ph_SpeedChanger.speedOptions[this.currentSpeedIndex] }
			));
		});

		this.updateSpeedDisplay();
		this.append(this.slowerBtn, this.currentSpeedElem, this.fasterBtn);
	}

	private updateSpeedDisplay() {
		this.currentSpeedElem.innerText = `${Ph_SpeedChanger.speedOptions[this.currentSpeedIndex]}x`;
		this.slowerBtn.disabled = this.currentSpeedIndex === 0;
		this.fasterBtn.disabled = this.currentSpeedIndex === Ph_SpeedChanger.speedOptions.length - 1;
	}
}

customElements.define("ph-speed-changer", Ph_SpeedChanger);
