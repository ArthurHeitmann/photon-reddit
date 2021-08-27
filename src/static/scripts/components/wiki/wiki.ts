import { RedditWikiObj } from "../../types/redditTypes";
import { emojiFlagsToImages } from "../../utils/htmlStatics";
import { elementWithClassInTree, linksToSpa } from "../../utils/htmlStuff";
import { hasParams } from "../../utils/utils";
import { FeedType } from "../feed/feedInfo/feedInfo";
import FeedInfoFactory from "../feed/feedInfo/feedInfoFactory";
import { Ph_ViewState } from "../viewState/viewState";

/**
 * A simple wiki page
 */
export default class Ph_Wiki extends HTMLElement {
	constructor(wikiData: RedditWikiObj) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "wiki";

		this.innerHTML = wikiData.data.content_html;
		emojiFlagsToImages(this);
		linksToSpa(this, true);
	}

	connectedCallback() {
		// subreddit info button
		const subredditPath = history.state.url.match(/\/r\/[^/?#]+/i)?.[0];
		if (!subredditPath)
			return;
		const headerElements: HTMLElement[] = [];
		const title = document.createElement("div");
		title.className = "feedTitle";
		title.innerText = subredditPath;
		headerElements.push(title);
		headerElements.push(FeedInfoFactory.getInfoButton(FeedType.subreddit, subredditPath));
		(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
	}
}

customElements.define("ph-wiki", Ph_Wiki);
