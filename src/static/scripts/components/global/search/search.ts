import {getSubFlairs, searchSubreddits, searchUser} from "../../../api/redditApi";
import {pushLinkToHistoryComb, pushLinkToHistorySep} from "../../../historyState/historyStateManager";
import {ViewChangeData} from "../../../historyState/viewsStack";
import {PhEvents} from "../../../types/Events";
import {SortPostsTimeFrame, SortSearchOrder} from "../../../types/misc";
import {RedditApiObj, RedditListingObj, RedditSubredditObj} from "../../../types/redditTypes";
import {getLoadingIcon} from "../../../utils/htmlStatics";
import {elementWithClassInTree, isElementIn} from "../../../utils/htmlStuff";
import {debounce, extractPath, extractQuery, getSubredditIconUrlCached, hasHTML, isParamRedditTruthy, makeElement} from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_DropDown, {DirectionX, DirectionY} from "../../misc/dropDown/dropDown";
import {DropDownActionData, DropDownEntryParam} from "../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Flair from "../../misc/flair/flair";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";
import Ph_Header from "../header/header";
import {makeSearchSortSectionEntries} from "../../feed/universalFeed/sortingDropdownParams";
import { fakeSubreddits } from "../../../utils/consts";

/**
 * A search field to search reddit for subreddits, user, and posts; child of Ph_Header
 */
export default class Ph_Search extends HTMLElement {
	searchBar: HTMLInputElement;
	sortBy: Ph_DropDown;
	flairSearch: Ph_DropDown;
	areFlairsLoaded: boolean = false;
	searchOrder = SortSearchOrder.relevance;
	searchTimeFrame = SortPostsTimeFrame.all;
	searchDropdown: HTMLDivElement;
	resultsWrapper: HTMLElement;
	searchForPostsGlobalLink: Ph_FeedLink;
	searchForPostsSubLink: Ph_FeedLink;
	// searchForCommentsLink: Ph_FeedLink;
	quickSearchDebounced: () => void;
	searchPrefix: string;	// r/ or user
	subModeBtn: HTMLLabelElement;
	userModeBtn: HTMLLabelElement;
	currentSubreddit: string = null;
	lastQuickSearchFor: string = "";
	searchInSubredditOnEnter: boolean = false;

	constructor() {
		super();
	}

