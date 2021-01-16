import Ph_DropDown, { DirectionX, DirectionY } from "../../scripts/components/misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../scripts/components/misc/dropDown/dropDownEntry/dropDownEntry.js";
import { $class, $css, $id } from "../../scripts/utils/htmlStuff.js";

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
	loadUniqueClients();
	loadEventsGraph();
	loadPopularPaths();
}

async function loadUniqueClients() {
	const r = await fetch(`/uniqueClientsByTime?timeFrame=${timeFrame}`);
	const uniqueClients = await r.text();
	$css(".uniqueClients .replaceHere")[0].innerText = uniqueClients.toString();
}

async function loadEventsGraph() {
	const r = await fetch(`/eventsByTime?timeFrame=${timeFrame}&resolution=15`);
	const uniqueClients = await r.json();
	($class("eventsGraph")[0] as HTMLElement).innerText = JSON.stringify(uniqueClients, null, 4);
}

async function loadPopularPaths() {
	const r = await fetch(`/popularPathsByTime?timeFrame=${timeFrame}&limit=10`);
	const popularPaths = await r.json();
	($class("popularPaths")[0] as HTMLElement).innerText = JSON.stringify(popularPaths, null, 4);
}

window.addEventListener("load", () => {
	$id("optionsRow").appendChild(timeFrameIndicator = document.createElement("div"));
	timeFrameIndicator.className = "timeFrameIndicator";
	timeFrameIndicator.innerText = "day";
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

	setTimeFrame([timeFrame]);
});

setTimeout(() => setTimeFrame([timeFrame]), 1000 * 30);
