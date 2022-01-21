import {
	MessageSection,
	MessageSectionsNamed,
	SortPostsOrder,
	SortPostsOrderNamed,
	SortPostsTimeFrame,
	SortPostsTimeframeNamed,
	SortSearchOrder,
	SortSearchOrderNamed,
	SortUserPostsOrder,
	SortUserPostsOrderNamed,
	UserSection,
	UserSectionsNamed
} from "../../../types/misc";
import {DropDownCallback, DropDownEntryParam} from "../../misc/dropDown/dropDownEntry/dropDownEntry";

export function makeGeneralSortSectionEntries(onSelect: DropDownCallback, isFrontpage): DropDownEntryParam[] {
	return [
		isFrontpage &&
		{ label: SortPostsOrderNamed[SortPostsOrder.best], 			labelImgUrl: "/img/rocket.svg", 	value: SortPostsOrder.best, 			onSelectCallback: onSelect },
		{ label: SortPostsOrderNamed[SortPostsOrder.hot], 			labelImgUrl: "/img/hot.svg", 		value: SortPostsOrder.hot, 				onSelectCallback: onSelect },
		{ label: SortPostsOrderNamed[SortPostsOrder.top], 			labelImgUrl: "/img/top.svg", 		value: SortPostsOrder.top, 				nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortPostsOrderNamed[SortPostsOrder.rising],		labelImgUrl: "/img/trendUp.svg", 	value: SortPostsOrder.rising, 			onSelectCallback: onSelect },
		{ label: SortPostsOrderNamed[SortPostsOrder.new], 			labelImgUrl: "/img/new.svg", 		value: SortPostsOrder.new, 				onSelectCallback: onSelect },
		{ label: SortPostsOrderNamed[SortPostsOrder.controversial],	labelImgUrl: "/img/lightning.svg", 	value: SortPostsOrder.controversial, 	nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortPostsOrderNamed[SortPostsOrder.gilded], 		labelImgUrl: "/img/award.svg", 		value: SortPostsOrder.gilded, 			onSelectCallback: onSelect },
	];
}

export function makeSearchSortSectionEntries(onSelect: DropDownCallback): DropDownEntryParam[] {
	return [
		{ label: SortSearchOrderNamed[SortSearchOrder.relevance], 	labelImgUrl: "/img/relevance.svg", 		value: SortSearchOrder.relevance, 	nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortSearchOrderNamed[SortSearchOrder.hot], 		labelImgUrl: "/img/hot.svg", 			value: SortSearchOrder.hot, 		nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortSearchOrderNamed[SortSearchOrder.top], 		labelImgUrl: "/img/top.svg", 			value: SortSearchOrder.top, 		nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortSearchOrderNamed[SortSearchOrder.new], 		labelImgUrl: "/img/new.svg", 			value: SortSearchOrder.new, 		onSelectCallback: onSelect },
		{ label: SortSearchOrderNamed[SortSearchOrder.comments], 	labelImgUrl: "/img/commentEmpty.svg", 	value: SortSearchOrder.comments, 	nestedEntries: makeTimeframeSectionEntries(onSelect) },
	];
}

export function makeTimeframeSectionEntries(onSelect: DropDownCallback): DropDownEntryParam[] {
	return [
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.hour], 	value: SortPostsTimeFrame.hour, 	onSelectCallback: onSelect },
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.day], 	value: SortPostsTimeFrame.day,		onSelectCallback: onSelect },
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.week], 	value: SortPostsTimeFrame.week, 	onSelectCallback: onSelect },
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.month], value: SortPostsTimeFrame.month, 	onSelectCallback: onSelect },
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.year], 	value: SortPostsTimeFrame.year, 	onSelectCallback: onSelect },
		{ label: SortPostsTimeframeNamed[SortPostsTimeFrame.all], 	value: SortPostsTimeFrame.all, 		onSelectCallback: onSelect },
	];
}

export function makeMessageSectionEntries(onSelect: DropDownCallback): DropDownEntryParam[] {
	return [
		{ label: MessageSectionsNamed[MessageSection.all], 				value: MessageSection.all, 				onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.unread], 			value: MessageSection.unread, 			onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.messages], 		value: MessageSection.messages, 		onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.commentReplies], 	value: MessageSection.commentReplies, 	onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.postReplies], 		value: MessageSection.postReplies, 		onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.mentions], 		value: MessageSection.mentions, 		onSelectCallback: onSelect },
		{ label: MessageSectionsNamed[MessageSection.sent], 			value: MessageSection.sent, 			onSelectCallback: onSelect },
	];
}

export function makeUserSortSectionEntries(onSelect: DropDownCallback): DropDownEntryParam[] {
	return [
		{ label: SortUserPostsOrderNamed[SortUserPostsOrder.hot], 			labelImgUrl: "/img/hot.svg", 		value: SortUserPostsOrder.hot, 				onSelectCallback: onSelect },
		{ label: SortUserPostsOrderNamed[SortUserPostsOrder.top], 			labelImgUrl: "/img/top.svg", 		value: SortUserPostsOrder.top, 				nestedEntries: makeTimeframeSectionEntries(onSelect) },
		{ label: SortUserPostsOrderNamed[SortUserPostsOrder.new], 			labelImgUrl: "/img/new.svg", 		value: SortUserPostsOrder.new, 				onSelectCallback: onSelect },
		{ label: SortUserPostsOrderNamed[SortUserPostsOrder.controversial], labelImgUrl: "/img/lightning.svg", 	value: SortUserPostsOrder.controversial, 	nestedEntries: makeTimeframeSectionEntries(onSelect) }
	];
}

export function makeUserSectionEntries(onSelect: DropDownCallback, isLoggedInUserFeed: boolean): DropDownEntryParam[] {
	return [
		{ label: UserSectionsNamed[UserSection.overview], 	value: UserSection.overview, 	onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.posts], 		value: UserSection.posts, 		onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.comments], 	value: UserSection.comments, 	onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.gilded],		value: UserSection.gilded, 		onSelectCallback: onSelect },
		...(isLoggedInUserFeed ? [
		{ label: UserSectionsNamed[UserSection.upvoted], 	value: UserSection.upvoted, 	onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.downvoted], 	value: UserSection.downvoted, 	onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.hidden], 	value: UserSection.hidden, 		onSelectCallback: onSelect },
		{ label: UserSectionsNamed[UserSection.saved], 		value: UserSection.saved, 		onSelectCallback: onSelect },
		] : [])
	];
}
