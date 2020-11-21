import { linksToInlineImages, linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import { replaceRedditLinks } from "../../utils/utils.js";

export default class Ph_Wiki extends HTMLElement {
	constructor(wikiData: RedditApiType) {
		super();

		this.className = "wiki";

		this.innerHTML = wikiData.data["content_html"];
		replaceRedditLinks(this);
		linksToSpa(this);
		linksToInlineImages(this);
	}
}

customElements.define("ph-wiki", Ph_Wiki);
