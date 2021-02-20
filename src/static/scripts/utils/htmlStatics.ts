/**
 * Some html related util function.
 *
 * These functions don't need any imports
 */

/** document.getElementById replacement */
export function $id(id: string) {
	return document.getElementById(id);
}

/** document.getElementsByClassName shorthand */
export function $class(c: string): HTMLCollection {
	return document.getElementsByClassName(c);
}

/** Array.from(document.getElementsByClassName) shorthand */
export function $classAr(c: string): Array<HTMLElement> {
	return Array.from(document.getElementsByClassName(c) as HTMLCollectionOf<HTMLElement>);
}

/** document.getElementsByTagName shorthand */
export function $tag(tag: string) {
	return document.getElementsByTagName(tag) as HTMLCollectionOf<HTMLElement>;
}

/** Array.from(document.getElementsByTagName) shorthand */
export function $tagAr(tag: string): Array<HTMLElement> {
	return Array.from(document.getElementsByTagName(tag) as HTMLCollectionOf<HTMLElement>);
}

/** document.querySelectorAll shorthand */
export function $css(query: string) {
	return document.querySelectorAll(query) as NodeListOf<HTMLElement>;
}

/** Array.from(document.querySelectorAll) shorthand */
export function $cssAr(query: string): Array<HTMLElement> {
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

/** escapes any text; returned string can safely be put in element.innerHTML */
export function escHTML(unsafeHTML: string): string {
	const dummy = document.createElement("div");
	dummy.innerText = unsafeHTML;
	return dummy.innerHTML;
}

/** escape attribute text, where attribute is a string in "double quotation marks" */
export function escADQ(unsafeAttribute: string): string {
	return unsafeAttribute?.replace(`"`, `\\"`)
}

export function getLoadingIcon(): HTMLImageElement {
	const loadingIcon = document.createElement("img");
	loadingIcon.alt = "loading";
	loadingIcon.src = "/img/loading.svg";
	return loadingIcon;
}