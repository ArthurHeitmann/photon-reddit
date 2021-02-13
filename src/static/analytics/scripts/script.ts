import Ph_DropDown, { DirectionX, DirectionY } from "../../scripts/components/misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../scripts/components/misc/dropDown/dropDownEntry/dropDownEntry.js";
import { $class, $css, $id, escHTML } from "../../scripts/utils/htmlStatics.js";
import { numberToShort } from "../../scripts/utils/utils.js";

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
	const r = await fetch(`/data/uniqueClients?timeFrame=${timeFrame}`);
	const uniqueClients = await r.text();
	$css(".uniqueClients .replaceHere")[0].innerText = uniqueClients.toString();
}

async function loadEventsGraph() {
	const resolution = 15;
	const r = await fetch(`/data/events?timeFrame=${timeFrame}&resolution=${resolution}`);
	const uniqueClients: number[] = await r.json();

	const highestScaleFactor = Math.max(...uniqueClients) * 1.2 || 1;
	const graphWidth = 300;
	const graphHeight = 150;
	const infoWidth = 20;
	const infoHeight = 20;
	const xTicks = /*resolution - 1*/ 0;
	const xTickWidth = graphWidth / (xTicks + 1)
	const yTicks = 4;
	const yTickHeight = graphHeight / yTicks;
	const svgWidth = graphWidth + infoWidth;
	const svgHeight = graphHeight + infoHeight;
	const stepSize = graphWidth / uniqueClients.length;
	let graphPath = `M ${infoWidth + 2} ${graphHeight * (1 - uniqueClients[0] / highestScaleFactor)} `;
	for (let i = 1; i < uniqueClients.length; i++) {
		graphPath += `L ${i * stepSize + infoWidth} ${graphHeight * (1 - uniqueClients[i] / highestScaleFactor)} `;
	}

	let newHtml = `
		<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" >
			<path d="
				M ${infoWidth} ${graphHeight} L ${infoWidth + graphWidth} ${graphHeight}
				M ${infoWidth} ${graphHeight} L ${infoWidth} 0
				${ Array(xTicks).fill(0).map((_, i) =>			// x ticks 
					`M ${(i + 1) * xTickWidth + infoWidth} ${graphHeight} L ${(i + 1) * xTickWidth + infoWidth} ${graphHeight + 2}`).join(" ") }
				${ Array(yTicks).fill(0).map((_, i) =>			// y ticks 
					`M ${infoWidth - 2} ${(i + 1) * yTickHeight} L ${infoWidth} ${(i + 1) * yTickHeight}`).join(" ") }
				
			" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" stroke="var(--text-color)" fill="none" opacity="1"></path>
			${ Array(yTicks).fill(0).map((_, i) =>			// y ticks labels 
				`<text x="${0}" y="${graphHeight - i * yTickHeight}">${numberToShort(Math.round(i * highestScaleFactor / yTicks))}</text>`).join("\n") }
			<path d="${graphPath}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke="#ff6363" fill="none"></path
		</svg>
	`;
	($class("eventsGraph")[0] as HTMLElement).innerHTML = newHtml;
}

async function loadPopularPaths() {
	const r = await fetch(`/data/popularPaths?timeFrame=${timeFrame}&limit=10`);
	const popularPaths: { path: string, percent: number }[] = await r.json();
	let newHtml = "";
	const highestPercentage = popularPaths[0]?.percent;
	for (const path of popularPaths) {
		newHtml += `
			<div class="barRow">
				<div class="bar" style="--percent: ${path.percent / highestPercentage}"></div>
				<div class="label">
					<span class="percentage">${(path.percent * 100).toFixed(1)} %</span>
					<span>${escHTML(path.path)}</span>
				</div>
			</div>
		`;
	}
	($class("popularPaths")[0] as HTMLElement).innerHTML = newHtml;
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

// setInterval(() => setTimeFrame([timeFrame]), 1000 * 30);
