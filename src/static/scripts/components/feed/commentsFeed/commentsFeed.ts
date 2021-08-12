import { RedditApiType, SortCommentsOrder } from "../../../types/misc";
import { linksToSpa } from "../../../utils/htmlStuff";
import { extractQuery, hasParams, makeElement } from "../../../utils/utils";
import Ph_Comment from "../../comment/comment";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Ph_Post from "../../post/post";

/**
 * A list of Ph_Comment; has sorter; can have special link
 */
export default class Ph_CommentsFeed extends HTMLElement {
	sort: SortCommentsOrder;

	constructor(comments: RedditApiType, post: Ph_Post, suggestedSort: SortCommentsOrder | null) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("commentsFeed");

		const urlSort = new URLSearchParams(extractQuery(history.state.url)).get("sort");
		this.sort = urlSort ? SortCommentsOrder[urlSort] : suggestedSort;

		for (const commentData of comments.data.children) {
			try {
				this.appendChild(new Ph_Comment(commentData, false, false, post));
			}
			catch (e) {
				console.error("Error making root comment");
				console.error(e);
				new Ph_Toast(Level.error, "Error making comment");
			}
		}
	}

	insertParentLink(link: string, displayText: string) {
		const linkA = makeElement(
			"a",
			{ href: link, class: "parentCommentsLink" },
			displayText
		);
		linksToSpa(linkA);
		this.insertAdjacentElement("afterbegin", linkA);
	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);
