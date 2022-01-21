/**
 * Handle universal feed header items and sorting changes
 */

import Ph_FeedInfo, {FeedType} from "../feedInfo/feedInfo";
import {fakeSubreddits} from "../../../utils/consts";
import FeedInfoFactory from "../feedInfo/feedInfoFactory";
import RedditListingStream from "./redditListingStream";
import {capitalizeFirstLetter, extractPath, extractQuery, makeElement, splitPathQuery} from "../../../utils/utils";
import {DropDownActionData, DropDownEntryParam} from "../../misc/dropDown/dropDownEntry/dropDownEntry";
import {pushLinkToHistoryComb} from "../../../historyState/historyStateManager";
import Ph_DropDown, {DirectionX, DirectionY} from "../../misc/dropDown/dropDown";
import {
	MessageSectionsNamed,
	NonSortableUserSections,
	SortPostsOrder,
	SortPostsOrderNamed,
	SortPostsTimeFrame,
	SortPostsTimeframeNamed,
	SortSearchOrder,
	SortSearchOrderNamed,
	UserSection,
	UserSectionsNamed
} from "../../../types/misc";
import Ph_Readable from "../feedItem/readable/readable";
import ViewsStack from "../../../historyState/viewsStack";
import {
	makeGeneralSortSectionEntries,
	makeMessageSectionEntries,
	makeSearchSortSectionEntries,
	makeUserSectionEntries,
	makeUserSortSectionEntries
} from "./sortingDropdownParams";
import Users from "../../multiUser/userManagement";
import {getLoadingIcon} from "../../../utils/htmlStatics";

export default function makeFeedHeaderElements(feedUrl: string, listingSteam: RedditListingStream): HTMLElement[] {
	const feedType: FeedType = getFeedType(feedUrl);
	const headerElementsMaker = getHeaderElementsMaker(listingSteam, feedType);
	ViewsStack.setCurrentStateTitle(headerElementsMaker.getTabTitle());
	return headerElementsMaker.makeHeaderElements();
}

/** Utility for making header elements (title, sorting, ...) and tab title for different feed types (subreddit, user, ...) */
abstract class HeaderElementsMaker {
	protected listingStream: RedditListingStream;
	protected feedType: FeedType;

	public constructor(listingStream: RedditListingStream, feedType: FeedType) {
		this.listingStream = listingStream;
		this.feedType = feedType;
	}

	protected get url(): string {
		return this.listingStream.url;
	}

	/** Callback when selecting something from dropdown (to change sorting). Updates the feeds url to load new items. */
	protected async onSelect(data: DropDownActionData): Promise<void> {
		data.setButtonLabel(getLoadingIcon());
		const params = data.valueChain as string[];
		const newUrl = this.makeNewUrl(...params);
		try {
			await this.listingStream.setNewUrl(newUrl);
			ViewsStack.changeCurrentUrl(newUrl);
			ViewsStack.setCurrentStateTitle(this.getTabTitle());
			data.setButtonLabel(this.getButtonTitle());
		} catch (e) {
			console.error(e);
			data.setButtonLabel(data.initialLabel);
		}
	}

	public makeHeaderElements(): HTMLElement[] {
		const title = makeElement("div", { class: "feedTitle" }, this.getHeaderTitle());
		return [
			title,
			...this.makeAdditionalElements()
		];
	}

	protected makeUrlChangeDropdown(entries: DropDownEntryParam[]): Ph_DropDown {
		return new Ph_DropDown(entries, this.getButtonTitle(), DirectionX.right, DirectionY.bottom, false);
	}

	protected abstract makeAdditionalElements(): HTMLElement[];
	/** Make new feed url (/r/all --> /r/all/top?t=week) based on dropdown selection */
	protected abstract makeNewUrl(...params: string[]): string;
	protected abstract makeBaseUrl(): string;
	protected abstract getHeaderTitle(): string;
	protected abstract getButtonTitle(): string;
	abstract getTabTitle(): string;
}

function getHeaderElementsMaker(listingStream: RedditListingStream, feedType: FeedType): HeaderElementsMaker {
	if (/\/search\/?(\?.*)?$/i.test(listingStream.url))
		return new SearchElementsMaker(listingStream, feedType);
	else if (feedType === FeedType.user)
		return new UserElementsMaker(listingStream, feedType);
	else if (feedType === FeedType.messages)
		return new MessageElementsMaker(listingStream, feedType);
	else
		return new GeneralElementsMaker(listingStream, feedType);
}

class GeneralElementsMaker extends HeaderElementsMaker {
	makeAdditionalElements(): HTMLElement[] {
		let headerElements: HTMLElement[] = [];
		const feedBaseUrl = this.makeBaseUrl();
		if (Ph_FeedInfo.supportedFeedTypes.includes(this.feedType) && !feedBaseUrl.includes("+"))
			headerElements.push(FeedInfoFactory.getInfoButton(this.feedType, feedBaseUrl));
		if (this.feedType !== FeedType.user)
			headerElements.push(this.makeUrlChangeDropdown(makeGeneralSortSectionEntries(this.onSelect.bind(this), this.isFrontpage())));
		else
			headerElements.push(this.makeUrlChangeDropdown(makeUserSortSectionEntries(this.onSelect.bind(this))));
		return headerElements;
	}

