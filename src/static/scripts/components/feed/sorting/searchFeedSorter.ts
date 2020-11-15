import Ph_DropDown from "../../misc/dropDown/dropDown.js";
import Ph_UniversalFeed from "../universalFeed/universalFeed.js";

export default class Ph_SearchFeedSorter extends HTMLElement {
	constructor(feed: Ph_UniversalFeed) {
		super();
	}
}

customElements.define("ph-search-feed-sorter", Ph_SearchFeedSorter);
