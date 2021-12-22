import { redditApiRequest } from "../../../api/redditApi";
import ViewsStack from "../../../historyState/viewsStack";
import { SortPostsTimeFrame, SortSearchOrder } from "../../../types/misc";
import { RedditApiObj, RedditListingObj } from "../../../types/redditTypes";
import { getLoadingIcon } from "../../../utils/htmlStatics";
import { extractQuery, hasParams, splitPathQuery } from "../../../utils/utils";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown";
import { DropDownActionData } from "../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Ph_UniversalFeed from "../universalFeed/universalFeed";

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
		const request: RedditListingObj<RedditApiObj> = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}

		this.feed.replaceItems(request.data.children, request.data.before, request.data.after);
	}
}

customElements.define("ph-search-feed-sorter", Ph_SearchFeedSorter);
