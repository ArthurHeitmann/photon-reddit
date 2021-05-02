/**
 * A toast notification that appears on the screen. Can have different severities and some other customization options.
 */
export default class Ph_Toast extends HTMLElement {
	/**
	 * @param level severity
	 * @param displayHtml message innerHTML
	 * @param options {}
	 * @param options.timeout if > 0 --> remove toast after n ms
	 * @param options.onConfirm if given will display accept or cancel buttons. When accept is pressed execute onConfirm
	 * @param options.onCancel executed when closing toast
	 */
	constructor(level: Level, displayHtml: string, options: { timeout?: number, onConfirm?: () => void, onCancel?: () => void } = {}) {
		super();

		this.className = "toast";
		this.style.setProperty("--theme", levelConfig[level].color);

		this.innerHTML = `
			<img src="${levelConfig[level].img}" alt="${levelConfig[level].text}" class="levelImg" draggable="false">
			<div class="textWrapper">
				<div class="title">${levelConfig[level].text}</div>
				<div class="info">${displayHtml}</div>
			</div>
			<button class="closeButton transparentButtonAlt">
				<img src="/img/close.svg" draggable="false" alt="close">
			</button>
		`;

		if (options.onConfirm !== undefined) {
			const confirmBtn = document.createElement("button");
			confirmBtn.className = "confirmButton transparentButtonAlt";
			confirmBtn.innerHTML = `<img src="/img/check.svg" draggable="false" class="confirm">`;
			confirmBtn.addEventListener("click", () => {
				this.removeSelf();
				options.onConfirm();
			});
			this.$class("closeButton")[0].insertAdjacentElement("beforebegin", confirmBtn);
		}

		this.$class("closeButton")[0].addEventListener("click", () => {
			if (options.onCancel)
				options.onCancel();
			this.removeSelf();
		});
		if (options.timeout > 0)
			setTimeout(this.removeSelf.bind(this), options.timeout);

		document.body.appendChild(this);
	}

	removeSelf() {
		this.classList.add("remove")
		setTimeout(() => {
			this.remove();
		}, 300);
	}
}

const levelConfig = {
	success: {
		text: "Success",
		color: "#388e3c",
		img: "/img/success.svg",
	},
	info: {
		text: "Info",
		color: "#1976d2",
		img: "/img/info.svg",
	},
	warning: {
		text: "Warning",
		color: "#f57c00",
		img: "/img/warning.svg",
	},
	error: {
		text: "Error",
		color: "#d32f2f",
		img: "/img/error.svg",
	}
}

export enum Level {
	success = "success", info = "info", warning = "warning", error = "error",
}

customElements.define("ph-toast", Ph_Toast);
