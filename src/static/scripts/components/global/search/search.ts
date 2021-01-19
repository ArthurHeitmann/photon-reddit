import { searchSubreddits, searchUser } from "../../../api/redditApi.js";
import { pushLinkToHistoryComb, pushLinkToHistorySep } from "../../../historyState/historyStateManager.js";
import { ViewChangeData } from "../../../historyState/viewsStack.js";
import { escADQ } from "../../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType, SortPostsTimeFrame, SortSearchOrder } from "../../../utils/types.js";
import { throttle } from "../../../utils/utils.js";
import Ph_FeedInfo from "../../feed/feedInfo/feedInfo.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Flair, { FlairData } from "../../misc/flair/flair.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import { Ph_ViewState } from "../../viewState/viewState.js";
import Ph_Header from "../header/header.js";

export default class Ph_Search extends HTMLElement {
	searchBar: HTMLInputElement;
	sortBy: Ph_DropDown;
	flairSearch: Ph_DropDown;
	searchOrder = SortSearchOrder.relevance;
	searchTimeFrame = SortPostsTimeFrame.all;
	limitToSubreddit: HTMLInputElement;
	searchDropdown: HTMLDivElement;
	resultsWrapper: HTMLDivElement;
	quickSearchThrottled: () => void;
	searchPrefix: string;	// r/ or user
	subModeBtn: HTMLDivElement;
	userModeBtn: HTMLDivElement;
	currentSubreddit: string = null;

	constructor() {
		super();
	}

