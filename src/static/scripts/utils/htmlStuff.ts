import { pushLinkToHistoryComb } from "../state/stateManager.js";

export function $id(id) { return document.getElementById(id); };
export function $class(c) { return document.getElementsByClassName(c); };
export function $tag(tag) { return document.getElementsByTagName(tag); };
export function $css(query) { return document.querySelectorAll(query) }

export function linksToSpa(elem: HTMLElement): void {
	if (elem instanceof HTMLAnchorElement)
		setLinkOnClick(elem);
	for (const a of elem.getElementsByTagName("a"))
		setLinkOnClick(a);
}

function setLinkOnClick(elem: HTMLAnchorElement) {
	if (elem.href.match(location.origin))
		elem.onclick = linkOnClick;
}

function linkOnClick(e) {
	if (e.ctrlKey)
		return true;

	pushLinkToHistoryComb(e.currentTarget.getAttribute("href"));
	
	return false;
}
