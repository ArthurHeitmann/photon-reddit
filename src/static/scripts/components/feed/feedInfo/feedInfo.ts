import {PhEvents} from "../../../types/Events";
import {StoredData} from "../../../types/misc";
import {$class, $cssAr} from "../../../utils/htmlStatics";
import {tagInElementTree} from "../../../utils/htmlStuff";
import {hasParams, makeElement} from "../../../utils/utils";
import Ph_Header from "../../global/header/header";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";

export enum FeedType {
	subreddit = "subreddit",
	multireddit = "multireddit",
	user = "user",
	messages = "messages",
	misc = "misc",
}
export interface StoredFeedInfo<T> extends StoredData<T> {
	feedType: FeedType;
}

/**
 * Big area to display info about a feed (subreddit, user, multireddit)
 *
 * Should be created, opened, ... with FeedInfoFactory.getInfoButton()
 */
export default abstract class Ph_FeedInfo<StoredData> extends HTMLElement {
	/** has data been loaded (from reddit) & is it being displayed */
	hasLoaded: boolean = false;
	loadedInfo: StoredFeedInfo<StoredData>;
	/** path for the feed, example: "/r/askreddit" */
	feedUrl: string;
	multiSubManager: HTMLDivElement;
	focusLossHideRef: (e: MouseEvent) => void;
	hideRef: () => void;
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

		this.loadedInfo = Users.current.d.caches.feedInfos[feedUrl.toLowerCase()];
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
			new Ph_Toast(Level.error, `Corrupted feed info for ${this.feedUrl}`);
			console.error(`Corrupted feed info for ${this.feedUrl} (${JSON.stringify(this.loadedInfo)})`);
			throw "Corrupted feed info";
		}
		if (!isValid || this.loadedInfo.lastUpdatedMsUTC + Users.global.d.photonSettings.clearFeedCacheAfterMs < Date.now()) {
			this.classList.add("loading");
			// get it
			await this.loadInfo();
			this.classList.remove("loading");
		}

		// display it
		this.displayInfo();
	}

	abstract loadInfo(): Promise<void>;

	abstract displayInfo(): void;

	protected makeSwitchableBar(entries: { title: string, content: HTMLElement }[]): HTMLElement {
		const wrapper = makeElement("div", { class: "switchableBar" });
		const switcher = makeElement("div", { class: "switcher" });
		wrapper.appendChild(switcher);
		const content = makeElement("div", { class: "content" });
		wrapper.appendChild(content);
		for (const entry of entries) {
			const switchBtn = makeElement("button", null, entry.title);
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
		const refreshButton = makeElement("button", { class: "refreshButton transparentButtonAlt" },
			[makeElement("img", { src: "/img/refresh.svg", draggable: "false", alt: "refresh" })]);
		refreshButton.addEventListener("click", () => this.loadInfo().then(this.displayInfo.bind(this)));
		return refreshButton;
	}

	protected makeBannerImage(bannerUrl: string, appendTo: HTMLElement, bgColor: string): void {
		let bannerImg;
		if (bannerUrl) {
			bannerImg = makeElement("img", { src: bannerUrl, alt: "banner" });
		}
		else if (bgColor) {
			bannerImg = makeElement("div");
			bannerImg.style.setProperty("--banner-bg", bgColor);
		}

		if (bannerImg) {
			bannerImg.className = "bannerImg";
			appendTo.append(bannerImg);
		}
	}

	async forceLoad() {
		if (!this.hasLoaded)
			await this.getOrUpdateInfo();
	}

	/** caches feed info to storage */
	saveInfo() {
		Users.current.set(["caches", "feedInfos", this.feedUrl.toLowerCase()], this.loadedInfo);
	}

	/** removes a cached feed info from storage */
	removeInfo() {
		Users.current.remove("caches", "feedInfos", this.feedUrl.toLowerCase())
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
			.forEach((e: Ph_FeedInfo<StoredData>) => e !== this && e.hide())
		this.classList.remove("remove");
		($class("header")[0] as Ph_Header).hide();
		setTimeout(() => window.addEventListener("click", this.focusLossHideRef), 0);
		window.addEventListener(PhEvents.viewChange, this.hideRef);
		this.forceLoad();
	}

	hide() {
		this.classList.add("remove");
		window.removeEventListener("click", this.focusLossHideRef);
		window.removeEventListener(PhEvents.viewChange, this.hideRef);
	}

	getKebabImg(): HTMLImageElement {
		const img = document.createElement("img");
		img.src = "/img/kebab.svg";
		img.draggable = false;
		img.alt = "menu";
		return img;
	}
}
