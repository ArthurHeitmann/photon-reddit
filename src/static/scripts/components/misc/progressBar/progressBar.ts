import { throttle } from "../../../utils/utils.js";

export default class Ph_ProgressBar extends HTMLElement {
	private dragMoveRef: (e: MouseEvent) => void;
	private dragEndRef: (e: MouseEvent) => void;

	constructor(draggable = false, throttleMs = 100) {
		super();

		this.className = "progressBar";
		const progressBar = document.createElement("div");
		progressBar.className = "progress";
		this.appendChild(progressBar);

		const accessibilitySpacer = document.createElement("div");
		accessibilitySpacer.className = "accessibilitySpacer";
		this.appendChild(accessibilitySpacer);

		if (draggable) {
			this.addEventListener("mousedown", this.dragStart.bind(this));
			this.dragMoveRef = throttleMs > 0 ? throttle(this.dragMove.bind(this), throttleMs) : this.dragMove.bind(this);
			this.dragEndRef = this.endDrag.bind(this);
		}
	}

	private dragStart(e) {
		this.sendEvent(e);
		this.addEventListener("mousemove", this.dragMoveRef);
		this.addEventListener("mouseup", this.dragEndRef);
		this.addEventListener("mouseleave", this.dragEndRef);
	}

	private dragMove(e) {
		this.sendEvent(e);
	}

	private endDrag(e) {
		this.removeEventListener("mousemove", this.dragMoveRef);
		this.removeEventListener("mouseup", this.dragEndRef);
		this.removeEventListener("mouseleave", this.dragEndRef);
	}

	private sendEvent(e: MouseEvent) {
		const progress = e.offsetX / this.offsetWidth;
		this.dispatchEvent(new CustomEvent("ph-drag", {detail: progress}));
		this.setProgress(progress);
	}

	setProgress(percentage: number): void {
		this.style.setProperty("--progress", percentage.toString());
	}

	getProgress(): number {
		return parseFloat(this.style.getPropertyValue("--progress"));
	}
}

customElements.define("ph-progress-bar", Ph_ProgressBar);
