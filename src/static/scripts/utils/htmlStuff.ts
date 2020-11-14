import Ph_PostImage from "../components/post/postBody/postImage/postImage.js";
import { pushLinkToHistoryComb } from "../state/stateManager.js";

export function $id(id) { return document.getElementById(id); }
export function $class(c) { return document.getElementsByClassName(c); }
export function $tag(tag) { return document.getElementsByTagName(tag); }
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

export function classInElementTree(elem: HTMLElement, className: string): boolean {
	return Boolean(elem) && (elem.classList.contains(className) || classInElementTree(elem.parentElement, className));
}

export function elementWithClassInTree(elem: HTMLElement, className: string): HTMLElement {
	return elem && (elem.classList.contains(className) && elem || elementWithClassInTree(elem.parentElement, className));
}

export function linksToInlineImages(elem: HTMLElement) {
	const links = elem.getElementsByTagName("a");
	for (let link of links) {
		if (!(/^[^?]+\.(png|jpg|jpeg|gif)(\?.*)?$/).test(link.href))
			continue;

		const image = new Ph_PostImage([{ originalUrl: link.href, caption: "" }]);
		link.innerHTML = "";
		link.appendChild(image);
		link.classList.add("inlineImage");

		link.onclick = (e: MouseEvent) => Boolean(e.ctrlKey);
	}
}
