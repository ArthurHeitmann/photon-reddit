/**
 * The children of this wrapper can be dragged around and zoomed in on with the mouse & scroll wheel
 */
import TouchGestureListener from "../../../../utils/touchGestureListener.js";

const zoomInPercent = 0.15;
const zoomOutPercent = -(1- 1 / 1.15);
export default class Ph_DraggableWrapper extends HTMLElement {
	prevX = 0;
	prevY = 0;
	moveX = 0;
	moveY = 0;
	scale = 1;
	rotate = 0;
	mouseUpRef;
	mouseDownRef;
	mouseLeaveRef;
	wheelRef;
	pinchRef;
	touchDragBeginRef;
	touchDragRef;
	pinchListener: TouchGestureListener;

	constructor() {
		super();

		this.className = "draggableWrapper";
		this.mouseDownRef = this.beginDrag.bind(this);
		this.mouseUpRef = this.endDrag.bind(this);
		this.mouseLeaveRef = this.endDrag.bind(this);
		this.wheelRef = this.onWheelZoom.bind(this);
		this.pinchRef = this.onTouchZoom.bind(this);
		this.touchDragBeginRef = this.beginTouchDrag.bind(this);
		this.touchDragRef = this.onTouchDrag.bind(this);
		this.pinchListener = new TouchGestureListener(this);
	}

	activate() {
		this.addEventListener("mousedown", this.mouseDownRef);
		this.addEventListener("mouseup", this.mouseUpRef);
		this.addEventListener("mouseleave", this.mouseLeaveRef);
		this.addEventListener("wheel", this.wheelRef, { passive: false });
		this.addEventListener("ph-touch-pinch", this.pinchRef, { passive: false });
		this.addEventListener("ph-begin-touch-pinch", this.touchDragBeginRef, { passive: false });
		this.addEventListener("ph-touch-drag", this.touchDragRef, { passive: false });
		this.pinchListener.enable();
	}

	deactivate() {
		this.removeEventListener("mousedown", this.mouseDownRef);
		this.removeEventListener("mouseup", this.mouseUpRef);
		this.removeEventListener("mouseleave", this.mouseLeaveRef);
		this.removeEventListener("wheel", this.wheelRef);
		this.removeEventListener("ph-touch-pinch", this.pinchRef);
		this.removeEventListener("ph-begin-touch-pinch", this.touchDragBeginRef);
		this.removeEventListener("ph-touch-drag", this.touchDragRef);
		this.pinchListener.disable();
		this.endDrag();
	}

	beginDrag(e: MouseEvent) {
		this.onmousemove = e => this.moveImage(e);
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	beginTouchDrag(e: CustomEvent) {
		this.prevX = e.detail.x;
		this.prevY = e.detail.y;
	}

	endDrag() {
		this.onmousemove = null;
	}

	moveImage(e: MouseEvent) {
		this.addMoveXY(e.screenX - this.prevX, e.screenY - this.prevY)
		this.prevX = e.screenX;
		this.prevY = e.screenY;
	}

	onTouchDrag(e: CustomEvent) {
		this.addMoveXY(e.detail.x - this.prevX, e.detail.y - this.prevY);
		this.prevX = e.detail.x;
		this.prevY = e.detail.y;
	}

	onWheelZoom(e: WheelEvent) {
		this.addZoom(e.deltaY > 0 ? zoomOutPercent : zoomInPercent);
		e.preventDefault();
	}

	onTouchZoom(e: CustomEvent) {
		const distanceChange = e.detail as number;
		this.addZoom(distanceChange);
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

	addRotation(deg: number) {
		this.rotate += deg;
		this.style.setProperty("--img-rotate", `${this.rotate}deg`);
	}

	setRotation(deg: number) {
		this.rotate = deg;
		this.style.setProperty("--img-rotate", `${this.rotate}deg`);
	}

	reset() {
		this.setMoveXY(0, 0);
		this.setZoom(1);
	}
}

customElements.define("ph-draggable-wrapper", Ph_DraggableWrapper);
