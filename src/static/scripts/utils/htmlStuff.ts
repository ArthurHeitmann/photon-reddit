/**
 * Some html related util function
 *
 * Might import other files
 */

import Ph_PostImage from "../components/post/postBody/postImage/postImage.js";
import { pushLinkToHistoryComb } from "../historyState/historyStateManager.js";

/** Converts all same origin links of an element to SPA (single page application) links */
export function linksToSpa(elem: HTMLElement): void {
	if (elem instanceof HTMLAnchorElement) {
		setLinkOnClick(elem);
	}
	for (const a of elem.getElementsByTagName("a")) {
		setLinkOnClick(a);
	}
}

function setLinkOnClick(elem: HTMLAnchorElement) {
	if (elem.href.match(location.origin) && elem.target !== "_blank") {
		if (elem.href && elem.getAttribute("href")[0] !== "#")
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
export function linksToInlineImages(elem: HTMLElement) {
	const links = elem.$tag("a");
	for (let link of links) {
		// test for file endine
		if (!(/^[^?]+(?<!#.*)\.(png|jpg|jpeg|gif)(\?.*)?$/).test((link as HTMLAnchorElement).href))
			continue;
		// no images with http
		else if ((/^http:\/\//).test((link as HTMLAnchorElement).href))
			continue;
		// wikipedia & reddit exceptions
		else if ((/wikipedia\.org.*File:/).test((link as HTMLAnchorElement).href))
			continue;
		else if ((/preview\.redd\.it\/.*\.gif\?format=mp4/).test((link as HTMLAnchorElement).href))
			continue;

		const image = new Ph_PostImage([{originalUrl: (link as HTMLAnchorElement).href, caption: ""}]);
		link.innerHTML = "";
		link.appendChild(image);
		link.classList.add("inlineImage");

		(link as HTMLAnchorElement).onclick = (e: MouseEvent) => Boolean(e.ctrlKey);
	}
}

