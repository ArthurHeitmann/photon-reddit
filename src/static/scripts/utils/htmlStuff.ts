/**
 * Some html related util function
 *
 * Might import other files
 */

import { globalSettings, PhotonSettings } from "../components/global/photonSettings/photonSettings.js";
import Ph_MediaViewer from "../components/mediaViewer/mediaViewer.js";
import { pushLinkToHistoryComb } from "../historyState/historyStateManager.js";
import { $classAr } from "./htmlStatics.js";
import { _replaceRedditLinks } from "./utils.js";

export function linksToSpa(elem: HTMLElement, inlineMedia: boolean = false) {
	if (inlineMedia)
		_linksToInlineMedia(elem);
	_replaceRedditLinks(elem);
	_linksToSpa(elem);
}

/** Converts all same origin links of an element to SPA (single page application) links */
function _linksToSpa(elem: HTMLElement): void {
	if (elem instanceof HTMLAnchorElement) {
		setLinkOnClick(elem);
	}
	for (const a of elem.getElementsByTagName("a")) {
		setLinkOnClick(a);
	}
}

function setLinkOnClick(elem: HTMLAnchorElement) {
	if (elem.href.match(location.origin) && elem.target !== "_blank" && !elem.hasAttribute("excludeLinkFromSpa")) {
		if (elem.getAttribute("href")[0] !== "#")
			elem.onclick = linkOnClick;
	}
	else {
		elem.target = "_blank";
		elem.rel = "noopener";
	}
}

function linkOnClick(e) {
	if (e.ctrlKey)
		return true;
	pushLinkToHistoryComb(e.currentTarget.getAttribute("href"));
	return false;
}

/** checks whether className is in elem or any of it's parents class list */
export function classInElementTree(elem: HTMLElement, className: string): boolean {
	return Boolean(elem) && (elem.classList.contains(className) || classInElementTree(elem.parentElement, className));
}

/** finds the first element that has className and is (or a parent of) elem */
export function elementWithClassInTree(elem: HTMLElement, className: string): HTMLElement {
	return elem && (elem.classList.contains(className) && elem || elementWithClassInTree(elem.parentElement, className));
}

/** checks whether checkElement is (or is a child of) container */
export function isElementIn(container: HTMLElement, checkElement: HTMLElement): boolean {
	if (container === checkElement)
		return true;

	const parent = checkElement.parentElement;
	if (parent === null)
		return false;
	return isElementIn(container, parent);
}

/** converts all <a> where href ends with an image file extension to an <img>  */
export function _linksToInlineMedia(elem: HTMLElement) {
	const links = elem.$tag("a") as HTMLCollectionOf<HTMLAnchorElement>;
	for (const link of links) {
		if (link.hasAttribute("excludeLinkFromMedia") || link.classList.contains("inlineMediaViewer"))
			continue;
		const mediaViewer = Ph_MediaViewer.fromUrl(link.href)
		if (!mediaViewer)
			continue;

		link.classList.add("inlineMediaViewer");
		link.classList.toggle("isExpanded", !globalSettings.loadInlineMedia);

		const initial = document.createElement("span");
		initial.innerHTML = link.innerHTML;
		link.innerHTML = "";
		link.appendChild(initial);

		const expandButton = document.createElement("button");
		expandButton.innerHTML = `<img src="/img/arrowFilled.svg" alt="expand">`;
		link.onclick = e => {
			(e.currentTarget as HTMLElement).classList.toggle("isExpanded");
			return Boolean(e.ctrlKey);
		};
		link.click();
		link.appendChild(expandButton);

		link.insertAdjacentElement("afterend", mediaViewer);
		setTimeout(() => mediaViewer.controls.hideControls(), 0);

		link.setAttribute("excludeLinkFromSpa", "")
	}
}

window.addEventListener("settingsChanged", (e: CustomEvent) => {
	const changed = e.detail as PhotonSettings;
	if (!("loadInlineMedia" in changed))
		return;
	$classAr("inlineMediaViewer")
		.forEach(a => a.classList.toggle("isExpanded", changed.loadInlineMedia));
});
