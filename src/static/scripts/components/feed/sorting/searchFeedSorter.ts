import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { RedditApiType, SortPostsTimeFrame, SortSearchOrder } from "../../../types/misc.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { extractQuery, splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

/** Sorts a search result feed */
export default class Ph_SearchFeedSorter extends HTMLElement {
	feed: Ph_UniversalFeed;
	dropdown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.className = "feedSorter";
		this.feed = feed;

		const curSort = new URLSearchParams(extractQuery(history.state?.url || ""));
		const curSortStr = `Sort - ${curSort.get("sort") || "relevance"}${curSort.get("t") ? `/${curSort.get("t")}` : ""}`;
		this.appendChild(this.dropdown = new Ph_DropDown([
			{ displayHTML: "Relevance", value: SortSearchOrder.relevance, nestedEntries: [
					{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ displayHTML: "Hot", value: SortSearchOrder.hot, nestedEntries: [
					{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ displayHTML: "top", value: SortSearchOrder.top, nestedEntries: [
					{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
			{ displayHTML: "New", value: SortSearchOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
			{ displayHTML: "Comments", value: SortSearchOrder.comments, nestedEntries: [
					{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
					{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) },
				] },
		], curSortStr, DirectionX.right, DirectionY.bottom, false));
	}

	handleSortSelect(valueChain: any[], setLabel: (newLabel: ButtonLabel) => void) {
		setLabel(getLoadingIcon());
		const sortStr = `Sort - ${valueChain[0]}${valueChain[1] ? `/${valueChain[1]}` : ""}`;
		this.setSorting(valueChain[0], valueChain[1])
			.then(() => setLabel(sortStr))
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
			new Ph_Toast(Level.Error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}

		this.feed.replaceChildren(request.data.children, request.data.before, request.data.after);
	}
}

customElements.define("ph-search-feed-sorter", Ph_SearchFeedSorter);
