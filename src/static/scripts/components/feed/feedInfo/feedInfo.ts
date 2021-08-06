import { StoredData } from "../../../utils/globals";
import { $class, $cssAr, escHTML } from "../../../utils/htmlStatics";
import { tagInElementTree } from "../../../utils/htmlStuff";
import { hasParams } from "../../../utils/utils";
import Ph_Header from "../../global/header/header";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import { clearAllOldData } from "./feedInfoCleanup";

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

/**
 * Big area to display info about a feed (subreddit, user, multireddit)
 *
 * Should be created, opened, ... with FeedInfoFactory.getInfoButton()
 */
export default abstract class Ph_FeedInfo extends HTMLElement {
	/** has data been loaded (from reddit) & is it being displayed */
	hasLoaded: boolean = false;
	loadedInfo: StoredFeedInfo;
	/** path for the feed, example: "/r/askreddit" */
	feedUrl: string;
	multiSubManager: HTMLDivElement;
	focusLossHideRef: (e: MouseEvent) => void;
	hideRef: () => void;
	/** after this time cached data in the localstorage should be invalidated */
	static refreshEveryNMs = 2 * 60 * 60 * 1000;		// 2 hours
	static supportedFeedTypes: FeedType[] = [FeedType.subreddit, FeedType.user, FeedType.multireddit];

	/** Should not be called directly only from Ph_FeedInfo.make() */
	constructor(feedUrl: string, feedType: FeedType) {
		super();
		if (!hasParams(arguments)) return;

		this.feedUrl = feedUrl;
		this.focusLossHideRef = e => {
			if (!tagInElementTree(e.target as Element, "main"))
				return;

			this.hide();
		};
		this.hideRef = this.hide.bind(this);
		this.className = "feedInfo remove";

		const storedInfo = localStorage[feedUrl.toLowerCase()];
		if (storedInfo) {
			try {
				this.loadedInfo = JSON.parse(storedInfo);
			}
			catch {}
		}
		if (!this.loadedInfo) {
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
			new Ph_Toast(Level.error, `Corrupted feed info for ${escHTML(this.feedUrl)}`);
			console.error(`Corrupted feed info for ${this.feedUrl} (${JSON.stringify(this.loadedInfo)})`);
			throw "Corrupted feed info";
		}
		if (!isValid || this.loadedInfo.lastUpdatedMsUTC + Ph_FeedInfo.refreshEveryNMs < Date.now()) {
			this.classList.add("loading");
			// get it
			await this.loadInfo();
			this.classList.remove("loading");
		}

		// display it
		this.displayInfo();
	}

	abstract async loadInfo(): Promise<void>;

	abstract displayInfo(): void;

	protected makeSwitchableBar(entries: { titleHTML: string, content: HTMLElement }[]): HTMLElement {
		const wrapper = document.createElement("div");
		wrapper.className = "switchableBar";
		const switcher = document.createElement("div");
		switcher.className = "switcher";
		wrapper.appendChild(switcher);
		const content = document.createElement("div");
		content.className = "content";
		wrapper.appendChild(content);
		for (const entry of entries) {
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

	protected makeRefreshButton(): HTMLElement {
		const refreshButton = document.createElement("button");
		refreshButton.className = "refreshButton transparentButtonAlt";
		refreshButton.innerHTML = `<img src="/img/refresh.svg" draggable="false" alt="refresh">`;
		refreshButton.addEventListener("click", () => this.loadInfo().then(this.displayInfo.bind(this)));
		return refreshButton;
	}

	protected makeBannerImage(bannerUrl: string, appendTo: HTMLElement, bgColor: string): void {
		let bannerImg;
		if (bannerUrl) {
			bannerImg = document.createElement("img");
			bannerImg.src = bannerUrl;
			bannerImg.alt = "banner"
		}
		else if (bgColor) {
			bannerImg = document.createElement("div");
			bannerImg.style.setProperty("--banner-bg", bgColor);
		}

		if (bannerImg) {
			bannerImg.className = "bannerImg";
			appendTo.appendChild(bannerImg);
		}
	}

	async forceLoad() {
		if (!this.hasLoaded)
			await this.getOrUpdateInfo();
	}

	/** caches feed info to localstorage */
	saveInfo() {
		localStorage.setItem(this.feedUrl.toLowerCase(), JSON.stringify(this.loadedInfo));
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

		$cssAr(".feedInfo:not(.remove)")
			.forEach((e: Ph_FeedInfo) => e !== this && e.hide())
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

	getKebabImg(): HTMLImageElement {
		const img = document.createElement("img");
		img.src = "/img/kebab.svg";
		img.draggable = false;
		img.alt = "menu";
		return img;
	}
}

// wait 10 seconds to avoid additional lag
setTimeout(() => {
		clearAllOldData();
		setInterval(() => clearAllOldData(), 1000 * 60 * 60);		// clear cache every 60 minutes
	}
, 10 * 1000);
