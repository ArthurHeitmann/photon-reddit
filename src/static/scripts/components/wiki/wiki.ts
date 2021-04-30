import { RedditApiType } from "../../types/misc.js";
import { elementWithClassInTree, linksToSpa } from "../../utils/htmlStuff.js";
import Ph_FeedInfo, { FeedType } from "../feed/feedInfo/feedInfo.js";
import { Ph_ViewState } from "../viewState/viewState.js";

/**
 * A simple wiki page
 */
export default class Ph_Wiki extends HTMLElement {
	constructor(wikiData: RedditApiType) {
		super();

		this.className = "wiki";

		this.innerHTML = wikiData.data["content_html"];
		linksToSpa(this, true);
	}

	connectedCallback() {
		// subreddit info button
		const subredditPath = history.state.url.match(/\/r\/[^/]+/i)?.[0];
		if (!subredditPath)
			return;
		const headerElements: HTMLElement[] = [];
		const title = document.createElement("div");
		title.className = "feedTitle";
		title.innerText = subredditPath;
		headerElements.push(title);
		headerElements.push(Ph_FeedInfo.getInfoButton(FeedType.subreddit, subredditPath));
		(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
	}
}

customElements.define("ph-wiki", Ph_Wiki);
