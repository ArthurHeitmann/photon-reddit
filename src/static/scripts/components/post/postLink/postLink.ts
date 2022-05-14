import {makeElement} from "../../../utils/utils";
import {linksToSpa} from "../../../utils/htmlStuff";

export default class Ph_PostLink extends HTMLElement {
	constructor(url: string, thumbnailUrl: string) {
		super();

		this.classList.add("linkPreviewWrapper");

		this.append(makeElement(
			"a", { href: url, rel: "noopener" }, url));
		if (thumbnailUrl && /^https?:\/\//.test(thumbnailUrl))
			this.append(makeElement(
				"img", { src: thumbnailUrl, alt: "preview" }));
		linksToSpa(this);
	}
}

customElements.define('ph-post-link', Ph_PostLink);
