import { hasParams } from "../../../utils/utils.js";
import Ph_FeedInfo, { FeedType } from "./feedInfo.js";

export default class Ph_FeedInfoPage extends HTMLElement {
	constructor(path: string) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "feedInfoPage";

		const feedPath = path.match(/^\/[^/]+\/[^/?#]+/)?.[0];		// /r/sub/about --> /r/sub
		if (!feedPath)
			throw "Invalid path";
		let feedType: FeedType;
		if (path[1] === "r")
			feedType = FeedType.subreddit;
		else if (path[1] === "u")
			feedType = FeedType.user;
		else
			throw "Invalid feed type";
		const isRules = /\/about\/rules/.test(path);
		const feedInfo = new Ph_FeedInfo(feedType, feedPath);
		feedInfo.getOrUpdateInfo().then(() => {
			if (!isRules)
				return;
			const sections = Array.from(feedInfo.$class("switcher")[0].children) as HTMLElement[];
			sections
				.find(section => section.innerText.match(new RegExp("rules", "i")))
				.click();
		});
		feedInfo.classList.remove("remove");
		this.appendChild(feedInfo);
	}
}

customElements.define("ph-feed-info-page", Ph_FeedInfoPage);
