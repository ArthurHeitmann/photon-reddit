import Ph_DropDown, { DirectionX, DirectionY } from "../../scripts/components/misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../scripts/components/misc/dropDown/dropDownEntry/dropDownEntry.js";
import { $id } from "../../scripts/utils/htmlStuff.js";

let timeFrame = 1000 * 60 * 60 * 24;
const timeFrameLabels = [
	["hour", 1000 * 60 * 60],
	["day",  1000 * 60 * 60 * 24],
	["week", 1000 * 60 * 60 * 24 * 7],
	["month",1000 * 60 * 60 * 24 * 30],
	["year", 1000 * 60 * 60 * 24 * 365],
];
let timeFrameIndicator: HTMLElement;

function setTimeFrame([millis]) {
	timeFrame = millis;
	timeFrameIndicator.innerText = timeFrameLabels.find(value => value[1] === millis)[0].toString();
}

window.addEventListener("load", () => {
	$id("optionsRow").appendChild(new Ph_DropDown(
		timeFrameLabels.map(label => ( <DropDownEntryParam> {
			displayHTML: label[0],
			value: label[1],
			onSelectCallback: setTimeFrame
		})),
		"Time frame",
		DirectionX.right,
		DirectionY.bottom,
		false
	));
	$id("optionsRow").appendChild(timeFrameIndicator = document.createElement("div"));
	timeFrameIndicator.className = "timeFrameIndicator";
	timeFrameIndicator.innerText = "day";
});
