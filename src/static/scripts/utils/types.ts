

export interface RedditApiType {
	kind: string,
	data: RedditApiData
}

export interface RedditApiData {
	modhash: string,
	dist: number,
	children: RedditApiType[],
	before: string,
	after: string
}

export interface SVGAnimationElement extends SVGElement {
	beginElement(): void;
}

export interface SVGAnimateElement extends SVGAnimationElement {

}