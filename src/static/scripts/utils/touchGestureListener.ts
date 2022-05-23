/**
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
 */
import {PhEvents} from "../types/Events";

export default class TouchGestureListener {
	private activeTouches: Touch[] = [];
	private previousDistance: number = null;
	private hasDragStarted = false;
	private attached: HTMLElement;
	private readonly touchStartFunc;
	private readonly touchMoveFunc;
	private readonly touchEndFunc;
	private readonly touchCancelFunc;

	constructor(attachTo: HTMLElement) {
		this.touchStartFunc = this.onTouchStart.bind(this);
		this.touchMoveFunc = this.onTouchMove.bind(this);
		this.touchEndFunc = this.onTouchEnd.bind(this);
		this.touchCancelFunc = this.onTouchCancel.bind(this);
		this.attached = attachTo;
	}

	enable() {
		this.attached.addEventListener("touchstart", this.touchStartFunc, { passive: false });
		this.attached.addEventListener("touchmove", this.touchMoveFunc, { passive: false });
		this.attached.addEventListener("touchend", this.touchEndFunc);
		this.attached.addEventListener("touchcancel", this.touchCancelFunc);
	}

	disable() {
		this.attached.removeEventListener("touchstart", this.touchStartFunc);
		this.attached.removeEventListener("touchmove", this.touchMoveFunc);
		this.attached.removeEventListener("touchend", this.touchEndFunc);
		this.attached.removeEventListener("touchcancel", this.touchCancelFunc);
		this.activeTouches = [];
	}

	private onTouchStart(e: TouchEvent) {
		for (const touch of e.touches) {
			this.setOrUpdateTouch(touch);
		}
		this.hasDragStarted = false;
		this.previousDistance = null;
	}

	private onTouchEnd(e: TouchEvent) {
		for (const touch of e.changedTouches) {
			const touchIndex = this.activeTouches
				.findIndex(t => t.identifier === touch.identifier);
			this.activeTouches.splice(touchIndex, 1);
		}
		this.hasDragStarted = false;
		this.previousDistance = null;
	}

	private onTouchCancel(e: TouchEvent) {
		this.onTouchEnd(e);
	}

	private onTouchMove(e: TouchEvent) {
		e.preventDefault();
		// update event in active events
		for (const touch of e.changedTouches) {
			this.setOrUpdateTouch(touch);
		}

		// for dragging find average center of all touch points
		let xSum = 0, ySum = 0;
		for (const touch of this.activeTouches) {
			xSum += touch.clientX;
			ySum += touch.clientY;
		}
		const xAvr = xSum / this.activeTouches.length;
		const yAvr = ySum / this.activeTouches.length;

		let eventType: PhEvents;
		if (this.hasDragStarted)
			eventType = PhEvents.touchDrag;
		else {
			eventType = PhEvents.beginTouchPinch;
			this.hasDragStarted = true;
		}
		this.attached.dispatchEvent(new CustomEvent(
			eventType,
			{ detail: { x: xAvr, y: yAvr } }
		));

		// for zooming calculate distance  between 1. and 2. touch point
		if (this.activeTouches.length >= 2) {
			const xDelta = this.activeTouches[0].clientX - this.activeTouches[1].clientX;
			const yDelta = this.activeTouches[0].clientY - this.activeTouches[1].clientY;
			const distance = Math.sqrt(xDelta ** 2 + yDelta ** 2);
			const distanceChange = 1 - this.previousDistance / distance;
			if (this.previousDistance !== null) {
				this.attached.dispatchEvent(
					new CustomEvent(PhEvents.touchPinch, { detail: distanceChange })
				);
			}
			this.previousDistance = distance;
		}
		else
			this.previousDistance = null;
	}

	private setOrUpdateTouch(touch: Touch) {
		const touchIndex = this.activeTouches
			.findIndex(t => t.identifier === touch.identifier);
		if (touchIndex !== -1)
			this.activeTouches[touchIndex] = touch;
		else
			this.activeTouches.push(touch);
	}
}