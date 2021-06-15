import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { RedditApiType, SortPostsTimeFrame, SortSearchOrder } from "../../../types/misc.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { extractQuery, hasParams, splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import { DropDownActionData } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

/** Sorts a search result feed */
export default class Ph_SearchFeedSorter extends HTMLElement {
	feed: Ph_UniversalFeed;
	dropdown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "feedSorter";
		this.feed = feed;

		const curSort = new URLSearchParams(extractQuery(history.state?.url || ""));
		const curSortStr = `Sort - ${curSort.get("sort") || "relevance"}${curSort.get("t") ? `/${curSort.get("t")}` : ""}`;
		this.append(this.dropdown = new Ph_DropDown([
			{ label: "Relevance", value: SortSearchOrder.relevance, labelImgUrl: "/img/relevance.svg", nestedEntries: [
					{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ label: "Hot", labelImgUrl: "/img/hot.svg", value: SortSearchOrder.hot, nestedEntries: [
					{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ label: "Top", labelImgUrl: "/img/top.svg", value: SortSearchOrder.top, nestedEntries: [
					{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ label: "New", labelImgUrl: "/img/new.svg", value: SortSearchOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
			{ label: "Comments", labelImgUrl: "/img/commentEmpty.svg", value: SortSearchOrder.comments, nestedEntries: [
					{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
		], curSortStr, DirectionX.right, DirectionY.bottom, false));
	}

	handleSortSelect(data: DropDownActionData) {
		data.setButtonLabel(getLoadingIcon());
		const sortType = data.valueChain[0] as SortSearchOrder;
		const sortTime = data.valueChain[1] as SortPostsTimeFrame;
		const sortStr = `Sort - ${sortType}${sortTime ? `/${sortTime}` : ""}`;
		this.setSorting(sortType, sortTime)
			.then(() => data.setButtonLabel(sortStr))
	}

	async setSorting(order: SortSearchOrder, timeFrame: SortPostsTimeFrame): Promise<void> {
		let [path, query] = splitPathQuery(this.feed.requestUrl);

		// top and controversial can also be sorted by time
		const params = new URLSearchParams(query);
		params.set("sort", order);
		params.set("t", order !== SortSearchOrder.new ? timeFrame : "");

		const paramsStr = params.toString();
		const newUrl = path + (paramsStr ? `?${paramsStr}` : "");
		ViewsStack.changeCurrentUrl(newUrl);
		this.feed.requestUrl = newUrl;
		const request: RedditApiType = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}

		this.feed.replaceChildren(request.data.children, request.data.before, request.data.after);
	}
}

customElements.define("ph-search-feed-sorter", Ph_SearchFeedSorter);
