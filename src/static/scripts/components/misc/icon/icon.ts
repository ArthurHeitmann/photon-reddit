import { makeElement } from "../../../utils/utils";

export default class Ph_Icon extends HTMLElement {
	private imgSrc: string;
	private shadow: ShadowRoot;
	private img: Element;

	constructor(src?: string) {
		super();
		this.imgSrc = src ?? this.getAttribute("src");
		this.shadow = this.attachShadow({ mode: "open" });
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "/scripts/components/misc/icon/icon.css";
		this.shadow.appendChild(style);
		this.render();
	}

	set src(src: string) {
		this.imgSrc = src;
		this.render();
	}

	get src() {
		return this.imgSrc;
	}

	private render() {
		try {
			if (this.imgSrc.startsWith("/") && this.imgSrc.endsWith(".svg")) {
				this.renderSvg();
				return;
			}
		} catch (e) {
			console.error(e);
		}
		this.renderImg();
	}

	private renderImg() {
		this.img?.remove();
		this.img = makeElement("img", { src: this.imgSrc, alt: this.getAttribute("alt") });
		this.shadow.appendChild(this.img);
	}

	private async renderSvg() {
		const svgText = await fetch(this.imgSrc).then(r => r.text());
		const tmp = document.createElement("div");
		tmp.innerHTML = svgText;
		const svg = tmp.children[0];
		svg.setAttribute("alt", this.getAttribute("alt"));
		this.img?.remove();
		this.img = svg;
		this.shadow.appendChild(svg);
	}
}

customElements.define("ph-icon", Ph_Icon);
