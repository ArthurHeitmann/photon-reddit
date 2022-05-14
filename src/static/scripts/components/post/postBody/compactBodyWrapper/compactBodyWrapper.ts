import {RedditPostData} from "../../../../types/redditTypes";
import {PhEvents} from "../../../../types/Events";
import {getThumbnailUrl, makeElement} from "../../../../utils/utils";
import {linksToSpa} from "../../../../utils/htmlStuff";

export default class Ph_PostBodyCompactWrapper extends HTMLElement{
	isExpanded = false;

	constructor() {
		super();

		this.classList.add("postBodyCompactWrapper");
	}

	init(postData: RedditPostData) {
		this.append(
			makeElement("button",
				{ class: "toggle transparentButton", onclick: this.toggleExpand.bind(this) }, [
					makeElement("img", { src: "/img/rightArrow.svg" })
				]),
			makeElement("a",
				{ class: "link", href: postData.url }, postData.url),
		);
		const thumbnail = getThumbnailUrl(postData);
		if (thumbnail && /^https:\/\/[^.]+\.[^.]/.test(thumbnail))
			this.append(
				makeElement("img", { class: "thumbnail", src: thumbnail }));
		linksToSpa(this);
	}

	toggleExpand() {
		this.isExpanded = !this.isExpanded;
		this.classList.toggle("expanded", this.isExpanded);
		this.dispatchEvent(new CustomEvent(PhEvents.compactPostToggle))
	}
}

customElements.define('ph-post-body-compact-wrapper', Ph_PostBodyCompactWrapper);
