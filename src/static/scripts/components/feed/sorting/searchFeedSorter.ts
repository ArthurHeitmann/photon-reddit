import { redditApiRequest } from "../../../api/api.js";
import { viewsStack } from "../../../state/stateManager.js";
import { RedditApiType, SortPostsTimeFrame, SortSearchOrder } from "../../../utils/types.js";
import { splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

export default class Ph_SearchFeedSorter extends HTMLElement {
	feed: Ph_UniversalFeed;
	dropdown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.className = "feedSorter";
		this.feed = feed;

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
		], "Sort by", DirectionX.right, DirectionY.bottom, false));
	}

	handleSortSelect(valueChain: any[]) {
		const loadingIcon = document.createElement("img");
		loadingIcon.src = "/img/loading.svg";
		this.dropdown.toggleButton.appendChild(loadingIcon);

		this.setSorting(valueChain[0], valueChain[1])
			.then(() => loadingIcon.remove())
			.catch(() => loadingIcon.remove());
	}

	async setSorting(order: SortSearchOrder, timeFrame: SortPostsTimeFrame): Promise<void> {
		let [path, query] = splitPathQuery(this.feed.requestUrl);

		// top and controversial can also be sorted by time
		const params = new URLSearchParams(query);
		params.set("sort", order);
		params.set("t", order !== SortSearchOrder.new ? timeFrame : "");

		const paramsStr = params.toString();
		const newUrl = path + (paramsStr ? `?${paramsStr}` : "");
		viewsStack.changeCurrentUrl(newUrl);
		this.feed.requestUrl = newUrl;
		const request: RedditApiType = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.Error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}

		this.feed.replaceChildren(request.data.children);
	}
}

customElements.define("ph-search-feed-sorter", Ph_SearchFeedSorter);
