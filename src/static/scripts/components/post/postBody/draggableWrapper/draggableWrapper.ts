
export default class Ph_DraggableWrapper extends HTMLElement {
	prevX = 0;
	prevY = 0;
	moveX = 0;
	moveY = 0;
	scale = 1;

	constructor() {
		super();
		this.className = "draggableWrapper";
	}

	activateWith(elem: HTMLElement) {
		this.addEventListener("mousedown", e => this.beginDrag(e));
		this.addEventListener("mouseup", e => this.endDrag(e));
		this.addEventListener("mouseleave", e => this.endDrag(e));
		this.addEventListener("wheel", e => this.onZoom(e), { passive: true });
	}

	beginDrag(e: MouseEvent) {
		if (!(e.target as HTMLElement).classList.contains("draggable") && !(e.target as HTMLElement).classList.contains("dragThrough") )
			return

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
		this.addZoom(e.deltaY / -1000);
		this.addMoveXY(-e.deltaX, 0);
	}

	setZoom(val: number) {
		this.scale = val;
		this.style.setProperty("--img-zoom", this.scale.toString());
	}

	addZoom(val: number) {
		this.scale += val * this.scale;
		this.scale = Math.max(1, this.scale);
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
