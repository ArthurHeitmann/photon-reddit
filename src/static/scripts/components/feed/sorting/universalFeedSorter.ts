import { redditApiRequest } from "../../../api/api.js";
import { viewsStack } from "../../../state/stateManager.js";
import { PostSorting, RedditApiType, SortPostsOrder, SortPostsTimeFrame } from "../../../utils/types.js";
import { splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

export default class Ph_UniversalFeedSorter extends HTMLElement {
	feed: Ph_UniversalFeed;
	dropdown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.feed = feed;

		this.appendChild(this.dropdown = new Ph_DropDown([
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
		], "Sort by", DirectionX.right, DirectionY.bottom, false));
	}

	handleSortSelect(valueChain: any[]) {
		const selection: PostSorting = {
			order: valueChain[0],
			timeFrame: valueChain[1]
		};


		const loadingIcon = document.createElement("img");
		loadingIcon.src = "/img/loading.svg";
		this.dropdown.toggleButton.appendChild(loadingIcon);

		this.setSorting(selection)
			.then(() => loadingIcon.remove())
			.catch(() => loadingIcon.remove());
	}

	async setSorting(sortingMode: PostSorting): Promise<void> {
		let [path, query] = splitPathQuery(this.feed.requestUrl);

		const pathEnding = path.match(/\w*\/?$/)[0];
		if (SortPostsOrder[pathEnding]) {
			path = path.replace(/\w*\/?$/, sortingMode.order);
		}
		else {
			path = path.replace(/\/?$/, "/");
			path += sortingMode.order;
		}

		// top and controversial can also be sorted by time
		const params = new URLSearchParams(query);
		if (sortingMode.order == SortPostsOrder.top || sortingMode.order == SortPostsOrder.controversial) {
			params.set("t", sortingMode.timeFrame);
		}
		else {
			params.delete("t");
		}

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

customElements.define("ph-universal-feed-sorter", Ph_UniversalFeedSorter);
