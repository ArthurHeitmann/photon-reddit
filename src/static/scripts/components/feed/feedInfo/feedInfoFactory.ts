import { escHTML } from "../../../utils/htmlStatics.js";
import Ph_BetterButton from "../../global/betterElements/betterButton.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_FeedInfo, { FeedType } from "./feedInfo.js";
import Ph_FeedInfoMulti from "./feedInfoMulti.js";
import Ph_FeedInfoSubreddit from "./feedInfoSubreddit.js";
import Ph_FeedInfoUser from "./feedInfoUser.js";

export default class FeedInfoFactory {
	/** All feed infos that are currently loaded */
	static loadedInfos: { [feedUrl: string]: { feedInfo: Ph_FeedInfo, references: number } } = {};

	/** Returns a button element that will open/close a feed info; preferred way for creating a feed info */
	static getInfoButton(feedType: FeedType, feedUrl: string): HTMLButtonElement {
		const button = new Ph_BetterButton();
		button.className = "showInfo transparentButtonAlt";
		button.innerHTML = `<img src="/img/info.svg" draggable="false" alt="info">`;
		button.setAttribute("data-feed-url", feedUrl);
		button.setAttribute("data-feed-type", FeedType[feedType]);

		const info = FeedInfoFactory.getOrMake(feedUrl, feedType);

		button.addEventListener("click", info.feedInfo.toggle.bind(info.feedInfo));

		button.addEventListener("ph-added", () => FeedInfoFactory.onButtonAddedOrRemoved(button, true));
		button.addEventListener("ph-removed", () => FeedInfoFactory.onButtonAddedOrRemoved(button, false));

		return button;
	}

	static getOrMake(feedUrl: string, feedType: FeedType): { feedInfo: Ph_FeedInfo, references: number } {
		let info = FeedInfoFactory.loadedInfos[feedUrl]
		if (!info)
			FeedInfoFactory.loadedInfos[feedUrl] = info = { feedInfo: FeedInfoFactory.make(feedUrl, feedType), references: 0 };
		if (!info.feedInfo.parentElement)
			info.feedInfo.addToDOM();
		return info;
	}

	static make(feedUrl: string, feedType: FeedType): Ph_FeedInfo {
		switch (feedType) {
		case FeedType.subreddit:
			return new Ph_FeedInfoSubreddit(feedUrl, feedType);
		case FeedType.multireddit:
			return new Ph_FeedInfoMulti(feedUrl, feedType);
		case FeedType.user:
			return new Ph_FeedInfoUser(feedUrl, feedType);
		case FeedType.messages:
		case FeedType.misc:
		default:
			new Ph_Toast(Level.warning, `Unknown feed type ${feedType} for ${escHTML(feedUrl)}`);
			return null;
		}
	}

	/** Gets called whenever the info button gets added or removed from the DOM */
	private static onButtonAddedOrRemoved(button: HTMLButtonElement, wasAdded: boolean) {
		const feedUrl: string = button.getAttribute("data-feed-url");
		const feedType: FeedType = FeedType[button.getAttribute("data-feed-type")];
		const feedInfo = FeedInfoFactory.getOrMake(feedUrl, feedType);
		if (wasAdded) {
			feedInfo.references++;
		}
		else {
			feedInfo.references--;
		}

		if (feedInfo.references === 0) {
			feedInfo.feedInfo.remove();
			delete FeedInfoFactory.loadedInfos[feedUrl];
		}
	}
}
