import { redditApiRequest } from "../../../api/redditApi.js";
import ViewsStack from "../../../historyState/viewsStack.js";
import {
	NonSortableUserSections,
	PostSorting,
	RedditApiType,
	SortPostsOrder,
	SortPostsTimeFrame,
	SortUserPostsOrder,
	UserSection
} from "../../../types/misc.js";
import { thisUser } from "../../../utils/globals.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { hasParams, extractPath, extractQuery, splitPathQuery } from "../../../utils/utils.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import { FeedType } from "../feedInfo/feedInfo.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

/** Sorts a universal feed */
export default class Ph_UniversalFeedSorter extends HTMLElement {
	feedType: FeedType;
	feed: Ph_UniversalFeed;
	sectionDropDown: Ph_DropDown;
	sortDropDown: Ph_DropDown;

	constructor(feed: Ph_UniversalFeed, feedType: FeedType, baseUrl: string) {
		super();
		if (!hasParams(arguments)) return;

		this.feedType = feedType;
		this.feed = feed;
		this.className = "feedSorter";

		if (feedType === FeedType.user) {
			const tmpCurSection = feed.requestUrl.match(/(?<=^\/(u|user)\/[^/?#]+\/)\w+/i);		// /user/username/top --> top
			const curSection = tmpCurSection && tmpCurSection[0] || "Overview";
			const userSections = <DropDownEntryParam[]> [
				{ label: "Overview", value: UserSection.overview, onSelectCallback: this.setUserSection.bind(this) },
				{ label: "Posts", value: UserSection.posts, onSelectCallback: this.setUserSection.bind(this) },
				{ label: "Comments", value: UserSection.comments, onSelectCallback: this.setUserSection.bind(this) },
				{ label: "Gilded", value: UserSection.gilded, onSelectCallback: this.setUserSection.bind(this) },
			];
			if (new RegExp(`/${thisUser.name}$`, "i").test(baseUrl)) {
				userSections.push(...[
					{ label: "Upvoted", value: UserSection.upvoted, onSelectCallback: this.setUserSection.bind(this) },
					{ label: "Downvoted", value: UserSection.downvoted, onSelectCallback: this.setUserSection.bind(this) },
					{ label: "Hidden", value: UserSection.hidden, onSelectCallback: this.setUserSection.bind(this) },
					{ label: "Saved", value: UserSection.saved, onSelectCallback: this.setUserSection.bind(this) }
				]);
			}
			this.sectionDropDown = new Ph_DropDown(userSections, curSection, DirectionX.left, DirectionY.bottom, false);
			this.append(this.sectionDropDown);
		}

		const query = new URLSearchParams(extractQuery(history.state?.url || ""));
		let tmpCurSort = extractPath(history.state?.url || "").match(/(?<=\/)\w+$/);	// /r/all/top --> top
		let curSort = query.get("sort") || tmpCurSort && tmpCurSort[0] || "";
		if (!(Object.values(SortPostsOrder) as string[]).includes(curSort.toLowerCase()))
			curSort = "default";
		const curSortTime = query.get("t");
		const curSortStr = `Sort - ${curSort}${curSortTime ? `/${curSortTime}` : ""}`;
		let dropDownParams: DropDownEntryParam[];
		if (feedType !== FeedType.user) {
			dropDownParams = [
				{ label: "Default", value: SortPostsOrder.default, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Hot", value: SortPostsOrder.hot, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Top", value: SortPostsOrder.top, nestedEntries: [
						{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ label: "Rising", value: SortPostsOrder.rising, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "New", value: SortPostsOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Controversial", value: SortPostsOrder.controversial, nestedEntries: [
						{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ label: "Gilded", value: SortPostsOrder.gilded, onSelectCallback: this.handleSortSelect.bind(this) },
			];
		}
		else {
			dropDownParams = [
				{ label: "Default", value: SortUserPostsOrder.default, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Hot", value: SortUserPostsOrder.hot, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Top", value: SortUserPostsOrder.top, nestedEntries: [
						{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Month", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
				{ label: "New", value: SortUserPostsOrder.new, onSelectCallback: this.handleSortSelect.bind(this) },
				{ label: "Controversial", value: SortUserPostsOrder.controversial, nestedEntries: [
						{ label: "Hour", value: SortPostsTimeFrame.hour, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Day", value: SortPostsTimeFrame.day, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Week", value: SortPostsTimeFrame.week, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Moth", value: SortPostsTimeFrame.month, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "Year", value: SortPostsTimeFrame.year, onSelectCallback: this.handleSortSelect.bind(this) },
						{ label: "All Time", value: SortPostsTimeFrame.all, onSelectCallback: this.handleSortSelect.bind(this) }
					] },
			];
		}
		this.sortDropDown = new Ph_DropDown(dropDownParams, curSortStr, DirectionX.right, DirectionY.bottom, false)
		this.append(this.sortDropDown);
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

		if (this.feedType !== FeedType.user) {
			const pathEnding = path.match(/\w*\/?$/)[0];
			if (SortPostsOrder[pathEnding]) {
				path = path.replace(/\w*\/?$/, sortingMode.order);		// /r/all/top --> /r/all/<newOrder>
			} else {
				path = path.replace(/\/?$/, "/");				// /r/all/ --> /r/all/<newOrder>
				path += sortingMode.order;
			}
		}

		const params = new URLSearchParams(query);
		if (this.feedType === FeedType.user)
			params.set("sort", sortingMode.order);
		if (sortingMode.order == SortPostsOrder.top || sortingMode.order == SortPostsOrder.controversial)
			params.set("t", sortingMode.timeFrame);
		else
			params.delete("t");

		const paramsStr = params.toString();
		const newUrl = path + (paramsStr ? `?${paramsStr}` : "");
		this.feed.requestUrl = newUrl;
		const request: RedditApiType = await redditApiRequest(newUrl, [], false);
		if (request["error"]) {
			new Ph_Toast(Level.error, "Error making request to reddit");
			throw `Error making sort request: ${JSON.stringify(request)}`;
		}
		ViewsStack.changeCurrentUrl(newUrl);

		this.feed.replaceChildren(request.data.children, request.data.before, request.data.after);
	}

	async setUserSection([section]: UserSection[], setLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement) {
		setLabel(getLoadingIcon());
		const userName = this.feed.requestUrl.match(/(?<=^\/(u|user)\/)[^/?#]+/i)[0];		// /u/user --> user
		const query = extractQuery(this.feed.requestUrl);
		const isSortable = !NonSortableUserSections.includes(section);
		this.feed.requestUrl = `/user/${userName}/${section}${isSortable ? query : ""}`;
		try {
			const sectionItems: RedditApiType = await redditApiRequest(
				this.feed.requestUrl,
				[],
				false
			);
			this.feed.beforeData = sectionItems.data.before;
			this.feed.afterData = sectionItems.data.after;
			this.feed.replaceChildren(sectionItems.data.children, sectionItems.data.before, sectionItems.data.after);
			ViewsStack.changeCurrentUrl(this.feed.requestUrl);
			setLabel(section || "Overview");
			if (isSortable) {
				if (this.sortDropDown.classList.contains("hide"))
					this.sortDropDown.setLabel("Sorting");
				this.sortDropDown.classList.remove("hide");
			}
			else
				this.sortDropDown.classList.add("hide");
		} catch (e) {
			new Ph_Toast(Level.error, "Error getting user section items");
			console.error("Error getting user section items");
			console.error(e);
			setLabel(initialLabel);
		}
	}
}

customElements.define("ph-universal-feed-sorter", Ph_UniversalFeedSorter);
