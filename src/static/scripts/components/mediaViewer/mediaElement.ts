import { ControlsLayoutSlots } from "../misc/controlsBar/controlsBar.js";

export interface MediaElement {
	url: string,
	caption?: string,
	element: HTMLElement,
	controls: ControlsLayoutSlots,
	onKeyDownEvent?: (e: KeyboardEvent) => void;
}
