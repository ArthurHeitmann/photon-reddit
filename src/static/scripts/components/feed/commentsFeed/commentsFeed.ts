import { redditApiRequest } from "../../../api/api.js";
import { viewsStack } from "../../../state/stateManager.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType, SortCommentsOrder } from "../../../utils/types.js";
import Ph_Comment from "../../comment/comment.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Post from "../../post/post.js";

export default class Ph_CommentsFeed extends HTMLElement {
	postFullName: string;
	sorter: Ph_DropDown;
	post: Post;
	sort: SortCommentsOrder;

	constructor(comments: RedditApiType, post: Post) {
		super();

		this.classList.add("commentsFeed");
		this.post = post;

		this.sort = SortCommentsOrder[new URLSearchParams(location.search).get("sort") || "confidence"];

		this.sorter = new Ph_DropDown([
			{ displayHTML: "Best", value: SortCommentsOrder.best, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "Top", value: SortCommentsOrder.top, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "New", value: SortCommentsOrder.new, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "Controversial", value: SortCommentsOrder.controversial, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "Old", value: SortCommentsOrder.old, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "Q & A", value: SortCommentsOrder.qa, onSelectCallback: this.handleSort.bind(this) },
			{ displayHTML: "Random", value: SortCommentsOrder.random, onSelectCallback: this.handleSort.bind(this) },
		], "Sort by", DirectionX.right, DirectionY.bottom, false);
		this.sorter.classList.add("commentsSorter");
		this.appendChild(this.sorter);

		for (const commentData of comments.data.children) {
			try {
				this.appendChild(new Ph_Comment(commentData, false, false, post));
			}
			catch (e) {
				console.error("Error making root comment");
				console.error(e);
				new Ph_Toast(Level.Error, "Error making comment");
			}
		}
	}

	insertParentLink(link: string, displayText: string) {
		const linkA = document.createElement("a");
		linkA.href = link;
		linkA.innerHTML = displayText;
		linkA.className = "parentCommentsLink";
		linksToSpa(linkA);
		this.insertAdjacentElement("afterbegin", linkA);
	}

	async handleSort(valueChain: any[]) {
		const path = location.pathname;
		const query = location.search;
		const params = new URLSearchParams(query);
		params.set("sort", valueChain[0]);

		try {
			const newUrl = `${path}?${params.toString()}`;
			const newComments: RedditApiType[] = await redditApiRequest(newUrl, [], false);
			if (newComments["error"])
				throw `Sorting error (${JSON.stringify(newComments, null, 4)})`;

			let last = this.lastElementChild;
			while (last !== this.sorter) {
				last.remove();
				last = this.lastElementChild;
			}

			for (let comment of newComments[1].data.children) {
				this.appendChild(new Ph_Comment(comment, false, false, this.post));
			}

			viewsStack.changeCurrentUrl(newUrl);
		}
		catch (e) {
			console.error("Error sorting comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error sorting comments");
		}

	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);