	connectedCallback() {
		this.classList.add("search");

		this.quickSearchThrottled = throttle(this.quickSearch.bind(this), 750, { leading: false, trailing: true });

		this.subModeBtn = document.createElement("div");
		this.subModeBtn.className = "modeButton transparentButtonAlt";
		this.subModeBtn.innerText = "r/";
		this.appendChild(this.subModeBtn);
		this.userModeBtn = document.createElement("div");
		this.userModeBtn.className = "modeButton transparentButtonAlt";
		this.userModeBtn.innerText = "u/";
		this.appendChild(this.userModeBtn);
		this.subModeBtn.addEventListener("click", () => {
			this.subModeBtn.classList.toggle("checked");
			this.userModeBtn.classList.remove("checked");
			this.searchPrefix = this.searchPrefix === "/r/" ? "" : "/r/";
			this.quickSearch();
			this.searchBar.focus();
		})
		this.userModeBtn.addEventListener("click", () => {
			this.userModeBtn.classList.toggle("checked");
			this.subModeBtn.classList.remove("checked");
			this.searchPrefix = this.searchPrefix === "/user/" ? "" : "/user/";
			this.quickSearch();
			this.searchBar.focus();
		})

		this.searchBar = document.createElement("input");
		this.searchBar.type = "text";
		this.searchBar.id = "quickSearch";
		this.appendChild(this.searchBar);
		this.searchBar.addEventListener("keypress", e => e.code === "Enter" && this.search(e));
		this.searchBar.addEventListener("input", this.onTextEnter.bind(this));
		this.searchBar.addEventListener("focus", this.onFocus.bind(this));

		const toggleDropdownBtn = document.createElement("button")
		toggleDropdownBtn.className = "toggleDropdownButton transparentButton";
		toggleDropdownBtn.innerHTML = `<label for="quickSearch"><img src="/img/downArrow.svg" draggable="false" alt="expand"></label>`;
		this.appendChild(toggleDropdownBtn);

		const searchButton = document.createElement("button");
		searchButton.className = "searchButton transparentButton";
		searchButton.innerHTML = `<img src="/img/search.svg" draggable="false" alt="search">`;
		this.appendChild(searchButton);
		searchButton.addEventListener("click", this.search.bind(this));

		this.searchDropdown = document.createElement("div");
		this.searchDropdown.className = "searchDropdown";
		this.appendChild(this.searchDropdown);

		const accessibilitySpacer = document.createElement("div");
		accessibilitySpacer.className = "accessibilitySpacer";
		this.searchDropdown.appendChild(accessibilitySpacer);

		this.resultsWrapper = document.createElement("div");
		this.resultsWrapper.className = "resultsWrapper";
		this.searchDropdown.appendChild(this.resultsWrapper);

		const expandedOptions = document.createElement("div");
		expandedOptions.className = "expandedOptions";
		toggleDropdownBtn.addEventListener("click", this.toggleSearchDropdown.bind(this));
		this.searchDropdown.appendChild(expandedOptions);

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

		function makeLabelCheckboxPair(labelText: string, checkboxId: string, defaultChecked: boolean, appendTo: HTMLElement): { checkbox: HTMLInputElement, label: HTMLLabelElement } {
			const wrapper = document.createElement("div");
			wrapper.innerHTML = `<label for="${escADQ(checkboxId)}">${labelText}</label>`;
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
			return { checkbox: checkbox, label: wrapper.children[0] as HTMLLabelElement };
		}

		const { checkbox: limitToCheckbox, label: limitToLabel } = makeLabelCheckboxPair("Limit to", "limitToSubreddit", true, expandedOptions);
		this.limitToSubreddit = limitToCheckbox;

		if (/\/search\/?$/.test(location.pathname)) {
			const currParams = new URLSearchParams(location.search);
			this.searchBar.value = currParams.get("q");
			this.searchOrder = SortSearchOrder[currParams.get("sort")];
			this.searchTimeFrame = SortPostsTimeFrame[currParams.get("t")];
			this.limitToSubreddit.checked = Boolean(currParams.get("restrict_sr"));
		}

		window.addEventListener("viewChange", (e: CustomEvent) => {
			const subMatches = (e.detail as ViewChangeData).viewState.state.url.match(/^\/r\/[^\/]+/);
			this.currentSubreddit = subMatches && subMatches[0] || null;
			limitToLabel.innerText = `Limit to ${this.currentSubreddit || "all"}`;
			if (this.flairSearch) {
				this.flairSearch?.remove();
				this.flairSearch = undefined;
			}
			window.addEventListener("feedInfoReady", (e: CustomEvent) => {
				const flairs: FlairData[] = (e.detail as Ph_FeedInfo).loadedInfo.data.flairs;
				if (this.flairSearch) {
					this.flairSearch?.remove();
					this.flairSearch = undefined;
				}
				if (!flairs)
					return;
				this.flairSearch = new Ph_DropDown(
					flairs.length > 0
					? flairs.map(flair => ({
						displayElement: new Ph_Flair(flair),
						value: flair.text,
						onSelectCallback: this.searchByFlair.bind(this),
					}))
					: [{ displayHTML: "No flairs available" }],
					"Search by flair",
					DirectionX.right,
					DirectionY.bottom,
					false
				);
				this.sortBy.insertAdjacentElement("afterend", this.flairSearch);
			}, { once: true })
		})
	}

