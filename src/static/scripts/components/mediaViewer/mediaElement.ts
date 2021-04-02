import { DropDownEntryParam } from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_ProgressBar from "../misc/progressBar/progressBar.js";

export interface MediaElement {
	url:				string,
	caption?:			string,
	element:			HTMLElement,
	controls:			ControlsLayoutSlots,
}

export interface ControlsLayoutSlots {
	play?: 				HTMLElement[],
	leftItems?:			HTMLElement[],
	rightItems?:		HTMLElement[],
	settingsEntries?: 	DropDownEntryParam[],
	progressBar?:		Ph_ProgressBar,
}
