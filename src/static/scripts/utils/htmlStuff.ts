import { pushLinkToHistoryComb, PushType } from "../state/stateManager.js";

export function $id(id): HTMLElement { return document.getElementById(id); };
export function $class(c): HTMLCollection { return document.getElementsByClassName(c); };
export function $tag(tag): HTMLCollection { return document.getElementsByTagName(tag); };
export function $css(query): NodeList { return document.querySelectorAll(query) }

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
	pushLinkToHistoryComb(e.currentTarget.getAttribute("href"));
	e.preventDefault();
	return false;
}
