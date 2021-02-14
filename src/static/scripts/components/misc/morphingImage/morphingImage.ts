/**
 * An svg with a path element. The path can be changed, so that it morphs between different paths
 */
export default class Ph_MorphingImage extends HTMLElement {
	svg: SVGElement;
	path: SVGPathElement;
	anim: SVGAnimateElement;

	constructor(initPath: string, viewBox: string, isButton = false) {
		super();

		this.classList.add("morphingImage");


		this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		if (isButton) {
			const wrapperBtn = document.createElement("button");
			wrapperBtn.appendChild(this.svg);
			this.appendChild(wrapperBtn);
		}
		else
			this.appendChild(this.svg)
		this.svg.setAttribute("viewBox", viewBox);

		this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.svg.appendChild(this.path);
		this.path.setAttribute("d", initPath);
		this.path.setAttribute("fill", "#e4e4e4");

		this.anim = document.createElementNS("http://www.w3.org/2000/svg", "animate") as SVGAnimateElement;
		this.path.appendChild(this.anim);
		this.anim.setAttribute("attributeName", "d");
		this.anim.setAttribute("dur", "0.15s");
		this.anim.setAttribute("fill", "freeze");
		this.anim.setAttribute("begin", "indefinite");
		this.anim.setAttribute("from", initPath);
		this.anim.setAttribute("to", initPath);
	}

	changePath(newPath: string) {
		this.anim.setAttribute("from", this.anim.getAttribute("to"));
		this.anim.setAttribute("to", newPath);
		this.anim.beginElement();
	}
}

customElements.define("ph-morphing-image", Ph_MorphingImage);
