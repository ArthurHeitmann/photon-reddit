import { redditApiRequest, subscribe } from "../../../api/api.js";
import { classInElementTree, escapeHTML } from "../../../utils/htmlStuff.js";
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

export default class Ph_FeedInfo extends HTMLElement {
	hideRef: (e: MouseEvent) => void;
	loadedInfo: StoredFeedInfo;
	feedUrl: string;
	static refreshEveryNMs = 60 * 60 * 1000;

	constructor(feedType: FeedType, feedUrl: string) {
		super();

		this.feedUrl = feedUrl;
		this.hideRef = e => classInElementTree(e.target as HTMLElement, "feedInfo") || this.hide();
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
		try {
			feedAbout = await redditApiRequest(`${this.feedUrl}/about`, [], false);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.Error, "Error getting subreddit info");
			console.error(`Error getting subreddit info for ${this.feedUrl}`);
			console.error(e);
		}
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displaySubredditInfo() {
		this.innerText = "";
		if (this.loadedInfo.data["banner_background_image"]) {
			const bannerImg = document.createElement("img");
			bannerImg.src = this.loadedInfo.data["banner_background_image"];
			bannerImg.className = "bannerImg";
			this.appendChild(bannerImg);
		}
		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		if (this.loadedInfo.data["community_icon"]) {
			const profileImg = document.createElement("img");
			profileImg.src = this.loadedInfo.data["community_icon"];
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
		description.className = "description";
		description.innerHTML = this.loadedInfo.data["public_description_html"];
		this.appendChild(description);
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
		setTimeout(() => window.addEventListener("click", this.hideRef), 0);
	}

	hide() {
		this.classList.add("remove");
		window.removeEventListener("click", this.hideRef);
	}
}

customElements.define("ph-feed-info", Ph_FeedInfo);
