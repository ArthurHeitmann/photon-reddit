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
