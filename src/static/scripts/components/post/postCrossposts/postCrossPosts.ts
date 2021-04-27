import { RedditApiType } from "../../../types/misc.js";
import Ph_Post from "../post.js";

export default class Ph_PostCrossposts extends HTMLElement {
	constructor(data: RedditApiType[]) {
		super();

		this.classList.add("postAndComments");

		const originalPost = new Ph_Post(data[0].data.children[0], false);
		this.appendChild(originalPost);

		const crossposts = data[1].data.children;
		for (const crosspost of crossposts) {
			const p = new Ph_Post(crosspost, false);
			p.classList.add("inCrosspostList");
			this.appendChild(p);
		}
	}
}

customElements.define("ph-post-crossposts", Ph_PostCrossposts);
