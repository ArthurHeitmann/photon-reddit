import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import {
	NonSortableUserSections,
	PostSorting,
	RedditApiType,
	SortPostsOrder,
	SortPostsTimeFrame,
	SortUserPostsOrder,
	UserSection
} from "../../../types/misc.js";
import { thisUser } from "../../../utils/globals.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { extractPath, extractQuery, splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import { FeedType } from "../feedInfo/feedInfo.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

/** Sorts a universal feed */
export default class Ph_UniversalFeedSorter extends HTMLElement {
	feedType: FeedType;
	feed: Ph_UniversalFeed;
	sectionDropDown: Ph_DropDown;
	sortDropDown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed, feedType: FeedType, baseUrl: string) {
		super();

		this.feedType = feedType;
		this.feed = feed;
		this.className = "feedSorter";

		if (feedType === FeedType.user) {
			const tmpCurSection = feed.requestUrl.match(/(?<=^\/(u|user)\/[^/]+\/)\w+/);
			const curSection = tmpCurSection && tmpCurSection[0] || "Overview";
			const userSections = <DropDownEntryParam[]> [
				{ displayHTML: "Overview", value: UserSection.Overview, onSelectCallback: this.setUserSection.bind(this) },
				{ displayHTML: "Posts", value: UserSection.Posts, onSelectCallback: this.setUserSection.bind(this) },
				{ displayHTML: "Comments", value: UserSection.Comments, onSelectCallback: this.setUserSection.bind(this) },
				{ displayHTML: "Gilded", value: UserSection.Gilded, onSelectCallback: this.setUserSection.bind(this) },
			];
			if (new RegExp(`/${thisUser.name}$`, "i").test(baseUrl)) {
				userSections.push(...[
					{ displayHTML: "Upvoted", value: UserSection.Upvoted, onSelectCallback: this.setUserSection.bind(this) },
					{ displayHTML: "Downvoted", value: UserSection.Downvoted, onSelectCallback: this.setUserSection.bind(this) },
					{ displayHTML: "Hidden", value: UserSection.Hidden, onSelectCallback: this.setUserSection.bind(this) },
					{ displayHTML: "Saved", value: UserSection.Saved, onSelectCallback: this.setUserSection.bind(this) }
				]);
			}
			this.sectionDropDown = new Ph_DropDown(userSections, curSection, DirectionX.left, DirectionY.bottom, false);
			this.appendChild(this.sectionDropDown);
		}

		const query = new URLSearchParams(extractQuery(history.state?.url || ""));
		let tmpCurSort = extractPath(history.state?.url || "").match(/(?<=\/)\w+$/);
		let curSort = query.get("sort") || tmpCurSort && tmpCurSort[0] || "";
		if (!(Object.values(SortPostsOrder) as string[]).includes(curSort.toLowerCase()))
			curSort = "default";
		const curSortTime = query.get("t");
		const curSortStr = `Sort - ${curSort}${curSortTime ? `/${curSortTime}` : ""}`;
		let dropDownParams: DropDownEntryParam[];
		if (feedType !== FeedType.user) {
			dropDownParams = [
				{ displayHTML: "Default", value: SortPostsOrder.default, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Hot", value: SortPostsOrder.hot, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Top", value: SortPostsOrder.top, onSelectCallback: this.handleSortSelect.bind(this), nestedEntries: [
						{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ displayHTML: "Rising", value: SortPostsOrder.rising, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "New", value: SortPostsOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Controversial", value: SortPostsOrder.controversial, onSelectCallback: this.handleSortSelect.bind(this), nestedEntries: [
						{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ displayHTML: "Gilded", value: SortPostsOrder.gilded, onSelectCallback: this.handleSortSelect.bind(this) },
			];
		}
		else {
			dropDownParams = [
				{ displayHTML: "Default", value: SortUserPostsOrder.default, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Hot", value: SortUserPostsOrder.hot, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Top", value: SortUserPostsOrder.top, onSelectCallback: this.handleSortSelect.bind(this), nestedEntries: [
						{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ displayHTML: "New", value: SortUserPostsOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
				{ displayHTML: "Controversial", value: SortUserPostsOrder.controversial, onSelectCallback: this.handleSortSelect.bind(this), nestedEntries: [
						{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
			];
		}
		this.sortDropDown = new Ph_DropDown(dropDownParams, curSortStr, DirectionX.right, DirectionY.bottom, false)
		this.appendChild(this.sortDropDown);
	}

	handleSortSelect(valueChain: any[], setLabel: (newLabel: ButtonLabel) => void) {
		const selection: PostSorting = {
			order: valueChain[0],
			timeFrame: valueChain[1]
		};

		setLabel(getLoadingIcon());

		this.setSorting(selection)
			.then(() => setLabel(`Sort - ${selection.order}${selection.timeFrame ? `/${selection.timeFrame}` : ""}`));
	}

	async setSorting(sortingMode: PostSorting): Promise<void> {
		let [path, query] = splitPathQuery(this.feed.requestUrl);

		if (this.feedType !== FeedType.user) {
			const pathEnding = path.match(/\w*\/?$/)[0];
			if (SortPostsOrder[pathEnding]) {
				path = path.replace(/\w*\/?$/, sortingMode.order);
			} else {
				path = path.replace(/\/?$/, "/");
				path += sortingMode.order;
			}
		}

		const params = new URLSearchParams(query);
		if (this.feedType === FeedType.user)
			params.set("sort", sortingMode.order);
		if (sortingMode.order == SortPostsOrder.top || sortingMode.order == SortPostsOrder.controversial)
			params.set("t", sortingMode.timeFrame);
		else
			params.delete("t");

		const paramsStr = params.toString();
		const newUrl = path + (paramsStr ? `?${paramsStr}` : "");
		this.feed.requestUrl = newUrl;
		const request: RedditApiType = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.Error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}
		ViewsStack.changeCurrentUrl(newUrl);

		this.feed.replaceChildren(request.data.children, request.data.before, request.data.after);
	}

	async setUserSection([section]: UserSection[], setLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement) {
		setLabel(getLoadingIcon());
		const userName = this.feed.requestUrl.match(/(?<=^\/(u|user)\/)[^\/?#]+/)[0];
		const query = extractQuery(this.feed.requestUrl);
		const isSortable = !NonSortableUserSections.includes(section);
		this.feed.requestUrl = `/user/${userName}/${section}${isSortable ? query : ""}`;
		try {
			const sectionItems: RedditApiType = await redditApiRequest(
				this.feed.requestUrl,
				[],
				false
			);
			this.feed.beforeData = sectionItems.data.before;
			this.feed.afterData = sectionItems.data.after;
			this.feed.replaceChildren(sectionItems.data.children, sectionItems.data.before, sectionItems.data.after);
			ViewsStack.changeCurrentUrl(this.feed.requestUrl);
			setLabel(section || "Overview");
			if (isSortable) {
				if (this.sortDropDown.classList.contains("hide"))
					this.sortDropDown.setLabel("Sorting");
				this.sortDropDown.classList.remove("hide");
			}
			else
				this.sortDropDown.classList.add("hide");
		} catch (e) {
			new Ph_Toast(Level.Error, "Error getting user section items");
			console.error("Error getting user section items");
			console.error(e);
			setLabel(initialLabel);
		}
	}
}

customElements.define("ph-universal-feed-sorter", Ph_UniversalFeedSorter);
