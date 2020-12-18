
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
	keyRef;
	activatedElem: HTMLElement = null;

	constructor() {
		super();
		this.className = "draggableWrapper";
	}

	activateWith(elem: HTMLElement) {
		elem.addEventListener("mousedown", this.mouseDownRef = e => this.beginDrag(e));
		elem.addEventListener("mouseup", this.mouseUpRef = e => this.endDrag(e));
		elem.addEventListener("mouseleave", this.mouseLeaveRef = e => this.endDrag(e));
		elem.addEventListener("wheel", this.wheelRef = e => this.onZoom(e), { passive: false });
		// elem.addEventListener("keyup", this.keyRef = e => {
		// 	switch (e.code) {
		// 		case "ArrowUp":
		// 			this.addMoveXY(0, 50);
		// 			e.preventDefault();
		// 			break;
		// 		case "ArrowRight":
		// 			this.addMoveXY(-50, 0);
		// 			e.preventDefault();
		// 			break;
		// 		case "ArrowDown":
		// 			this.addMoveXY(0, -50);
		// 			e.preventDefault();
		// 			break;
		// 		case "ArrowLeft":
		// 			this.addMoveXY(50, 0);
		// 			e.preventDefault();
		// 			break;
		// 	}
		// }, { passive: false });
		this.activatedElem = elem;
	}

	deactivate() {
		if (this.activatedElem === null)
			throw "no dragging element active";

		this.activatedElem.removeEventListener("mousedown", this.mouseDownRef);
		this.activatedElem.removeEventListener("mouseup", this.mouseUpRef);
		this.activatedElem.removeEventListener("mouseleave", this.mouseLeaveRef);
		this.activatedElem.removeEventListener("wheel", this.wheelRef);
		this.activatedElem = null;
	}

	beginDrag(e: MouseEvent) {
		this.onmousemove = e => this.moveImage(e);
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	endDrag(e: MouseEvent) {
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
}

customElements.define("ph-draggable-wrapper", Ph_DraggableWrapper);
