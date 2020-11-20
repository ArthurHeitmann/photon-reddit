import Ph_PostImage from "../components/post/postBody/postImage/postImage.js";
import { pushLinkToHistoryComb } from "../state/stateManager.js";

export function $id(id) {
	return document.getElementById(id);
}

export function $class(c): HTMLCollection {
	return document.getElementsByClassName(c);
}

export function $classAr(c): Array<HTMLElement> {
	return <Array<HTMLElement>> Array.from(document.getElementsByClassName(c));
}

export function $tag(tag) {
	return document.getElementsByTagName(tag);
}

export function $tagAr(tag): Array<HTMLElement> {
	return Array.from(document.getElementsByTagName(tag));
}

export function $css(query) {
	return document.querySelectorAll(query);
}

export function $cssAr(query): Array<HTMLElement> {
	return Array.from(document.querySelectorAll(query));
}

Object.defineProperty(HTMLElement.prototype, "$id", {
	value: function(idName) {
		return this.getElementById(idName);
	}
});

Object.defineProperty(HTMLElement.prototype, "$class", {
	value: function(className) {
		return this.getElementsByClassName(className);
	}
});

Object.defineProperty(HTMLElement.prototype, "$classAr", {
	value: function(className) {
		return Array.from(this.getElementsByClassName(className));
	}
});

Object.defineProperty(HTMLElement.prototype, "$tag", {
	value: function(tagName) {
		return this.getElementsByTagName(tagName);
	}
});

Object.defineProperty(HTMLElement.prototype, "$tagAr", {
	value: function(tagName) {
		return Array.from(this.getElementsByTagName(tagName));
	}
});

Object.defineProperty(HTMLElement.prototype, "$css", {
	value: function(cssQuery) {
		return this.querySelectorAll(cssQuery);
	}
});

Object.defineProperty(HTMLElement.prototype, "$cssAr", {
	value: function(cssQuery) {
		return Array.from(this.querySelectorAll(cssQuery));
	}
});

export function linksToSpa(elem: HTMLElement): void {
	if (elem instanceof HTMLAnchorElement) {
		setLinkOnClick(elem);
	}
	for (const a of elem.getElementsByTagName("a")) {
		setLinkOnClick(a);
	}
}

function setLinkOnClick(elem: HTMLAnchorElement) {
	if (elem.href.match(location.origin)) {
		elem.onclick = linkOnClick;
	}
}

function linkOnClick(e) {
	if (e.ctrlKey) {
		return true;
	}

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
	const links = elem.$tag("a");
	for (let link of links) {
		if (!(/^[^?]+\.(png|jpg|jpeg|gif)(\?.*)?$/).test((link as HTMLAnchorElement).href)) {
			continue;
		}

		const image = new Ph_PostImage([{originalUrl: (link as HTMLAnchorElement).href, caption: ""}]);
		link.innerHTML = "";
		link.appendChild(image);
		link.classList.add("inlineImage");

		(link as HTMLAnchorElement).onclick = (e: MouseEvent) => Boolean(e.ctrlKey);
	}
}

export function escapeHTML(unsafeHTML: string): string {
	const dummy = document.createElement("div");
	dummy.innerText = unsafeHTML;
	return dummy.innerHTML;
}
