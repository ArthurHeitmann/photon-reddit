
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

export function escapeHTML(unsafeHTML: string): string {
	const dummy = document.createElement("div");
	dummy.innerText = unsafeHTML;
	return dummy.innerHTML;
}

export function escapeAttrDQ(unsafeAttribute: string): string {
	return unsafeAttribute.replace(`"`, `\\"`)
}

export function escapeAttrSQ(unsafeAttribute: string): string {
	return unsafeAttribute.replace(`'`, `\\'`)
}
