import {hasParams, sleep} from "../../../utils/utils";
import {escHTML} from "../../../utils/htmlStatics";

export interface ToastOptions {
	/** if > 0 --> remove toast after n ms */
	timeout?: number,
	/** if given will display accept or cancel buttons. When accept is pressed execute onConfirm */
	onConfirm?: () => void,
	/** executed when closing toast */
	onCancel?: () => void,
	/** if a toast with this Id already exists, a new one will not be created */
	groupId?: string
}

interface ActiveToastIds {
	[toastId: string]: Ph_Toast
}

/**
 * A toast notification that appears on the screen. Can have different severities and some other customization options.
 */
export default class Ph_Toast extends HTMLElement {
	private static activeToasts: ActiveToastIds = {};
	private removeTimout = null;
	private options: ToastOptions;

	/**
	 * @param level severity
	 * @param displayText message innerHTML
	 * @param options optional configuration
	 */
	constructor(level: Level, displayText: string, options: ToastOptions = {}) {
		super();
		if (!hasParams(arguments)) return;

		if ("groupId" in options) {
			if (options.groupId in Ph_Toast.activeToasts) {
				const existingToast = Ph_Toast.activeToasts[options.groupId];
				existingToast.options = options;
				existingToast.cancelRemove();
				existingToast.setRemoveAfter();
				return;
			}
			Ph_Toast.activeToasts[options.groupId] = this;
		}

		this.className = "toast";
		this.style.setProperty("--theme", levelConfig[level].color);
		this.style.setProperty("--theme-stronger", levelConfig[level].strongerColor);
		this.options = options;

		this.innerHTML = `
			<img src="${levelConfig[level].img}?noThemeOverride" alt="${levelConfig[level].text}" class="levelImg" draggable="false">
			<div class="textWrapper">
				<div class="title">${levelConfig[level].text}</div>
				<div class="info">${escHTML(displayText)}</div>
			</div>
			<button class="closeButton transparentButtonAlt">
				<img src="/img/close.svg?noThemeOverride" draggable="false" alt="✖">
			</button>
		`;

		if (options.onConfirm !== undefined) {
			const confirmBtn = document.createElement("button");
			confirmBtn.className = "confirmButton transparentButtonAlt";
			confirmBtn.innerHTML = `<img src="/img/check.svg?noThemeOverride" alt="✔" draggable="false" class="confirm">`;
			confirmBtn.addEventListener("click", this.onConfirm.bind(this));
			this.$class("closeButton")[0].insertAdjacentElement("beforebegin", confirmBtn);
		}

		this.addEventListener("mouseenter", this.cancelRemove.bind(this));
		this.addEventListener("mouseleave", this.setRemoveAfter.bind(this));

		this.$class("closeButton")[0].addEventListener("click", this.onCancel.bind(this));

		this.setRemoveAfter();

		document.body.appendChild(this);
	}

	onConfirm() {
		this.removeSelf();
		this.options.onConfirm();
	}

	onCancel() {
		if (this.options.onCancel)
			this.options.onCancel();
		this.removeSelf();
	}

	cancelRemove() {
		this.classList.remove("remove")
		clearTimeout(this.removeTimout);
		this.removeTimout = null;
		this.classList.remove("animate");
	}

	setRemoveAfter() {
		if (this.options.timeout > 0) {
			this.removeTimout = setTimeout(this.removeSelf.bind(this), this.options.timeout);
			this.classList.add("timeoutAnimation");
			requestAnimationFrame(
				// wait for next frame to render before starting animation
				() => sleep(0.1).then(
					() => this.classList.add("animate")));
			this.style.setProperty("--timeout-duration", `${this.options.timeout}ms`);
		}
	}

	removeSelf() {
		this.classList.add("remove")
		this.removeTimout = setTimeout(() => {
			delete Ph_Toast.activeToasts[this.options.groupId];
			this.remove();
		}, 300);
	}
}

const levelConfig = {
	success: {
		text: "Success",
		color: "#388e3c",
		strongerColor: "#1b5e20",
		img: "/img/success.svg",
	},
	info: {
		text: "Info",
		color: "#1976d2",
		strongerColor: "#0d47a1",
		img: "/img/info.svg",
	},
	warning: {
		text: "Warning",
		color: "#f57c00",
		strongerColor: "#e65100",
		img: "/img/warning.svg",
	},
	error: {
		text: "Error",
		color: "#d32f2f",
		strongerColor: "#b71c1c",
		img: "/img/error.svg",
	}
}

export enum Level {
	success = "success", info = "info", warning = "warning", error = "error",
}

customElements.define("ph-toast", Ph_Toast);
