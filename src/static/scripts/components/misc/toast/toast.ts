
export default class Ph_Toast extends HTMLElement {
	constructor(level: Level, displayHtml: string, timeout = -1) {
		super();

		this.className = "toast";
		this.style.setProperty("--theme", levelConfig[level].color);

		this.innerHTML = `
			<img src="${levelConfig[level].img}" alt="${levelConfig[level].text}" class="levelImg" draggable="false">
			<div class="textWrapper">
				<div class="title">${levelConfig[level].text}</div>
				<div class="info">${displayHtml}</div>
			</div>
			<button class="closeButton mla">
				<img src="/img/close.svg" draggable="false">
			</button>
		`;

		this.$class("closeButton")[0].addEventListener("click", this.removeSelf.bind(this));
		if (timeout > 0)
			setTimeout(this.removeSelf.bind(this), timeout);

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
	Success: {
		text: "Success",
		color: "#388e3c",
		img: "/img/success.svg",
	},
	Info: {
		text: "Info",
		color: "#1976d2",
		img: "/img/info.svg",
	},
	Warning: {
		text: "Warning",
		color: "#f57c00",
		img: "/img/warning.svg",
	},
	Error: {
		text: "Error",
		color: "#d32f2f",
		img: "/img/error.svg",
	}
}

export enum Level {
	Success = "Success", Info = "Info", Warning = "Warning", Error = "Error",
}

customElements.define("ph-toast", Ph_Toast);
