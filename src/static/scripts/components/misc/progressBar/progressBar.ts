import {PhEvents} from "../../../types/Events";
import {clamp, hasParams, throttle} from "../../../utils/utils";

/**
 * A progress bar that can optionally be changed/dragged by the user
 */
export default class Ph_ProgressBar extends HTMLElement {
	private dragMoveRef: (e: MouseEvent) => void;
	private dragEndRef: (e: MouseEvent) => void;

	constructor(draggable = false, throttleMs = 100) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "progressBar";
		const progressBar = document.createElement("div");
		progressBar.className = "progress";
		this.append(progressBar);

		const accessibilitySpacer = document.createElement("div");
		accessibilitySpacer.className = "accessibilitySpacer";
		this.append(accessibilitySpacer);

		if (draggable) {
			this.addEventListener("mousedown", this.dragStart.bind(this));
			this.dragMoveRef = throttleMs > 0 ? throttle(this.dragMove.bind(this), throttleMs) : this.dragMove.bind(this);
			this.dragEndRef = this.endDrag.bind(this);
		}
	}

	private dragStart(e) {
		this.classList.add("isDragging");
		this.sendEvent(e);
		window.addEventListener("mousemove", this.dragMoveRef);
		window.addEventListener("mouseup", this.dragEndRef);
	}

	private dragMove(e) {
		this.sendEvent(e);
	}

	private endDrag() {
		this.classList.remove("isDragging");
		window.removeEventListener("mousemove", this.dragMoveRef);
		window.removeEventListener("mouseup", this.dragEndRef);
	}

	private sendEvent(e: MouseEvent) {
		const bounds = this.getBoundingClientRect();
		const progress = clamp((e.clientX - bounds.left) / this.offsetWidth, 0, 1);
		this.dispatchEvent(new CustomEvent(PhEvents.drag, {detail: progress}));
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
