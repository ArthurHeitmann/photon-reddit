import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import { PostSorting, RedditApiType, SortPostsOrder, SortPostsTimeFrame } from "../../../types/misc.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { extractPath, extractQuery, splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

/** Sorts a universal feed */
export default class Ph_UniversalFeedSorter extends HTMLElement {
	feed: Ph_UniversalFeed;
	dropdown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.feed = feed;
		this.className = "feedSorter";

		let tmpCurSort = extractPath(history.state?.url || "").match(/(?<=\/)\w+$/);
		let curSort = tmpCurSort && tmpCurSort[0] || "";
		if (!(Object.values(SortPostsOrder) as string[]).includes(curSort.toLowerCase()))
			curSort = "default";
		const curSortTime = (new URLSearchParams(extractQuery(history.state?.url || ""))).get("t");
		const curSortStr = `Sort - ${curSort}${curSortTime ? `/${curSortTime}` : ""}`;
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
		], curSortStr, DirectionX.right, DirectionY.bottom, false));
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
		this.feed.requestUrl = newUrl;
		const request: RedditApiType = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.Error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}
		ViewsStack.changeCurrentUrl(newUrl);

		this.feed.replaceChildren(request.data.children, request.data.before, request.data.after);
	}
}

customElements.define("ph-universal-feed-sorter", Ph_UniversalFeedSorter);
