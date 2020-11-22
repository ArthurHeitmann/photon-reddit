import { elementWithClassInTree, linksToInlineImages, linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import { replaceRedditLinks } from "../../utils/utils.js";
import Ph_FeedInfo from "../feed/feedInfo/feedInfo.js";
import { FeedType } from "../feed/universalFeed/universalFeed.js";
import { Ph_ViewState } from "../viewState/viewState.js";

export default class Ph_Wiki extends HTMLElement {
	constructor(wikiData: RedditApiType) {
		super();

		this.className = "wiki";

		this.innerHTML = wikiData.data["content_html"];
		replaceRedditLinks(this);
		linksToSpa(this);
		linksToInlineImages(this);
	}

	connectedCallback() {
		const subredditPath = location.pathname.match(/\/r\/[^/]+/)[0];
		const headerElements: HTMLElement[] = [];
		const title = document.createElement("div");
		title.className = "feedTitle";
		title.innerText = subredditPath;
		headerElements.push(title);
		headerElements.push(new Ph_FeedInfo(FeedType.subreddit, subredditPath).makeShowInfoButton());
		(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
	}
}

customElements.define("ph-wiki", Ph_Wiki);
