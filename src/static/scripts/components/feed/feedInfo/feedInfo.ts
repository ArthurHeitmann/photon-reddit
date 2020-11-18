import { redditApiRequest, subscribe } from "../../../api/api.js";
import { classInElementTree, escapeHTML, linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../utils/types.js";
import { numberToShort } from "../../../utils/utils.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import { FeedType } from "../universalFeed/universalFeed.js";

interface StoredFeedInfo {
	data: any;
	feedType: FeedType;
	lastUpdatedMsUTC: number;
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

export default class Ph_FeedInfo extends HTMLElement {
	focusLossHideRef: (e: MouseEvent) => void;
	hideRef: () => void;
	loadedInfo: StoredFeedInfo;
	feedUrl: string;
	static refreshEveryNMs = 2 * 60 * 60 * 1000;		// 2 hours

	constructor(feedType: FeedType, feedUrl: string) {
		super();

		this.feedUrl = feedUrl;
		this.focusLossHideRef = e => classInElementTree(e.target as HTMLElement, "feedInfo") || this.hide();
		this.hideRef = this.hide.bind(this);
		this.className = "feedInfo remove";

		const storedInfo = localStorage[feedUrl];
		if (storedInfo)
			this.loadedInfo = JSON.parse(storedInfo);
		else {
			this.loadedInfo = {
				data: null,
				feedType: feedType,
				lastUpdatedMsUTC: 1
			};
		}
		this.getOrUpdateInfo();

		document.body.appendChild(this);
	}

	async getOrUpdateInfo() {
		const isValid = this.isLoadedInfoValid();
		// if (isValid && this.loadedInfo.lastUpdatedMsUTC + Ph_FeedInfo.refreshEveryNMs > Date.now())
		// 	return
		/*else */
		if (!isValid) {
			this.removeInfo();
			new Ph_Toast(Level.Error, `Corrupted feed info for ${this.feedUrl}`);
			console.error(`Corrupted feed info for ${this.feedUrl} (${JSON.stringify(this.loadedInfo)})`);
			throw "Corrupted feed info";
		}
		if (!isValid || this.loadedInfo.lastUpdatedMsUTC + Ph_FeedInfo.refreshEveryNMs < Date.now()) {
			switch (this.loadedInfo.feedType) {
				case FeedType.subreddit:
					await this.loadSubredditInfo();
					break;
				case FeedType.multireddit:
				// break;
				case FeedType.user:
				// break;
				case FeedType.misc:
				// break;
				default:
					break;
			}
		}

		switch (this.loadedInfo.feedType) {
			case FeedType.subreddit:
				this.displaySubredditInfo();
				break;
			case FeedType.multireddit:
				// break;
			case FeedType.user:
				// break;
			case FeedType.misc:
				// break;
			default:
				this.innerText = `Unknown feed type ${this.loadedInfo.feedType} for ${this.feedUrl}`;
				new Ph_Toast(Level.Warning, `Unknown feed type ${this.loadedInfo.feedType} for ${this.feedUrl}`);
				break;
		}
	}

	async loadSubredditInfo() {
		let feedAbout: RedditApiType;
		let rules: SubredditRule[];
		let mods: SubredditModerator[];
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
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.data.rules = rules;
		this.loadedInfo.data.mods = mods;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displaySubredditInfo() {
		this.innerText = "";

		const refreshButton = document.createElement("button");
		refreshButton.className = "refreshButton transparentButtonAlt";
		refreshButton.innerHTML = `<img src="/img/refresh.svg" draggable="false" alt="refresh">`;
		refreshButton.setAttribute("data-tooltip", "auto ever 2h");
		refreshButton.addEventListener("click", () => {
			this.loadSubredditInfo().then(this.displaySubredditInfo.bind(this));
		});
		this.appendChild(refreshButton);

		const bannerUrl = this.loadedInfo.data["banner_background_image"] || this.loadedInfo.data["header_img"];
		if (bannerUrl) {
			const bannerImg = document.createElement("img");
			bannerImg.src = bannerUrl;
			bannerImg.className = "bannerImg";
			this.appendChild(bannerImg);
		}
		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["community_icon"] || this.loadedInfo.data["icon_img"];
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const subscriberBar = document.createElement("div");
		subscriberBar.className = "subscriberBar";
		const subActionsWrapper = document.createElement("div");
		subActionsWrapper.className = "subActionsWrapper";
		subscriberBar.appendChild(subActionsWrapper);
		const subscribeButton = document.createElement("button");
		subscribeButton.className = "subscribeButton";
		subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
		subscribeButton.addEventListener("click", async () => {
			this.loadedInfo.data["user_is_subscriber"] = !this.loadedInfo.data["user_is_subscriber"];
			subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
			if (await subscribe(this.loadedInfo.data["name"], this.loadedInfo.data["user_is_subscriber"])) {
				new Ph_Toast(Level.Success, "", 2000)
			}
			else {
				this.loadedInfo.data["user_is_subscriber"] = !this.loadedInfo.data["user_is_subscriber"];
				subscribeButton.innerText = this.loadedInfo.data["user_is_subscriber"] ? "Unsubscribe" : "Subscribe";
				new Ph_Toast(Level.Error, `Error subscribing to subreddit`, 2000);
			}

		});
		subActionsWrapper.appendChild(subscribeButton);
		subActionsWrapper.appendChild(new Ph_DropDown(
			[
				{ displayHTML: "Add to Multireddit" }
			],
			`<img src="/img/kebab.svg" draggable="false">`,
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		subscriberBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["subscribers"]}">
				Subscribers: ${numberToShort(this.loadedInfo.data["subscribers"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["active_user_count"]}">
				Online: ${numberToShort(this.loadedInfo.data["active_user_count"])} &nbsp — &nbsp; 
				${(this.loadedInfo.data["active_user_count"] / this.loadedInfo.data["subscribers"] * 100).toPrecision(1)} %
			</div>
		`);
		headerBar.appendChild(subscriberBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = escapeHTML(this.loadedInfo.data["title"]);
		this.appendChild(title);

		const description = document.createElement("div");
		description.innerHTML = this.loadedInfo.data["description_html"];
		const publicDescription = document.createElement("div");
		publicDescription.innerHTML = this.loadedInfo.data["public_description_html"];
		const rules = document.createElement("div");
		rules.append(...this.makeRules());
		const miscText = document.createElement("div");
		miscText.innerHTML = `
			<div>Created: ${new Date(this.loadedInfo.data["created_utc"] * 1000).toDateString()}</div>
			<div>Moderators:</div>
			${(this.loadedInfo.data.mods as SubredditModerator[])
			.map(mod => `<div><a href="/user/${mod.name}">${mod.name}</a></div>`)
			.join("\n")}	
		`;
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Description", content: description },
			{ titleHTML: "Public Description", content: publicDescription },
			{ titleHTML: "Rules", content: rules },
			{ titleHTML: "Other", content: miscText },
		]));


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
		wrapper.appendChild(content)
		for (let entry of entries) {
			const switchBtn = document.createElement("button");
			switchBtn.innerHTML = entry.titleHTML;
			switchBtn.addEventListener("click", () => {
				content.firstElementChild?.remove();
				content.appendChild(entry.content);
				Array.from(switcher.$class("selected")).forEach((el: HTMLElement) => el.classList.remove("selected"));
				switchBtn.classList.add("selected");
			});
			switcher.appendChild(switchBtn);
		}
		(switcher.children[0] as HTMLButtonElement).click();
		return wrapper;
	}

	private makeRules(): HTMLElement[] {
		return this.loadedInfo.data.rules.map((rule: SubredditRule) => {
			const ruleWrapper = document.createElement("div");
			ruleWrapper.className = "ruleWrapper";
			const title = document.createElement("button");
			title.innerText = rule.short_name;
			title.addEventListener("click", () => title.classList.toggle("expanded"));
			ruleWrapper.appendChild(title);
			const description = document.createElement("div");
			description.innerHTML = rule.description_html;
			ruleWrapper.appendChild(description);
			return ruleWrapper;
		});
	}

	saveInfo() {
		localStorage.setItem(this.feedUrl, JSON.stringify(this.loadedInfo));
	}

	removeInfo() {
		localStorage.removeItem(this.feedUrl);
	}

	isLoadedInfoValid(): boolean {
		return this.loadedInfo.lastUpdatedMsUTC > 0 &&
			Object.values(FeedType).includes(this.loadedInfo.feedType);
	}

	makeShowInfoButton(): HTMLElement {
		const button = document.createElement("button");
		button.className = "showInfo";
		button.innerHTML = `<img src="/img/info.svg" draggable="false">`;
		button.addEventListener("click", this.toggle.bind(this));
		return button;
	}

	toggle() {
		if (this.classList.contains("remove"))
			this.show();
		else
			this.hide();
	}

	show() {
		this.classList.remove("remove");
		setTimeout(() => window.addEventListener("click", this.focusLossHideRef), 0);
		window.addEventListener("viewChange", this.hideRef);
	}

	hide() {
		this.classList.add("remove");
		window.removeEventListener("click", this.focusLossHideRef);
		window.removeEventListener("viewChange", this.hideRef);
	}
}

customElements.define("ph-feed-info", Ph_FeedInfo);
