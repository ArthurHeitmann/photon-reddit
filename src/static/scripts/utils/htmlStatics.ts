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
	const dummy = document.createElement("div");
	dummy.setAttribute("data-escape", unsafeAttribute);
	let out = dummy.outerHTML.match(/(?<=").*(?=")/s)[0];	// any text between the first " and last "
	out = out.replace(/'/g, "&apos;");			// ' --> &apos;
	return out;
}

export function getLoadingIcon(): HTMLImageElement {
	const loadingIcon = document.createElement("img");
	loadingIcon.alt = "loading";
	loadingIcon.src = "/img/loading.svg";
	loadingIcon.className = "loadingIcon";
	return loadingIcon;
}

export function nonDraggableImage(img: HTMLImageElement): HTMLImageElement {
	img.addEventListener("dragstart", e => {
		e.preventDefault();
		return false;
	});
	return img;
}

export function isElementInViewport(elem: HTMLElement) {
	const rect = elem.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= window.innerHeight &&
		rect.right <= window.innerWidth &&
		rect.width > 0 &&
		rect.height > 0
	)
}

export function disableMainScroll() {
	const initialWidth = document.body.offsetWidth;
	document.body.style.overflow = "hidden";
	const widthDiff = document.body.offsetWidth - initialWidth;
	document.body.style.marginRight = `${widthDiff}px`;
}

export function enableMainScroll() {
	document.body.style.overflow = "inherit";
	document.body.style.marginRight = ``;
}

export function disableMainPointerEvents() {
	const main = $tag("main")[0];
	main.style.pointerEvents = "none";
}

export function enableMainPointerEvents() {
	const main = $tag("main")[0];
	main.style.pointerEvents = "";
}

/**
 * Replaces all emoji flags with images from flagcdn.com.
 *
 * Windows (for political reasons) doesn't support flag emojis, so we have to fix it ourselves
 *
 * @param element
 */
export function emojiFlagsToImages(element: Element): void {
	// black magic from https://stackoverflow.com/a/67633661/9819447
	const flagEmojiToPNG = (flag) => {
		let countryCode = Array.from(flag, (codeUnit: string) => {
			return codeUnit.codePointAt(0);
		})
			.map(char => {
				return String.fromCharCode(char - 127397).toLowerCase();
			})
			.join("");
		countryCode = escADQ(countryCode);
		return `<img src="https://flagcdn.com/40x30/${countryCode}.webp" alt="${flag}" class="emojiFlag">`;
	};

	const reg = new RegExp("(?:\ud83c[\udde6-\uddff]){2}", "g");
	element.innerHTML = element.innerHTML.replaceAll(reg, flagEmojiToPNG);
}
