import { PostSorting, SortPostsOrder, SortPostsTimeFrame } from "../../../../utils/types.js";
import Ph_DropDown from "../../../misc/dropDown/dropDown.js";
import Ph_DropDownEntry from "../../../misc/dropDownEntry/dropDownEntry.js";
import { Ph_Feed } from "../../feed.js";
import Ph_UniversalFeed from "../../universalFeed/universalFeed.js";

export default class Ph_PostsSorter extends HTMLElement {
	feed: Ph_Feed;
	dropDown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed) {
		super();

		this.feed = feed;
		this.classList.add("dropDown");

		const dropDownButton = document.createElement("button");
		this.appendChild(dropDownButton);
		dropDownButton.className = "dropDownButton";
		dropDownButton.innerText = "Sorting by; [...]";

		const dropDown = new Ph_DropDown([
			{ displayText: "Hot", value: SortPostsOrder.hot, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayText: "Top", value: SortPostsOrder.top, onSelectCallback: this.handleOnSelect.bind(this), nestedEntries: [
				{ displayText: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleOnSelect.bind(this) }
			] },
			{ displayText: "rising", value: SortPostsOrder.rising, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayText: "new", value: SortPostsOrder.new, onSelectCallback: this.handleOnSelect.bind(this) },
			{ displayText: "Controversial", value: SortPostsOrder.controversial, onSelectCallback: this.handleOnSelect.bind(this), nestedEntries: [
				{ displayText: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleOnSelect.bind(this) },
				{ displayText: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleOnSelect.bind(this) }
			] },
			{ displayText: "Gilded", value: SortPostsOrder.gilded, onSelectCallback: this.handleOnSelect.bind(this) },
		], dropDownButton);

		this.appendChild(dropDown);
	}

	handleOnSelect(valueChain: any[]) {
		const selection: PostSorting = {
			order: valueChain[0],
			timeFrame: valueChain[1]
		};

		this.feed.setSorting(selection);
	}
}

customElements.define("ph-posts-sorter", Ph_PostsSorter);
