interface HTMLElement {
	$id: (idName: string) => HTMLElement;
	$class: (className: string) => HTMLCollection;
	$classAr: (className: string) => Array<HTMLElement>;
	$tag: (tagName: string) => HTMLCollection;
	$tagAr: (tagName: string) => Array<HTMLElement>;
	$css: (cssQuery: string) => HTMLCollection;
	$cssAr: (cssQuery: string) => Array<HTMLElement>;
}

interface SVGAnimateElement extends SVGElement {
	beginElement: () => any;
}

interface Element {
	webkitRequestFullscreen: () => void;
	webkitExitFullscreen: () => void;
	onwebkitfullscreenchange: (event: Event) => void;
}

interface Document {
	webkitRequestFullscreen: () => void;
	webkitExitFullscreen: () => void;
	webkitFullscreenElement: Element;
	onwebkitfullscreenchange: (event: Event) => void;
}
