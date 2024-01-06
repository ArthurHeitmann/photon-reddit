

export interface SVGAnimationElement extends SVGElement {
	beginElement(): void;
}

export interface SVGAnimateElement extends SVGAnimationElement {

}

export interface StoredData<T> {
	data: T,
	lastUpdatedMsUTC: number
}

export interface HistoryState {
	title: string,
	index: number,
	url: string,
	optionalData: any
}

export enum SortPostsOrder {
	default = "",
	best = "best",
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

export enum MessageSection {
	all = "inbox",
	unread = "unread",
	messages = "messages",
	commentReplies = "comments",
	postReplies = "selfreply",
	mentions = "mentions",
	sent = "sent",
}


type SectionToDisplayNameMap<T> = {
	[key in (T & string)]: string;
};

export const MessageSectionsNamed: SectionToDisplayNameMap<MessageSection> = {
	inbox: "Inbox",
	unread: "Unread",
	messages: "Messages",
	comments: "Comment Replies",
	selfreply: "Post Replies",
	mentions: "Username Mentions",
	sent: "Sent",
};

export const SortPostsOrderNamed: SectionToDisplayNameMap<SortPostsOrder> = {
	best: "Best",
	top: "Top",
	new: "New",
	controversial: "Controversial",
	"": "Default",
	hot: "Hot",
	gilded: "Gilded",
	rising: "Rising"
}

export const SortCommentsOrderNamed: SectionToDisplayNameMap<SortCommentsOrder> = {
	best: "Best",
	top: "Top",
	new: "New",
	controversial: "Controversial",
	old: "Old",
	qa: "Q & A",
	random: "Random",
}

export const SortUserPostsOrderNamed: SectionToDisplayNameMap<SortUserPostsOrder> = {
	top: "Top",
	new: "New",
	controversial: "Controversial",
	"": "Default",
	hot: "Hot",
}

export const UserSectionsNamed: SectionToDisplayNameMap<UserSection> = {
	"": "Overview",
	comments: "Comments",
	gilded: "Gilded",
	upvoted: "Upvoted",
	downvoted: "Downvoted",
	hidden: "Hidden",
	saved: "Saved",
	submitted: "Posts",
}

export const SortPostsTimeframeNamed: SectionToDisplayNameMap<SortPostsTimeFrame> = {
	hour: "Hour",
	day: "Day",
	week: "Week",
	month: "Month",
	year: "Year",
	all: "All",
}

export const SortSearchOrderNamed: SectionToDisplayNameMap<SortSearchOrder> = {
	relevance: "Relevance",
	hot: "Hot",
	top: "Top",
	new: "New",
	comments: "Comments",
}

export interface Changelog {
	[version: string]: {
		[header: string]: string[]
	}
}

export interface RedditApiUsageRecord {
	clientId: string;
	timeMillisUtc: number;
	endpoint: string;
	api: string;
	used?: number;
	remaining?: number;
}
