/**
 * The children of this wrapper can be dragged around and zoomed in on with the mouse & scroll wheel
 */
export default class Ph_DraggableWrapper extends HTMLElement {
	prevX = 0;
	prevY = 0;
	moveX = 0;
	moveY = 0;
	scale = 1;
	mouseUpRef;
	mouseDownRef;
	mouseLeaveRef;
	wheelRef;
	// keyRef;
	// activatedElem: HTMLElement = null;

	constructor() {
		super();
		this.className = "draggableWrapper";
	}

	activate() {
		this.addEventListener("mousedown", this.mouseDownRef = this.beginDrag.bind(this));
		this.addEventListener("mouseup", this.mouseUpRef = this.endDrag.bind(this));
		this.addEventListener("mouseleave", this.mouseLeaveRef = this.endDrag.bind(this));
		this.addEventListener("wheel", this.wheelRef = this.onZoom.bind(this), { passive: false });
		// this.activatedElem = elem;
	}

	deactivate() {
		// if (this.activatedElem === null)
		// 	throw "no dragging element active";

		this.removeEventListener("mousedown", this.mouseDownRef);
		this.removeEventListener("mouseup", this.mouseUpRef);
		this.removeEventListener("mouseleave", this.mouseLeaveRef);
		this.removeEventListener("wheel", this.wheelRef);
		this.endDrag();
		// this.activatedElem = null;
	}

	beginDrag(e: MouseEvent) {
		this.onmousemove = e => this.moveImage(e);
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	endDrag() {
		this.onmousemove = null;
	}

	moveImage(e: MouseEvent) {
		this.addMoveXY(e.screenX - this.prevX, e.screenY - this.prevY)
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	onZoom(e: WheelEvent) {
		this.addZoom(e.deltaY > 0 ? -.15 : .15);
		e.preventDefault();
	}

	setZoom(val: number) {
		this.scale = val;
		this.style.setProperty("--img-zoom", this.scale.toString());
	}

	addZoom(val: number) {
		this.scale += val * this.scale;
		this.scale = Math.max(0.1, this.scale);
		this.style.setProperty("--img-zoom", this.scale.toString());
	}

	setMoveXY(x: number, y: number) {
		this.moveX = x;
		this.moveY = y;
		this.style.setProperty("--img-move-x", `${this.moveX}px`);
		this.style.setProperty("--img-move-y", `${this.moveY}px`);
	}

	addMoveXY(x: number, y: number) {
		this.moveX += x / this.scale;
		this.moveY += y / this.scale;
		this.style.setProperty("--img-move-x", `${this.moveX}px`);
		this.style.setProperty("--img-move-y", `${this.moveY}px`);
	}

	reset() {
		this.setMoveXY(0, 0);
		this.setZoom(1);
	}
}

customElements.define("ph-draggable-wrapper", Ph_DraggableWrapper);
