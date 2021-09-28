/**
 * Some html related util function
 *
 * Might import other files
 */

import { PhotonSettings } from "../components/global/photonSettings/photonSettings";
import Ph_MediaViewer from "../components/mediaViewer/mediaViewer";
import Users from "../components/multiUser/userManagement";
import { pushLinkToHistoryComb } from "../historyState/historyStateManager";
import { $classAr } from "./htmlStatics";

/** Converts all same origin links of an element to SPA (single page application) links */
export function linksToSpa(elem: HTMLElement, inlineMedia: boolean = false) {
	if (inlineMedia)
		_linksToInlineMedia(elem);
	_replaceRedditLinks(elem);
	_linksToSpa(elem);
}

function _linksToSpa(elem: HTMLElement): void {
	if (elem instanceof HTMLAnchorElement) {
		setLinkOnClick(elem);
	}
	for (const a of elem.getElementsByTagName("a")) {
		setLinkOnClick(a);
	}
}

/** replaces all href in <a> like: https://reddit.com/r/all --> /r/all */
export function _replaceRedditLinks(el: HTMLElement) {
	for (const a of el.$tag("a") as HTMLCollectionOf<HTMLAnchorElement>) {
		if (a.hasAttribute("excludeLinkFromSpa")) {
			continue;
		}
		a.href = a.getAttribute("href")
			.replaceAll(/redd.it\/(\w+)/g, "reddit.com/comments/$1");
		a.href = a.getAttribute("href")        // map all reddit or same origin links to current origin (reddit.com/r/all --> /r/all)
			.replaceAll(new RegExp(`(https?://)((\\w)*\.?reddit\\.com|${location.hostname})`, "g"), "");
		if (!a.getAttribute("href")) {
			a.href = "/";
		}
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
export function classInElementTree(elem: Element, className: string): boolean {
	return Boolean(elem) && (elem.classList.contains(className) || classInElementTree(elem.parentElement, className));
}

/** checks whether tagName is elem or any of it's parents */
export function tagInElementTree(elem: Element, tagName: string): boolean {
	return Boolean(elem) &&
		(
			elem.tagName.toLowerCase() === tagName.toLowerCase()
			|| tagInElementTree(elem.parentElement, tagName)
		);
}

/** finds the first element that has className and is (or a parent of) elem */
export function elementWithClassInTree(elem: HTMLElement, className: string): HTMLElement {
	return elem && (elem.classList.contains(className) && elem || elementWithClassInTree(elem.parentElement, className));
}

/** checks whether checkElement is (or is a child of) container */
export function isElementIn(container: Element, checkElement: HTMLElement): boolean {
	if (container === checkElement)
		return true;

	const parent = checkElement.parentElement;
	if (parent === null)
		return false;
	return isElementIn(container, parent);
}

/** converts all <a> where href ends with an image file extension to a MediaViewer */
export function _linksToInlineMedia(elem: HTMLElement) {
	const links = elem.$tag("a") as HTMLCollectionOf<HTMLAnchorElement>;
	for (const link of links) {
		if (link.hasAttribute("excludeLinkFromMedia") || link.classList.contains("inlineMediaViewer"))
			continue;
		if (!Ph_MediaViewer.isUrlMedia(link.href))
			continue;

		if (link.children[0]?.tagName === "IMG")
			link.innerText = link.href
		link.classList.add("inlineMediaViewer");
		link.onclick = (e: MouseEvent) => {
			const link = e.currentTarget as HTMLAnchorElement;
			if (!(link.nextElementSibling instanceof Ph_MediaViewer)) {
				const mediaViewer = Ph_MediaViewer.fromUrl(link.href);
				link.after(mediaViewer);
				setTimeout(() => mediaViewer.controls.hideControls(), 0);
			}
			link.classList.toggle("isExpanded");
			return Boolean(e.ctrlKey)
		}
		if (Users.current.d.photonSettings.loadInlineMedia)
			link.click();
		link.setAttribute("excludeLinkFromSpa", "")
	}
}

window.addEventListener("ph-settings-changed", (e: CustomEvent) => {
	const changed = e.detail as PhotonSettings;
	if (!("loadInlineMedia" in changed))
		return;
	for (const a of $classAr("inlineMediaViewer")) {
		if (a.classList.contains("isExpanded") !== changed.loadInlineMedia)
			a.click();
	}
});
