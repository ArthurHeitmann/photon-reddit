import {PostSorting, SortPostsOrder, SortPostsTimeFrame} from "../../../../utils/types.js";
import Ph_DropDown, {DirectionX, DirectionY} from "../../../misc/dropDown/dropDown.js";
import {Ph_Feed} from "../../feed.js";
import Ph_UniversalFeed from "../../universalFeed/universalFeed.js";

export default class Ph_PostsSorter extends HTMLElement {
	feed: Ph_Feed;
	dropDown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.feed = feed;
		this.classList.add("dropDown");

		this.dropDown = new Ph_DropDown([
			{ displayHTML: "Default", value: SortPostsOrder.default, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayHTML: "Hot", value: SortPostsOrder.hot, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayHTML: "Top", value: SortPostsOrder.top, onSelectCallback: this.handleOnSelect.bind(this), nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleOnSelect.bind(this) }
			] },
			{ displayHTML: "Rising", value: SortPostsOrder.rising, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayHTML: "New", value: SortPostsOrder.new, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayHTML: "Controversial", value: SortPostsOrder.controversial, onSelectCallback: this.handleOnSelect.bind(this), nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleOnSelect.bind(this) }
			] },
			{ displayHTML: "Gilded", value: SortPostsOrder.gilded, onSelectCallback: this.handleOnSelect.bind(this) },
		], "Sort by", DirectionX.right, DirectionY.bottom, false);

		this.appendChild(this.dropDown);
	}

	handleOnSelect(valueChain: any[]) {
		const selection: PostSorting = {
			order: valueChain[0],
			timeFrame: valueChain[1]
		};


		const loadingIcon = document.createElement("img");
		loadingIcon.src = "/img/loading.svg";
		this.dropDown.toggleButton.appendChild(loadingIcon);

		this.feed.setSorting(selection)
			.then(() => loadingIcon.remove())
			.catch(() => loadingIcon.remove());
	}
}

customElements.define("ph-posts-sorter", Ph_PostsSorter);
