import { RedditApiType } from "../../types/misc.js";
import { emojiFlagsToImages } from "../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../utils/htmlStuff.js";
import { hasParams } from "../../utils/utils.js";
import { FeedType } from "../feed/feedInfo/feedInfo.js";
import FeedInfoFactory from "../feed/feedInfo/feedInfoFactory.js";
import { Ph_ViewState } from "../viewState/viewState.js";

/**
 * A simple wiki page
 */
export default class Ph_Wiki extends HTMLElement {
	constructor(wikiData: RedditApiType) {
		super();
		if (!hasParams(arguments)) return;

		this.className = "wiki";

		this.innerHTML = wikiData.data["content_html"];
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
