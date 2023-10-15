import { hasParams } from "../../../utils/utils";

/**
 * An svg with a path element. The path can be changed, so that it morphs between different paths
 */
export default class Ph_MorphingImage extends HTMLElement {
	svg: SVGElement;
	path: SVGPathElement;
	anim: SVGAnimateElement;

	constructor(initPath: string, viewBox: string, isButton = false) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "morphingImage  imgWrapper";


		this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		if (isButton) {
			const wrapperBtn = document.createElement("button");
			wrapperBtn.append(this.svg);
			wrapperBtn.style.display = "flex";
			this.append(wrapperBtn);
		}
		else
			this.append(this.svg);
		this.svg.setAttribute("viewBox", viewBox);

		this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.svg.append(this.path);
		this.path.setAttribute("d", initPath);
		this.path.setAttribute("fill", "var(--text-color)");

		this.anim = document.createElementNS("http://www.w3.org/2000/svg", "animate") as SVGAnimateElement;
		this.path.append(this.anim);
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