	makeNewUrl(order: SortPostsOrder, timeframe: SortPostsTimeFrame): string {
		let [path, query] = splitPathQuery(this.url);
		if (this.feedType !== FeedType.user) {
			const pathEnding = path.match(/\w*\/?$/)[0];
			if (SortPostsOrder[pathEnding]) {
				path = path.replace(/\w*\/?$/, order);			// /r/all/top --> /r/all/<newOrder>
			} else {
				path = path.replace(/\/?$/, "/");		// /r/all/ --> /r/all/<newOrder>
				path += order;
			}
		}

		const params = new URLSearchParams(query);
		if (this.feedType === FeedType.user)
			params.set("sort", order);
		if (order == SortPostsOrder.top || order == SortPostsOrder.controversial)
			params.set("t", timeframe);
		else
			params.delete("t");

		const paramsStr = params.toString();
		return path + (paramsStr ? `?${paramsStr}` : "");
	}

	protected getButtonTitle(): string {
		const [path, query] = splitPathQuery(this.url);
		const params = new URLSearchParams(query);
		let sortName: any;
		let timeframeName: any;
		let sortPath: string;
		if (this.feedType === FeedType.multireddit)
			sortPath = path.match(/\/m\/[^/#?]+\/(\w+)/)?.[1] ?? "";
		else if (this.isFrontpage())
			sortPath = path.match(/^\/(\w+)/)?.[1] ?? "";
		else
			sortPath = path.match(/^\/r\/[^/#?]+\/(\w+)/)?.[1] ?? "";
		sortName = SortPostsOrderNamed[sortPath] ?? "Default";
		const timeframeParam = params.get("t");
		timeframeName = timeframeParam ? SortPostsTimeframeNamed[timeframeParam] ?? "" : "";
		return `${sortName}${timeframeName ? ` • ${timeframeName}` : ""}`;
	}

	protected getHeaderTitle(): string {
		switch (this.feedType) {
			case FeedType.subreddit:
				return this.url.match(/r\/[^/?#]+/i)[0];							// /r/all/top --> r/all
			case FeedType.multireddit:
				return `Multireddit ${this.url.match(/\/m\/([^/?#]+)/i)[1]}`;		// /u/user/m/multi --> multi
			case FeedType.user:
				return `u/${this.url.match(/\/(u|user)\/([^/?#]+)/i)[2]}`
			default:
				if (/^\/r\/[\w_-]+/.test(this.url))
					return this.url.match(/r\/[\w_-]+/)[0];
				else
					return "";
		}
	}

	getTabTitle(): string {
		switch (this.feedType) {
			case FeedType.subreddit:
				return this.url.match(/^\/(r\/[^#?/]*)/)[1];
			case FeedType.user:
				return `u/${this.url.match(/^\/(u|user)\/([^#?/]*)/)[2]}`;
			case FeedType.multireddit:
				return `${this.url.match(/\/m\/([^#?/]*)/)[1]} Multireddit`;
			default:
				if (this.isFrontpage())
					return "Frontpage"
				else
					return extractPath(this.url);
		}
	}

	protected makeBaseUrl(): string {
		switch (this.feedType) {
			case FeedType.subreddit:
				return this.url.match(/\/r\/[^/?#]+/i)[0];			// /r/all/top --> r/all
			case FeedType.user:
				return `/user/${this.url.match(/\/(u|user)\/([^/?#]+)/i)[2]}`;
			case FeedType.multireddit:
				const matches = this.url.match(/\/(u|user)\/([^/]+)\/m\/([^/?#]+)/i)
				return `/user/${matches[2]}/m/${matches[3]}`;
			case FeedType.messages:
				return this.url;
		}
	}

	private isFrontpage(): boolean {
		return /^(\/(\w+\/?)?)?([#?].*)?$/.test(this.url);		// either no path or 1 subdirectory (/top, /hot, etc.) + optional params
	}
}

class SearchElementsMaker extends HeaderElementsMaker {
	makeAdditionalElements(): HTMLElement[] {
		const headerElement: HTMLElement[] = [];
		const params = new URLSearchParams(extractQuery(this.url));
		const subreddit = params.get("restrict_sr") === "true" ? this.url.match(/^\/r\/([^#?/]+)/)?.[1] : "";
		if (subreddit && !subreddit.includes("+"))
			headerElement.push(FeedInfoFactory.getInfoButton(this.feedType, `/r/${subreddit}`));
		headerElement.push(this.makeUrlChangeDropdown(makeSearchSortSectionEntries(this.onSelect.bind(this))));
		return headerElement
	}

	makeNewUrl(sortType: SortSearchOrder, sortTimeFrame?: SortPostsTimeFrame): string  {
		let [path, query] = splitPathQuery(this.url);
		const params = new URLSearchParams(query);
		params.set("sort", sortType);
		params.set("t", sortType !== SortSearchOrder.new ? sortTimeFrame : "");
		const paramsStr = params.toString();
		return path + (paramsStr ? `?${paramsStr}` : "");
	}

	protected getButtonTitle(): string {
		const params = new URLSearchParams(extractQuery(this.url));
		const sortParam = params.get("sort");
		const timeParam = params.get("t");
		return `${SortSearchOrderNamed[sortParam] ?? "Default"}${ timeParam ? ` • ${SortPostsTimeframeNamed[timeParam] ?? "Default"}` : ""}`;
	}

	protected getHeaderTitle(): string {
		const params = new URLSearchParams(extractQuery(this.url));
		const subreddit = params.get("restrict_sr") === "true" ? this.url.match(/^\/r\/([^#?/]+)/)?.[1] : "";
		return subreddit ? `Search in r/${subreddit}` : "";
	}

	getTabTitle(): string {
		const params = new URLSearchParams(extractQuery(this.url));
		const subreddit = params.get("restrict_sr") === "true" ? this.url.match(/^\/r\/([^#?/]+)/)?.[1] : "";
		return `Search "${params.get("q") || ""}" ${subreddit ? ` in r/${subreddit}` : ""}`;
	}

	protected makeBaseUrl(): string {
		return this.url;
	}
}

class UserElementsMaker extends HeaderElementsMaker {
	makeAdditionalElements(): HTMLElement[] {
		const isLoggedInUserFeed = new RegExp(`/(u|user)/${Users.current.name}`, "i").test(this.url);
		const elements = (new GeneralElementsMaker(this.listingStream, this.feedType)).makeAdditionalElements();
		elements.splice(1, 0,
			this.makeUrlChangeDropdown(makeUserSectionEntries(this.onSelect.bind(this), isLoggedInUserFeed)));
		return elements;
	}

	makeNewUrl(section: UserSection): string {
		const userName = this.getUsername();
		const query = extractQuery(this.url);
		const isSortable = !NonSortableUserSections.includes(section);
		return `/user/${userName}/${section}${isSortable ? query : ""}`;
	}

	protected getButtonTitle(): string {
		const userSection = this.url.match(/^\/(u|user)\/\w+\/([\w-_]*|)/)?.[2] ?? "";
		return UserSectionsNamed[userSection] ?? "Default";
	}

	protected getHeaderTitle(): string {
		return `u/${this.getUsername()}`;
	}

	getTabTitle(): string {
		return `u/${this.getUsername()}`;
	}

	protected makeBaseUrl(): string {
		return `/user/${this.getUsername()}`;
	}

	private getUsername(): string {
		return this.url.match(/^\/(?:u|user)\/([^/?#]+)/i)[1];		// /u/user --> user
	}
}

class MessageElementsMaker extends HeaderElementsMaker {
	makeAdditionalElements(): HTMLElement[] {
		const composeButton = makeElement("button", {
			class: "composeMsgBtn transparentButtonAlt",
			"data-tooltip": "Compose Message",
			onclick: () => pushLinkToHistoryComb("/message/compose")
		});
		const markReadAllButton = makeElement("button", {
			class: "markRead transparentButtonAlt",
			"data-tooltip": "Read All Messages",
			onclick: Ph_Readable.readAllMessages
		});
		const messageSectionSelector = this.makeUrlChangeDropdown(makeMessageSectionEntries(this.onSelect.bind(this)));
		return [ composeButton, markReadAllButton, messageSectionSelector ];
	}

	makeNewUrl(section: string): string {
		return `/message/${section}`;
	}

	protected getButtonTitle(): string {
		return capitalizeFirstLetter(this.url.match(/^\/message\/(\w+)/)[1]);
	}

	protected getHeaderTitle(): string {
		return "";
	}

	getTabTitle(): string {
		const section = this.url.match(/\/message\/(\w+)/)?.[1] ?? "";
		return `${MessageSectionsNamed[section] ?? "Default"} (Messages)`;
	}

	protected makeBaseUrl(): string {
		return this.url;
	}
}

function getFeedType(url: string) {
	if (/^\/?(\?.*)?$/.test(url) || new RegExp(`^/r/(${fakeSubreddits.join("|")})($|/|\\?|#)`, "i").test(url))	// home page or special subreddit
		return FeedType.misc;
	else if (/^\/r\/[^/]+/i.test(url))						// subreddit
		return FeedType.subreddit;
	else if (/^\/(u|user)\/[^/]+\/m\/[^/]+/i.test(url))		// multi
		return FeedType.multireddit;
	else if (/^\/(u|user)\/[^/]+/i.test(url))				// user
		return FeedType.user;
	else if (/^\/message\//i.test(url))						// message(s)
		return FeedType.messages;
	else
		return FeedType.misc;
}
