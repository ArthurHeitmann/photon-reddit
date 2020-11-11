import { SortPostsTimeFrame, SortSearchOrder } from "../../../utils/types.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";

class Ph_Search extends HTMLElement {
	searchBar: HTMLInputElement;
	sortBy: Ph_DropDown;
	searchOrder: SortSearchOrder;
	searchTimeFrame: SortPostsTimeFrame;
	limitToSubreddit: HTMLInputElement;
	includeSubreddits: HTMLInputElement;
	includeLinks: HTMLInputElement;
	includeUsers: HTMLInputElement;

	constructor() {
		super();
	}

	connectedCallback() {
		this.classList.add("search");

		this.searchBar = document.createElement("input");
		this.searchBar.type = "text";
		this.appendChild(this.searchBar);
		this.searchBar.addEventListener("keypress", e => e.code === "Enter" && this.search());

		const toggleDropdownBtn = document.createElement("button")
		toggleDropdownBtn.className = "toggleDropdownButton transparentButton";
		toggleDropdownBtn.innerHTML = `<img src="/img/downArrow.svg" draggable="false">`;
		this.appendChild(toggleDropdownBtn);

		const searchButton = document.createElement("button");
		searchButton.className = "searchButton transparentButton";
		searchButton.innerHTML = `<img src="/img/search.svg" draggable="false">`;
		this.appendChild(searchButton);
		searchButton.addEventListener("click", this.search.bind(this));


		const expandedOptions = document.createElement("div");
		expandedOptions.className = "expandedOptions hide";
		toggleDropdownBtn.addEventListener("click", () => expandedOptions.classList.toggle("hide"));

		this.sortBy = new Ph_DropDown([
			{ displayHTML: "Relevance", value: SortSearchOrder.relevance, nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.setSortOrder.bind(this) },
			] },
			{ displayHTML: "Hot", value: SortSearchOrder.hot, nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.setSortOrder.bind(this) },
			] },
			{ displayHTML: "top", value: SortSearchOrder.top, nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.setSortOrder.bind(this) },
			] },
			{ displayHTML: "New", value: SortSearchOrder.new, onSelectCallback: this.setSortOrder.bind(this) },
			{ displayHTML: "Comments", value: SortSearchOrder.comments, nestedEntries: [
				{ displayHTML: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.setSortOrder.bind(this) },
				{ displayHTML: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.setSortOrder.bind(this) },
			] },
		], "Sort by", DirectionX.right, DirectionY.bottom, false);
		expandedOptions.appendChild(this.sortBy);

		function makeLabelCheckboxPair(labelText: string, checkboxId: string, defaultChecked: boolean, appendTo: HTMLElement): HTMLInputElement {
			const wrapper = document.createElement("div");
			wrapper.innerHTML = `<label for="${checkboxId}">${labelText}</label>`;
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = checkboxId;
			checkbox.className = "checkbox";
			checkbox.checked = defaultChecked;
			const checkboxVis = document.createElement("label");
			checkboxVis.setAttribute("for", checkboxId);
			wrapper.appendChild(checkbox);
			wrapper.appendChild(checkboxVis);
			appendTo.appendChild(wrapper);
			return checkbox;
		}

		this.limitToSubreddit = makeLabelCheckboxPair("Limit to", "limitToSubreddit", true, expandedOptions);
		this.includeLinks = makeLabelCheckboxPair("Include Posts", "includeLink", true, expandedOptions);
		this.includeSubreddits = makeLabelCheckboxPair("Include Subreddits", "includeSubs", false, expandedOptions);
		this.includeUsers = makeLabelCheckboxPair("Include Users", "includeUsers", false, expandedOptions);

		this.appendChild(expandedOptions);
	}

	setSortOrder(valueChain: any[]) {
		this.searchOrder = valueChain[0];
		this.searchTimeFrame = valueChain.length === 2 ? valueChain[1] : null;
	}

	search() {

	}
}

customElements.define("ph-search", Ph_Search);
