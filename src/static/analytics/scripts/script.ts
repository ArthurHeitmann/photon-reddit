import Ph_DropDown, {DirectionX, DirectionY} from "../../scripts/components/misc/dropDown/dropDown";
import {
	DropDownActionData,
	DropDownEntryParam
} from "../../scripts/components/misc/dropDown/dropDownEntry/dropDownEntry";
import {$class, $css, $id, escHTML} from "../../scripts/utils/htmlStatics";
import {numberToShort} from "../../scripts/utils/utils";

const timeFrameConfig = [
	["hour", 1000 * 60 * 60, 12],
	["day",  1000 * 60 * 60 * 24, 12],
	["week", 1000 * 60 * 60 * 24 * 7, 14],
	["month",1000 * 60 * 60 * 24 * 30, 30],
	["year", 1000 * 60 * 60 * 24 * 365, 52],
	["3 year", 1000 * 60 * 60 * 24 * 365 * 3, 12 * 2 * 3],
];
let timeFrame = timeFrameConfig[1][1];
let resolution = timeFrameConfig[1][2];
let timeFrameIndicator: HTMLElement;

function setTimeFrame(data: DropDownActionData) {
	const config = data.valueChain[0] as any[];
	timeFrame = config[1];
	resolution = config[2];
	timeFrameIndicator.innerText = timeFrameConfig.find(value => value[1] === timeFrame)[0].toString();
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
	const r = await fetch(`/data/events?timeFrame=${timeFrame}&resolution=${resolution}`);
	const uniqueClients: number[] = await r.json();

	const highestScaleFactor = Math.max(...uniqueClients) * 1.2 || 1;
	const graphWidth = 300;
	const graphHeight = 150;
	const infoWidth = 20;
	const infoHeight = 20;
	const xTicks = 0;
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
	$id("optionsRow").append(timeFrameIndicator = document.createElement("div"));
	timeFrameIndicator.className = "timeFrameIndicator";
	timeFrameIndicator.innerText = "day";
	$id("optionsRow").append(new Ph_DropDown(
		timeFrameConfig.map(label => ( <DropDownEntryParam> {
			label: label[0],
			value: label,
			onSelectCallback: setTimeFrame
		})),
		"Time frame",
		DirectionX.right,
		DirectionY.bottom,
		false
	));

	// @ts-ignore
	setTimeFrame( { valueChain: [timeFrameConfig[1]] });
});