	connectedCallback() {
		if (hasHTML(this)) return;

		this.classList.add("search");

		this.quickSearchDebounced = debounce(this.quickSearch.bind(this), 750);
		const url: string = history.state && history.state.url || location.pathname + location.search;

		this.subModeBtn = document.createElement("label");
		this.subModeBtn.className = "modeButton transparentButtonAlt";
		this.subModeBtn.setAttribute("for", "quickSearch")
		this.subModeBtn.innerText = "r/";
		this.append(this.subModeBtn);
		this.userModeBtn = document.createElement("label");
		this.userModeBtn.setAttribute("for", "quickSearch")
		this.userModeBtn.className = "modeButton transparentButtonAlt";
		this.userModeBtn.innerText = "u/";
		this.append(this.userModeBtn);
		this.subModeBtn.addEventListener("click", () => {
			this.subModeBtn.classList.toggle("checked");
			this.userModeBtn.classList.remove("checked");
			this.searchPrefix = this.searchPrefix === "/r/" ? "" : "/r/";
			this.quickSearch();
			this.searchBar.focus();
		});
		this.userModeBtn.addEventListener("click", () => {
			this.userModeBtn.classList.toggle("checked");
			this.subModeBtn.classList.remove("checked");
			this.searchPrefix = this.searchPrefix === "/user/" ? "" : "/user/";
			this.quickSearch();
			this.searchBar.focus();
		});

		this.searchBar = document.createElement("input");
		this.searchBar.type = "text";
		this.searchBar.autocomplete = "off";
		this.searchBar.id = "quickSearch";
		this.append(this.searchBar);
		this.searchBar.addEventListener("keypress", e => ["Enter", "NumpadEnter"].includes(e.code) && this.search(e));
		this.searchBar.addEventListener("input", this.onTextEnter.bind(this));
		this.searchBar.addEventListener("focus", this.onFocus.bind(this));

		const searchCollapser = document.createElement("button");
		searchCollapser.className = "searchCollapser transparentButton";
		searchCollapser.innerHTML = `<img src="/img/rightArrow.svg" draggable="false" alt="expand">`;
		searchCollapser.addEventListener("click", () => this.classList.toggle("collapsed"))
		this.append(searchCollapser);

		const toggleDropdownBtn = document.createElement("button")
		toggleDropdownBtn.className = "toggleDropdownButton transparentButton";
		toggleDropdownBtn.innerHTML = `<img src="/img/downArrow.svg" draggable="false" alt="expand">`;
		this.append(toggleDropdownBtn);

		const searchButton = document.createElement("button");
		searchButton.className = "searchButton transparentButton";
		searchButton.innerHTML = `<img src="/img/search.svg" draggable="false" alt="search">`;
		this.append(searchButton);
		searchButton.addEventListener("click", this.search.bind(this));

		this.searchDropdown = document.createElement("div");
		this.searchDropdown.className = "searchDropdown";
		this.append(this.searchDropdown);

		const accessibilitySpacer = document.createElement("div");
		accessibilitySpacer.className = "accessibilitySpacer";
		this.searchDropdown.append(accessibilitySpacer);
		
		
		this.searchForPostsGlobalLink = new Ph_FeedLink({
			kind: "custom",
			label: "Search for posts",
			subtext: "everywhere",
			url: "",
			iconUrl: "/img/search.svg",
			onclick: this.onGlobalSearchClick.bind(this),
		});
		this.searchForPostsSubLink = new Ph_FeedLink({
			kind: "custom",
			label: "Search for posts",
			subtext: "in this subreddit",
			url: "",
			iconUrl: "/img/search.svg",
			onclick: this.onSubSearchClick.bind(this),
		});
		// this.searchForCommentsLink = new Ph_FeedLink({
		// 	kind: "custom",
		// 	label: "Search for comments",
		// 	subtext: "under this post",
		// 	url: "",
		// 	iconUrl: "/img/search.svg",
		// });
		this.searchForPostsGlobalLink.classList.add("customLink");
		this.searchForPostsSubLink.classList.add("customLink");
		// this.searchForCommentsLink.classList.add("customLink");
		this.searchForPostsSubLink.classList.toggle("hide", !url.startsWith("/r/"));
		// this.searchForCommentsLink.classList.toggle("hide", !url.includes("/comments/"));
		this.resultsWrapper = makeElement("div", { class: "resultsWrapper" }, [
			this.searchForPostsGlobalLink,
			this.searchForPostsSubLink,
			// this.searchForCommentsLink,
		]);
		this.searchDropdown.append(this.resultsWrapper);

		const expandedOptions = document.createElement("div");
		expandedOptions.className = "expandedOptions";
		toggleDropdownBtn.addEventListener("click", this.toggleSearchDropdown.bind(this));
		this.searchDropdown.append(expandedOptions);

		const curSort = new URLSearchParams(extractQuery(url || ""));
		let curSortStr: string;
		if (history.state && /search$/i.test(extractPath(url)))
			curSortStr = `Sort - ${curSort.get("sort") || "relevance"}${curSort.get("t") ? `/${curSort.get("t")}` : ""}`;
		else
			curSortStr = `Sort - relevance/all`;
		this.sortBy = new Ph_DropDown(
			makeSearchSortSectionEntries(this.setSortOrder.bind(this)),
			curSortStr, DirectionX.right, DirectionY.bottom, false
		);
		expandedOptions.append(this.sortBy);

		this.flairSearch = new Ph_DropDown([], "Search by flair", DirectionX.right, DirectionY.bottom, false);
		expandedOptions.append(this.flairSearch);
		this.flairSearch.toggleButton.addEventListener("click", async  () => {
			if (this.areFlairsLoaded || !this.currentSubreddit)
				return;
			let flairData: any[] = await getSubFlairs(this.currentSubreddit);
			const flairs = flairData
				.map(flair => (<DropDownEntryParam> {
					label: Ph_Flair.fromFlairApi(flair, false),
					value: flair.text,
					onSelectCallback: this.searchByFlair.bind(this),
				}));
			if (flairs.length === 0)
				this.flairSearch.setEntries([{ label: `No flairs for ${this.currentSubreddit}` }]);
			else
				this.flairSearch.setEntries(flairs);
			this.areFlairsLoaded = true;
		});

		if (/\/search\/?$/i.test(extractPath(url))) {
			const currParams = new URLSearchParams(extractQuery(url));
			this.searchBar.value = currParams.get("q");
			this.searchOrder = SortSearchOrder[currParams.get("sort")];
			this.searchTimeFrame = SortPostsTimeFrame[currParams.get("t")];
			this.searchInSubredditOnEnter = isParamRedditTruthy(currParams.get("restrict_sr"), false);
		}

		window.addEventListener("click", e => {
			if (!isElementIn(this, e.target as HTMLElement))
				this.minimize();
		});
		window.addEventListener(PhEvents.viewChange, (e: CustomEvent) => {
			const url = (e.detail as ViewChangeData).viewState.state.url;
			const subMatches = url.match(/^\/r\/[^/?#]+/i);		// /r/all/top --> /r/all
			this.currentSubreddit = subMatches && subMatches[0] || null;
			const subName = this.currentSubreddit ? this.currentSubreddit.replace(/^\/r\//i, "").toLowerCase() : "";
			this.areFlairsLoaded = false;
			this.updateQuickLinks();
			if (this.currentSubreddit && !fakeSubreddits.includes(subName)) {
				this.flairSearch.setEntries([Users.current.d.auth.isLoggedIn ? {label: getLoadingIcon()} : {label: "Log in to list flairs"}]);
				this.flairSearch.classList.remove("hide");
				this.searchForPostsSubLink.classList.remove("hide");
				this.searchForPostsSubLink.setSubtext(`in ${this.currentSubreddit.slice((1))}`);
				this.searchForPostsSubLink.setImgUrl(getSubredditIconUrlCached(subName));
			}
			else {
				this.flairSearch.classList.add("hide");
				this.searchForPostsSubLink.classList.add("hide");
			}
		});
	}

	onTextEnter() {
		if (this.searchBar.value) {
			if (/^\/?r\//i.test(this.searchBar.value)) {				// starts with r/ or /r/
				this.searchBar.value = this.searchBar.value.replace(/^\/?r\//i, "");	// remove r/ prefix
				if (!this.subModeBtn.classList.contains("checked"))
					this.subModeBtn.click();
			}
			if (/^\/?(u|user)\//i.test(this.searchBar.value)) {		// starts with u/ or /u/ or user/ or ...
				this.searchBar.value = this.searchBar.value.replace(/^\/?(u|user)\//i, "");	// remove u/ prefix
				if (!this.userModeBtn.classList.contains("checked"))
					this.userModeBtn.click();
			}
			this.quickSearchDebounced();
		}
		this.updateQuickLinks();
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

	setSortOrder(data: DropDownActionData) {
		this.searchOrder = data.valueChain[0];
		this.searchTimeFrame = data.valueChain.length === 2 ? data.valueChain[1] : null;
		const sortStr = `Sort - ${this.searchOrder}${this.searchTimeFrame ? `/${this.searchTimeFrame}` : ""}`;
		data.setButtonLabel(sortStr);
		this.updateQuickLinks();
	}

	async quickSearch() {
		if (!this.searchBar.value || /^\/?(r|u|user)\/$/i.test(this.searchBar.value)) {		// prefix r/ or u/ or user/
			return;
		}

		this.resultsWrapper.classList.add("loading");
		// TODO take NSFW preferences into consideration
		let result: RedditListingObj<RedditApiObj>;
		try {
			let query: string;
			if (this.searchPrefix === "/user/") {
				query = `u/${this.searchBar.value}`;
				if (this.lastQuickSearchFor === query)
					return;
				result = await searchUser(this.searchBar.value, 10);
			}
			else {
				query = `r/${this.searchBar.value}`;
				if (this.lastQuickSearchFor === query)
					return;
				result = await searchSubreddits(this.searchBar.value, 10);
			}
			if (result["error"])
			throw result;
			this.lastQuickSearchFor = query;
		} catch (e) {
			console.error("Error loading quick search");
			console.error(e);
			new Ph_Toast(Level.error, "Error loading quick search");
			throw e;
		}
		finally {
			this.resultsWrapper.classList.remove("loading");
		}

		for (const child of [...this.resultsWrapper.children].slice(2)) {
			child.remove();
		}
		for (const entry of result.data.children) {
			try {
				this.resultsWrapper.append(new Ph_FeedLink(entry as RedditSubredditObj, { blurNsfw: true, showSubscribers: true }));
			}
			catch (e) {
				console.error("Error making search result entry");
				console.error(e);
				new Ph_Toast(Level.error, "Error making search result entry");
			}
		}
	}

	async search(e) {
		const inNewTab: boolean = e && e.ctrlKey || false;

		if (!this.searchBar.value) {
			new Ph_Toast(Level.warning, "Empty search query", { timeout: 2000 });
			return;
		}

		if (this.searchPrefix) {
			if (inNewTab)
				window.open(this.searchPrefix + this.searchBar.value);
			else
				pushLinkToHistoryComb(this.searchPrefix + this.searchBar.value);
			return;
		}

		const [url, paramsString] = this.getSearchUrl(this.searchInSubredditOnEnter);
		if (inNewTab)
			window.open(`${url}?${paramsString}`).focus();
		else {
			pushLinkToHistorySep(
				url, `?${paramsString}`
			);
		}
	}

	updateQuickLinks() {
		this.searchForPostsGlobalLink.setUrl(this.getSearchUrl(false).join("?"));
		this.searchForPostsSubLink.setUrl(this.getSearchUrl(true).join("?"));
	}

	private getSearchUrl(searchInSubreddit: boolean): [string, string] {
		let url = "/search";
		const currentSubMatches = history.state.url.match(/\/r\/([^/?#]+)/i);		// /r/pics/top --> /r/pics
		if (searchInSubreddit && currentSubMatches && currentSubMatches[0] && searchInSubreddit)
			url = currentSubMatches[0].replace(/\/?$/, "/search");		// /r/pics --> /r/pics/search

		const paramsString = new URLSearchParams([
			["q", this.searchBar.value],
			["type", "link"],
			["restrict_sr", searchInSubreddit ? "true" : "false"],
			["sort", this.searchOrder],
			["t", this.searchTimeFrame || ""],
		]).toString();
		return [url, paramsString];
	}

	searchByFlair(data: DropDownActionData) {
		const flairText = data.valueChain[0] as string;
		this.searchInSubredditOnEnter = true;
		this.searchBar.value = `flair:${flairText}`;
		this.searchPrefix = "";
		this.search(null);
	}

	private onGlobalSearchClick() {
		this.searchInSubredditOnEnter = false;
	}

	private onSubSearchClick() {
		this.searchInSubredditOnEnter = true;
	}

}

customElements.define("ph-search", Ph_Search);
