
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

export interface HistoryState {
	title: string,
	index: number,
	url: string,
	optionalData: any
}

export interface PostSorting {
	order: SortPostsOrder,
	timeFrame?: SortPostsTimeFrame
}

export enum SortPostsOrder {
	default = "",
	hot = "hot",
	new = "new",
	top = "top",
	rising = "rising",
	controversial = "controversial",
	gilded = "gilded",
}

export enum SortUserPostsOrder {
	default = "",
	hot = "hot",
	new = "new",
	top = "top",
	controversial = "controversial",
}

export enum UserSection {
	overview = "",
	posts = "submitted",
	comments = "comments",
	gilded = "gilded",
	upvoted = "upvoted",
	downvoted = "downvoted",
	hidden = "hidden",
	saved = "saved",
}

export const NonSortableUserSections = [UserSection.gilded, UserSection.upvoted, UserSection.downvoted, UserSection.hidden, UserSection.saved];

export enum SortPostsTimeFrame {
	hour = "hour",
	day = "day",
	week = "week",
	month = "month",
	year = "year",
	all = "all",
}

export enum SortCommentsOrder {
	best = "best",
	top = "top",
	new = "new",
	controversial = "controversial",
	old = "old",
	qa = "qa",
	random = "random",
}

export enum SortSearchOrder {
	relevance = "relevance",
	hot = "hot",
	top = "top",
	new = "new",
	comments = "comments",
}

export interface Changelog {
	[version: string]: {
		[header: string]: string[]
	}
}
