import { redditApiRequest, subscribe } from "../../../api/redditApi.js";
import { isLoggedIn, MultiReddit, StoredData } from "../../../utils/globals.js";
import { $class, escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { classInElementTree, linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../types/misc.js";
import { numberToShort, replaceRedditLinks, stringSortComparer, throttle } from "../../../utils/utils.js";
import Ph_Header from "../../global/header/header.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import { FlairData } from "../../misc/flair/flair.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import { clearAllOldData } from "./feedInfoCleanup.js";
import Ph_BetterButton from "../../global/betterElements/betterButton.js";

export enum FeedType {
	subreddit = "subreddit",
	multireddit = "multireddit",
	user = "user",
	messages = "messages",
	misc = "misc",
}
interface StoredFeedInfo extends StoredData {
	feedType: FeedType;
}

interface SubredditRule {
	kind: string,
	description: string,
	short_name: string,
	violation_reason: string
	created_utc: number,
	priority: number,
	description_html: string
}

interface SubredditModerator {
	name: string,
	author_flair_text: string,
	mod_permissions: string[],
	date: number,
	rel_id: string,
	id: string,
	author_flair_css_class: string
}

/**
 * Big area to display info about a feed (subreddit, user, multireddit)
 *
 * Should be created, opened, ... with Ph_FeedInfo.getInfoButton()
 */
export default class Ph_FeedInfo extends HTMLElement {
	/** has data been loaded (from reddit) & is it being displayed */
	hasLoaded: boolean = false;
	loadedInfo: StoredFeedInfo;
	/** path for the feed, example: "/r/askreddit" */
	feedUrl: string;
	focusLossHideRef: (e: MouseEvent) => void;
	hideRef: () => void;
	/** after this time cached data in the localstorage should be invalidated */
	static refreshEveryNMs = 2 * 60 * 60 * 1000;		// 2 hours
	static supportedFeedTypes: FeedType[] = [FeedType.subreddit, FeedType.user, FeedType.multireddit];
	/** All feed infos that are currently loaded */
	static loadedInfos: { [feedUrl: string]: { feedInfo: Ph_FeedInfo, references: number } } = {};

	/** Returns a button element that will open/close a feed info; preferred way for creating a feed info */
	static getInfoButton(feedType: FeedType, feedUrl: string): HTMLButtonElement {
		const button = new Ph_BetterButton();
		button.className = "showInfo transparentButtonAlt";
		button.innerHTML = `<img src="/img/info.svg" draggable="false" alt="info">`;
		button.setAttribute("data-feed-url", feedUrl);
		button.setAttribute("data-feed-type", FeedType[feedType]);

		const info = Ph_FeedInfo.getOrMakeFeedInfo(feedUrl, feedType);

		button.addEventListener("click", info.feedInfo.toggle.bind(info.feedInfo));

		button.addEventListener("ph-added", () => Ph_FeedInfo.onButtonAddedOrRemoved(button, true));
		button.addEventListener("ph-removed", () => Ph_FeedInfo.onButtonAddedOrRemoved(button, false));

		return button;
	}

	private static getOrMakeFeedInfo(feedUrl: string, feedType: FeedType): { feedInfo: Ph_FeedInfo, references: number } {
		let info = Ph_FeedInfo.loadedInfos[feedUrl]
		if (!info)
			Ph_FeedInfo.loadedInfos[feedUrl] = info = { feedInfo: new Ph_FeedInfo(feedType, feedUrl), references: 0 };
		if (!info.feedInfo.parentElement)
			info.feedInfo.addToDOM();
		return info;
	}

	/** Gets called whenever the info button get's added or removed from the DOM */
	private static onButtonAddedOrRemoved(button: HTMLButtonElement, wasAdded: boolean) {
			const feedUrl: string = button.getAttribute("data-feed-url");
			const feedType: FeedType = FeedType[button.getAttribute("data-feed-type")];
			const feedInfo = Ph_FeedInfo.getOrMakeFeedInfo(feedUrl, feedType);
			if (wasAdded) {
				feedInfo.references++;
			}
			else {
				feedInfo.references--;
			}

			if (feedInfo.references === 0) {
				feedInfo.feedInfo.remove();
				delete Ph_FeedInfo.loadedInfos[feedUrl];
			}
	}

	/** should not be called from outside this file */
	constructor(feedType: FeedType, feedUrl: string) {
		super();

		this.feedUrl = feedUrl;
		this.focusLossHideRef = e => classInElementTree(e.target as HTMLElement, "feedInfo") || this.hide();
		this.hideRef = this.hide.bind(this);
		this.className = "feedInfo remove";

		const storedInfo = localStorage[feedUrl.toLowerCase()];
		if (storedInfo) {
			this.loadedInfo = JSON.parse(storedInfo);
		}
		else {
			this.loadedInfo = {
				data: null,
				feedType: feedType,
				lastUpdatedMsUTC: 1
			};
		}

		this.addToDOM();
	}

	/** Adds this feed info to the dom at the correct place */
	addToDOM() {
		document.body.appendChild(this);
	}

	/** Will load (maybe from cache) info for this feed & display it */
	async getOrUpdateInfo() {
		const isValid = this.isLoadedInfoValid();
		if (!isValid) {
			this.removeInfo();
			new Ph_Toast(Level.Error, `Corrupted feed info for ${escHTML(this.feedUrl)}`);
			console.error(`Corrupted feed info for ${this.feedUrl} (${JSON.stringify(this.loadedInfo)})`);
			throw "Corrupted feed info";
		}
		if (!isValid || this.loadedInfo.lastUpdatedMsUTC + Ph_FeedInfo.refreshEveryNMs < Date.now()) {
			this.classList.add("loading");
			// get it
			switch (this.loadedInfo.feedType) {
				case FeedType.subreddit:
					await this.loadSubredditInfo();
					break;
				case FeedType.multireddit:
					await this.loadMultiInfo();
					break;
				case FeedType.user:
					await this.loadUserInfo();
					break;
				case FeedType.misc:
				default:
					break;
			}
			this.classList.remove("loading");
		}
		else
			window.dispatchEvent(new CustomEvent("feedInfoReady", { detail: this }));

		// display it
		switch (this.loadedInfo.feedType) {
			case FeedType.subreddit:
				this.displaySubredditInfo();
				break;
			case FeedType.user:
				this.displayUserInfo();
				break;
			case FeedType.multireddit:
				this.displayMultiInfo();
				break;
			case FeedType.misc:
			default:
				this.innerText = `Unknown feed type ${this.loadedInfo.feedType} for ${this.feedUrl}`;
				new Ph_Toast(Level.Warning, `Unknown feed type ${this.loadedInfo.feedType} for ${escHTML(this.feedUrl)}`);
				break;
		}
	}

	async loadSubredditInfo() {
		let feedAbout: RedditApiType;
		let rules: SubredditRule[];
		let mods: SubredditModerator[];
		let flairs: FlairData[];
		try {
			feedAbout = await redditApiRequest(`${this.feedUrl}/about`, [], false);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
			const tmpRules = await redditApiRequest(`${this.feedUrl}/about/rules`, [], false);
			if (tmpRules["error"] || !tmpRules["rules"])
				throw `Invalid rules response ${JSON.stringify(tmpRules)}`;
			rules = tmpRules["rules"];
			const tmpMods = await redditApiRequest(`${this.feedUrl}/about/moderators`, [], false);
			if (tmpMods["error"] || !(tmpMods["kind"] === "UserList" && tmpMods["data"]))
				throw `Invalid mods response ${JSON.stringify(tmpRules)}`;
			mods = tmpMods["data"]["children"];

		} catch (e) {
			new Ph_Toast(Level.Error, "Error getting subreddit info");
			console.error(`Error getting subreddit info for ${this.feedUrl}`);
			console.error(e);
		}
		let tmpFlairs: Object[];
		if (isLoggedIn) {
			try {
				tmpFlairs = await redditApiRequest(`${this.feedUrl}/api/link_flair_v2`, [], true);
				if (tmpFlairs["error"])		// no post flairs from this sub
					tmpFlairs = [];
			} catch (e) {
				tmpFlairs = [];
			}
		}
		else
			tmpFlairs = [];

		flairs = tmpFlairs.map(flair => ({
			type: flair["type"],
			text: flair["text"],
			backgroundColor: flair["background_color"],
			richText: flair["richtext"],
			textColor: flair["text_color"]
		}));
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.data.rules = rules;
		this.loadedInfo.data.mods = mods;
		this.loadedInfo.data.flairs = flairs;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displaySubredditInfo() {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton(() => this.loadSubredditInfo().then(this.displaySubredditInfo.bind(this))));

		const bannerUrl = this.loadedInfo.data["banner_img"] || this.loadedInfo.data["header_img"] || this.loadedInfo.data["banner_background_image"];
		if (bannerUrl) {
			this.makeBannerImage(bannerUrl, this, this.loadedInfo.data["banner_background_color"]);
		}
		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["community_icon"] || this.loadedInfo.data["icon_img"];
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.alt = "profile";
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const overviewBar = document.createElement("div");
		overviewBar.className = "overviewBar";
		const subActionsWrapper = document.createElement("div");
		subActionsWrapper.className = "subActionsWrapper";
		overviewBar.appendChild(subActionsWrapper);
		const subscribeButton = document.createElement("button");
		subscribeButton.className = "subscribeButton";
		subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
		subscribeButton.addEventListener("click", async () => {
			this.loadedInfo.data["user_is_subscriber"] = !this.loadedInfo.data["user_is_subscriber"];
			subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
			if (await subscribe(this.loadedInfo.data["name"], this.loadedInfo.data["user_is_subscriber"])) {
				new Ph_Toast(Level.Success, "", { timeout: 2000 });
			}
			else {
				this.loadedInfo.data["user_is_subscriber"] = !this.loadedInfo.data["user_is_subscriber"];
				subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
				new Ph_Toast(Level.Error, `Error subscribing to subreddit`, { timeout: 2000 });
			}

		});
		subActionsWrapper.appendChild(subscribeButton);
		const dropDownEntries: DropDownEntryParam[] = [];
		dropDownEntries.push({displayHTML: `<a href="${this.feedUrl}">Visit</a>`})
		dropDownEntries.push({displayHTML: `<a href="${this.feedUrl}/submit">Submit Post</a>`})
		if (localStorage.multis) {
			const userMultis = ((JSON.parse(localStorage.multis) as StoredData).data as MultiReddit[]);
			dropDownEntries.push({
				displayHTML: "Add to Multireddit",
				nestedEntries:
					userMultis.map(multi => ({
						displayHTML: multi.display_name,
						value: multi.path,
						onSelectCallback: ([_, multiPath]) => this.addSubToMulti(this.feedUrl, multiPath.replace(/\/?$/, ""), false)
					}))
			});
		}
		subActionsWrapper.appendChild(new Ph_DropDown(
			dropDownEntries,
			`<img src="/img/kebab.svg" draggable="false" alt="menu">`,
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["subscribers"]}">
				Subscribers: ${numberToShort(this.loadedInfo.data["subscribers"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["active_user_count"]}">
				Online: ${numberToShort(this.loadedInfo.data["active_user_count"])} &nbsp — &nbsp; 
				${(this.loadedInfo.data["active_user_count"] / this.loadedInfo.data["subscribers"] * 100).toFixed(1)} %
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data["title"] || this.loadedInfo.data["display_name"];
		this.appendChild(title);

		const description = document.createElement("div");
		description.innerHTML = this.loadedInfo.data["description_html"];
		const publicDescription = document.createElement("div");
		publicDescription.innerHTML = this.loadedInfo.data["public_description_html"];
		replaceRedditLinks(publicDescription);
		linksToSpa(publicDescription);
		const rules = document.createElement("div");
		rules.append(...this.makeRules());
		replaceRedditLinks(rules);
		linksToSpa(rules);
		const miscText = document.createElement("div");
		miscText.innerHTML = `
			<div>Created: ${new Date(this.loadedInfo.data["created_utc"] * 1000).toDateString()}</div>
			<div>Moderators:</div>
			${(this.loadedInfo.data.mods as SubredditModerator[])
			.map(mod => `<div><a href="/user/${escADQ(mod.name)}">${escHTML(mod.name)}</a></div>`)
			.join("\n")}	
		`;
		replaceRedditLinks(miscText);
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Description", content: description },
			{ titleHTML: "Public Description", content: publicDescription },
			{ titleHTML: "Rules", content: rules },
			{ titleHTML: "Other", content: miscText },
		]));

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	async loadUserInfo() {
		let feedAbout: RedditApiType;
		let multis: RedditApiType[];
		try {
			feedAbout = await redditApiRequest(`${this.feedUrl}/about`, [], false);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
			multis = await redditApiRequest(`/api/multi/user/${this.feedUrl.match(/(?<=(u|user)\/)[^/]*/)[0]}`, [], false);
			if (multis["error"])
				throw `Invalid user multis response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.Error, "Error getting user info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.data.multis = multis;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayUserInfo() {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton(() => this.loadUserInfo().then(this.displayUserInfo.bind(this))));

		const bannerUrl = this.loadedInfo.data["subreddit"]["banner_img"];
		if (bannerUrl)
			this.makeBannerImage(bannerUrl, this, this.loadedInfo.data["subreddit"]["banner_background_color"] || undefined);

		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["subreddit"]["icon_img"] || this.loadedInfo.data["icon_img"];
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.alt = "profile";
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const overviewBar = document.createElement("div");
		overviewBar.className = "overviewBar";
		const userActionsWrapper = document.createElement("div");
		userActionsWrapper.className = "subActionsWrapper";
		overviewBar.appendChild(userActionsWrapper);
		userActionsWrapper.appendChild(new Ph_DropDown(
			[],
			`<img src="/img/kebab.svg" alt="menu" draggable="false">`,
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["total_karma"]}">
				Karma: ${numberToShort(this.loadedInfo.data["total_karma"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["link_karma"]}">
				Link Karma: ${numberToShort(this.loadedInfo.data["link_karma"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["comment_karma"]}">
				Comment Karma: ${numberToShort(this.loadedInfo.data["comment_karma"])}
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data["subreddit"]["title"] || this.loadedInfo.data["name"];
		this.appendChild(title);

		const publicDescription = document.createElement("div");
		publicDescription.innerText = this.loadedInfo.data["subreddit"]["public_description"];
		const miscText = document.createElement("div");
		miscText.innerHTML = `
			<div>Created: ${new Date(this.loadedInfo.data["created_utc"] * 1000).toDateString()}</div>
		`;
		if (this.loadedInfo.data.multis.length > 0) {
			miscText.insertAdjacentHTML("beforeend", `
				<div>User Multireddits:</div>
				${this.loadedInfo.data.multis.map(multi => `<div><a href="${escADQ(multi.data.path)}">${escHTML(multi.data.display_name)}</a></div>`).join("")}
			`);
		}
		replaceRedditLinks(miscText);
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Description", content: publicDescription },
			{ titleHTML: "Other", content: miscText },
		]));

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	async loadMultiInfo() {
		let feedAbout: RedditApiType;
		try {
			feedAbout = await redditApiRequest(`/api/multi${this.feedUrl}`, [], false);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.Error, "Error getting multi info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		feedAbout.data["subreddits"] = feedAbout.data["subreddits"].map(sub => sub.name);
		feedAbout.data["subreddits"].sort(stringSortComparer);
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayMultiInfo() {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton(() => this.loadMultiInfo().then(this.displayMultiInfo.bind(this))));

		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["icon_url"];
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.alt = "profile";
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const overviewBar = document.createElement("div");
		overviewBar.className = "overviewBar";
		const userActionsWrapper = document.createElement("div");
		userActionsWrapper.className = "subActionsWrapper";
		overviewBar.appendChild(userActionsWrapper);
		userActionsWrapper.appendChild(new Ph_DropDown(
			[],
			`<img src="/img/kebab.svg" draggable="false" alt="menu">`,
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["num_subscribers"]}">
				Subscribers: ${numberToShort(this.loadedInfo.data["num_subscribers"])}
			</div>
			<div>
				Created: ${new Date(this.loadedInfo.data["created_utc"] * 1000).toDateString()}
			</div>
			<div>
				By: <a href="/user/${escADQ(this.loadedInfo.data["owner"])}">u/${escHTML(this.loadedInfo.data["owner"])}</a>
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data["display_name"];
		this.appendChild(title);

		const description = document.createElement("div");
		description.innerHTML = this.loadedInfo.data["description_html"];
		const miscText = document.createElement("div");
		miscText.append(...this.makeMultiSubManager());
		replaceRedditLinks(miscText);
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Description", content: description },
			{ titleHTML: "Subreddits", content: miscText },
		]));

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	private makeSwitchableBar(entries: { titleHTML: string, content: HTMLElement }[]): HTMLElement {
		const wrapper = document.createElement("div");
		wrapper.className = "switchableBar";
		const switcher = document.createElement("div");
		switcher.className = "switcher";
		wrapper.appendChild(switcher);
		const content = document.createElement("div");
		content.className = "content";
		wrapper.appendChild(content);
		for (let entry of entries) {
			const switchBtn = document.createElement("button");
			switchBtn.innerHTML = entry.titleHTML;
			switchBtn.addEventListener("click", () => {
				content.firstElementChild?.remove();
				content.appendChild(entry.content);
				switcher.$classAr("selected").forEach((el: HTMLElement) => el.classList.remove("selected"));
				switchBtn.classList.add("selected");
			});
			switcher.appendChild(switchBtn);
		}
		(switcher.children[0] as HTMLButtonElement).click();
		return wrapper;
	}

	private makeRefreshButton(refreshAction: () => void): HTMLElement {
		const refreshButton = document.createElement("button");
		refreshButton.className = "refreshButton transparentButtonAlt";
		refreshButton.innerHTML = `<img src="/img/refresh.svg" draggable="false" alt="refresh">`;
		refreshButton.setAttribute("data-tooltip", "auto ever 2h");
		refreshButton.addEventListener("click", refreshAction);
		return refreshButton;
	}

	private makeBannerImage(bannerUrl: string, appendTo: HTMLElement, bgColo: string): void {
		const bannerImg = document.createElement("img");
		bannerImg.src = bannerUrl;
		bannerImg.alt = "banner";
		bannerImg.className = "bannerImg";
		if (this.loadedInfo.data["banner_background_color"])
			bannerImg.style.setProperty("--banner-bg", this.loadedInfo.data["banner_background_color"]);
		appendTo.appendChild(bannerImg);
	}

	private makeRules(): HTMLElement[] {
		return this.loadedInfo.data.rules.map((rule: SubredditRule) => {
			const ruleWrapper = document.createElement("div");
			ruleWrapper.className = "ruleWrapper";
			const title = document.createElement("button");
			title.innerText = rule.short_name;
			ruleWrapper.appendChild(title);
			if (rule.description_html) {
				title.classList.add("expandable")
				title.addEventListener("click", () => title.classList.toggle("expanded"));
				const description = document.createElement("div");
				description.innerHTML = rule.description_html;
				ruleWrapper.appendChild(description);
			}
			return ruleWrapper;
		});
	}

	private makeMultiSubManager(): HTMLElement[] {
		const outElements: HTMLElement[] = [];

		const addSubredditBar = document.createElement("div");
		addSubredditBar.className = "editableSub addSub";

		const addSubButton = document.createElement("button");
		addSubButton.className = "addSub transparentButtonAlt";
		addSubredditBar.appendChild(addSubButton);

		const addSubInput = document.createElement("input");
		addSubInput.type = "text";
		addSubInput.placeholder = "Subreddit";

		const subsSearchResults = document.createElement("div");
		subsSearchResults.className = "subsSearchResults remove";
		addSubredditBar.appendChild(subsSearchResults);

		addSubredditBar.appendChild(addSubInput);
		addSubButton.addEventListener("click", e => this.addSubToMulti(
			addSubInput.value,
			this.feedUrl,
			true,
			(e.currentTarget as HTMLElement).parentElement.parentElement)
		);
		addSubInput.addEventListener("keypress", e => e.code === "Enter" && this.addSubToMulti(
			addSubInput.value,
			this.feedUrl,
			true,
			(e.currentTarget as HTMLElement).parentElement.parentElement)
		);
		addSubInput.addEventListener("input", throttle(async () => {
			addSubInput.value = addSubInput.value.replace(/^\/?r\//, "");
			if (addSubInput.value) {
				subsSearchResults.classList.remove("remove");
				const subs: { names: string[] } = await redditApiRequest("/api/search_reddit_names", [["query", addSubInput.value]], false);
				subsSearchResults.innerText = "";
				subs.names.forEach(sub => {
					const selectSubBtn = document.createElement("button");
					selectSubBtn.innerText = sub;
					selectSubBtn.addEventListener("click", e => this.addSubToMulti(
						sub,
						this.feedUrl,
						true,
						(e.currentTarget as HTMLElement).parentElement.parentElement.parentElement)
					);
					subsSearchResults.appendChild(selectSubBtn);
				});
			}
			else {
				subsSearchResults.classList.add("remove");
			}
		}, 500, { leading: true, trailing: true }));
		addSubInput.addEventListener("blur", () => subsSearchResults.classList.add("remove"));

		outElements.push(addSubredditBar);

		this.loadedInfo.data.subreddits.forEach(sub => outElements.push(this.makeRemoveSubBar(sub)));

		return outElements;
	}

	private makeRemoveSubBar(sub: string) {
		const removeSubredditBar = document.createElement("div");
		removeSubredditBar.className = "editableSub";
		const removeSubButton = document.createElement("button");
		removeSubButton.className = "removeSub transparentButton";
		removeSubredditBar.appendChild(removeSubButton);
		const addSubText = document.createElement("div");
		addSubText.innerHTML = `<a href="/r/${escADQ(sub)}">r/${escHTML(sub)}</a>`;
		removeSubredditBar.appendChild(addSubText);
		removeSubButton.addEventListener("click",
			e => this.removeSubFromMulti(
				(e.currentTarget as HTMLElement).parentElement.$tag("a")[0].innerHTML,
				this.feedUrl,
				(e.currentTarget as HTMLElement).parentElement)
		);
		return removeSubredditBar;
	}

	private async addSubToMulti(subName: string, multiPath: string, sourceIsMulti: boolean, subsList?: HTMLElement) {
		subName = subName.replace(/^\/?r\//, "");
		if (subName === "")
			return;
		if (sourceIsMulti && this.loadedInfo.data.subreddits.includes(subName)) {
			new Ph_Toast(Level.Warning, `r/${escHTML(subName)} already exists in ${escHTML(multiPath)}`, { timeout: 6000 });
			return;
		}
		try {
			const response = await redditApiRequest(
				`/api/multi${multiPath}/r/${subName}`,
				[
					["model", JSON.stringify({ name: subName })]
				],
				true,
				{ method: "PUT" }
			);
			if (response["explanation"]) {
				new Ph_Toast(Level.Error, escHTML(response["explanation"]), { timeout: 6000 });
				return;
			}
			if (!response["name"])
				throw `Invalid add to multi response ${JSON.stringify(response)}`;
			if (sourceIsMulti) {
				this.loadedInfo.data.subreddits.push(response["name"]);
				this.loadedInfo.data.subreddits.sort(stringSortComparer);
				this.saveInfo();
			}
			else if (localStorage[multiPath.toLowerCase()]) {
				// force reload on next load
				const multiData: StoredData = JSON.parse(localStorage[multiPath.toLowerCase()]);
				multiData.lastUpdatedMsUTC = 1;
				localStorage[multiPath.toLowerCase()] = JSON.stringify(multiData);
			}
			if (subsList) {
				const newSubIndex = this.loadedInfo.data.subreddits.indexOf(response["name"]);
				subsList.children[newSubIndex].insertAdjacentElement("afterend", this.makeRemoveSubBar(response["name"]));
				(subsList.$tag("input")[0] as HTMLInputElement).value = "";
			}

		} catch (e) {
			new Ph_Toast(Level.Error, "Error adding sub to multi");
			console.error("Error adding sub to multi");
			console.error(subName);
		}
	}

	private async removeSubFromMulti(subName: string, multiPath: string, editSubBar: HTMLElement) {
		subName = subName.replace(/^\/?r\//, "");
		if (!this.loadedInfo.data.subreddits.includes(subName)) {
			new Ph_Toast(Level.Warning, `r/${escHTML(subName)} does not exist in ${escHTML(multiPath)}`, { timeout: 6000 });
			return;
		}
		try {
			await redditApiRequest(
				`/api/multi${multiPath}/r/${subName}`,
				[],
				true,
				{ method: "DELETE" }
			);
			editSubBar.remove();
			this.loadedInfo.data.subreddits.splice(this.loadedInfo.data.subreddits.indexOf(subName), 1);
			this.saveInfo();
		} catch (e) {
			new Ph_Toast(Level.Error, "Error removing sub from multi");
			console.error("Error removing sub from multi");
			console.error(subName);
		}
	}

	async forceLoad() {
		if (!this.hasLoaded)
			await this.getOrUpdateInfo();
	}

	/** caches feed info to localstorage */
	saveInfo() {
		localStorage.setItem(this.feedUrl.toLowerCase(), JSON.stringify(this.loadedInfo));
		window.dispatchEvent(new CustomEvent("feedInfoReady", { detail: this }));
	}

	/** removes a cached feed info from localstorage */
	removeInfo() {
		localStorage.removeItem(this.feedUrl.toLowerCase());
	}

	isLoadedInfoValid(): boolean {
		return this.loadedInfo.lastUpdatedMsUTC > 0 &&
			Object.values(FeedType).includes(this.loadedInfo.feedType);
	}

	toggle() {
		if (this.classList.contains("remove"))
			this.show();
		else
			this.hide();
	}

	show() {
		if (this.parentElement === null)
			this.addToDOM();

		this.classList.remove("remove");
		($class("header")[0] as Ph_Header).hide();
		setTimeout(() => window.addEventListener("click", this.focusLossHideRef), 0);
		window.addEventListener("ph-view-change", this.hideRef);
		this.forceLoad();
	}

	hide() {
		this.classList.add("remove");
		window.removeEventListener("click", this.focusLossHideRef);
		window.removeEventListener("ph-view-change", this.hideRef);
	}
}

customElements.define("ph-feed-info", Ph_FeedInfo);

// wait 10 seconds to avoid additional lag
setTimeout(() => {
		clearAllOldData();
		setInterval(() => clearAllOldData(), 1000 * 60 * 60);		// clear cache every 60 minutes
	}
, 10 * 1000);