	onTextEnter() {
		if (this.searchBar.value) {
			if (/^\/?r\//.test(this.searchBar.value)) {
				this.searchBar.value = this.searchBar.value.replace(/^\/?r\//, "");
				if (!this.subModeBtn.classList.contains("checked"))
					this.subModeBtn.click();
			}
			if (/^\/?(u|user)\//.test(this.searchBar.value)) {
				this.searchBar.value = this.searchBar.value.replace(/^\/?(u|user)\//, "");
				if (!this.userModeBtn.classList.contains("checked"))
					this.userModeBtn.click();
			}
			this.quickSearchThrottled();
		}
	}

	onFocus() {
		this.classList.add("expanded");
		if (this.classList.contains("expanded"))
			(elementWithClassInTree(this.parentElement, "header") as Ph_Header)?.minimizeAll([this]);
	}

	minimize() {
		this.classList.remove("expanded");
		this.searchBar.blur();
	}
	
	toggleSearchDropdown() {
		this.classList.toggle("expanded");
		if (this.classList.contains("expanded"))
			(elementWithClassInTree(this.parentElement, "header") as Ph_Header)?.minimizeAll([this]);
	}

	setSortOrder(valueChain: any[]) {
		this.searchOrder = valueChain[0];
		this.searchTimeFrame = valueChain.length === 2 ? valueChain[1] : null;
	}

	async quickSearch() {
		this.resultsWrapper.innerText = "";
		if (!this.searchBar.value || /^\/?(r|u|user)\/$/.test(this.searchBar.value)) {
			return;
		}

		this.resultsWrapper.classList.add("loading");
		// TODO take NSFW preferences into consideration
		let result: RedditApiType;
		try {
			if (this.searchPrefix === "/r/") {
				result = await searchSubreddits(this.searchBar.value, 10);
			}
			else if (this.searchPrefix === "/user/") {
				result = await searchUser(this.searchBar.value, 10);
			}
			else {
				result = await searchSubreddits(this.searchBar.value, 6);
				if (result["error"])
					throw result;
				const users = await searchUser(this.searchBar.value, 4);
				result.data.children.push(...users.data.children);
			}
			if (result["error"])
				throw result;
		} catch (e) {
			console.error("Error loading quick search");
			console.error(e);
			new Ph_Toast(Level.Error, "Error loading quick search");
			throw e;
		}
		this.resultsWrapper.classList.remove("loading");

		this.resultsWrapper.innerText = "";
		for (let entry of result.data.children) {
			try {
				this.resultsWrapper.insertAdjacentElement("beforeend", this.makeEntry(entry));
			}
			catch (e) {
				console.error("Error making search result entry");
				console.error(e);
				new Ph_Toast(Level.Error, "Error making search result entry");
			}
		}
	}

	private makeEntry(data: RedditApiType): HTMLElement {
		let entry;
		switch (data.kind) {
			case "t5":
				entry = this.makeSubEntry(data);
				break;
			case "t2":
				entry = this.makeUserEntry(data);
				break;
			default:
				console.error("Invalid search result entry");
				console.error(data);
				new Ph_Toast(Level.Error, "Invalid search result entry");
				const errorElement = document.createElement("div");
				errorElement.innerText = "ERROR";
				entry = errorElement;
		}
		linksToSpa(entry);
		return entry;
	}

	private makeSubEntry(data: RedditApiType): HTMLElement {
		const a = document.createElement("a");
		a.className = "subreddit";
		a.href = `/r/${data.data["display_name"]}`;
		a.innerText = `r/${data.data["display_name"]}`;
		return a;
	}

	private makeUserEntry(data: RedditApiType): HTMLElement {
		const a = document.createElement("a");
		a.className = "user";
		if (data.data["is_suspended"] === true)
			a.innerText = `u/${data.data["name"]} (suspended)`;
		else {
			a.href = `/user/${data.data["name"]}`;
			a.innerText = `u/${data.data["name"]}`;
		}
		return a;
	}

	async search(e) {
		const inNewTab: boolean = e && e.ctrlKey || false;

		if (!this.searchBar.value) {
			new Ph_Toast(Level.Warning, "Empty search query", { timeout: 2000 });
			return;
		}

		if (this.searchPrefix) {
			if (inNewTab)
				window.open(this.searchPrefix + this.searchBar.value);
			else
				pushLinkToHistoryComb(this.searchPrefix + this.searchBar.value);
			return;
		}

		let url = "/search";
		const currentSubMatches = location.pathname.match(/\/r\/([^/]+)/);
		if (currentSubMatches && currentSubMatches[1])
			url = currentSubMatches[1].replace(/\/?$/, "/search");

		const paramsString = new URLSearchParams([
			["q", this.searchBar.value],
			["type", "link"],
			["restrict_sr", this.limitToSubreddit.checked ? "true" : "false"],
			["sort", this.searchOrder],
			["t", this.searchTimeFrame || ""],
		]).toString();
		if (inNewTab)
			window.open(`${url}?${paramsString}`).focus();
		else {
			pushLinkToHistorySep(
				(this.currentSubreddit ?? "") + "/search",
				"?" + paramsString
			);
		}
	}

	searchByFlair([flairText]: string[]) {
		this.limitToSubreddit.checked = true;
		this.searchBar.value = `flair:${flairText}`;
		this.searchPrefix = "";
		this.search(null);
	}
}

customElements.define("ph-search", Ph_Search);
