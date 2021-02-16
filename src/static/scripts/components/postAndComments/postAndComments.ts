import { redditApiRequest } from "../../api/redditApi.js";
import ViewsStack from "../../historyState/viewsStack.js";
import { elementWithClassInTree } from "../../utils/htmlStuff.js";
import { RedditApiType, SortCommentsOrder } from "../../types/misc.js";
import { extractPath, extractQuery } from "../../utils/utils.js";
import Ph_Comment from "../comment/comment.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_FeedInfo, { FeedType } from "../feed/feedInfo/feedInfo.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_Post from "../post/post.js";
import { Ph_ViewState } from "../viewState/viewState.js";

/**
 * A Ph_Post & Ph_CommentsFeed; Also sets user, & sub info + sorter in the header
 */
export default class Ph_PostAndComments extends HTMLElement {
	post: Ph_Post;
	comments: Ph_CommentsFeed
	sorter: Ph_DropDown;
	subredditPrefixed: string;
	userPrefixed: string;

	constructor(data: RedditApiType[]) {
		super();

		this.classList.add("postAndComments");
		this.subredditPrefixed = data[0].data.children[0].data["subreddit_name_prefixed"];
		this.userPrefixed = `u/${data[0].data.children[0].data["author"]}`;

		// post
		try {
			this.appendChild(this.post = new Ph_Post(data[0].data.children[0], false));
		}
		catch (e) {
			console.error("Error making post in comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error making post");
		}

		// write comment form
		if (!this.post.isLocked) {
			const commentForm = new Ph_CommentForm(this.post, false);
			this.appendChild(commentForm);
			commentForm.addEventListener("ph-comment-submitted",
				(e: CustomEvent) => this.comments.insertAdjacentElement("afterbegin",
					new Ph_Comment(e.detail, false, false, this.post)));
		}

		// comments
		this.comments = new Ph_CommentsFeed(data[1], this.post);
		this.appendChild(this.comments);

		// highlighted comment
		const commentLinkMatches = history.state.url.match(new RegExp(`${this.post.permalink}(\\w*)`));
		if (commentLinkMatches && commentLinkMatches.length > 1 && commentLinkMatches[1]) {
			this.comments.$css(`[data-id=${commentLinkMatches[1]}]`)[0].classList.add("highlight");
			this.comments.insertParentLink(this.post.permalink, "Load all comments");
		}

		// sorting
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
	}

	connectedCallback() {
		const headerElements: HTMLElement[] = [];

		// user info button
		if (this.userPrefixed !== this.subredditPrefixed && this.userPrefixed !== "u/[deleted]") {
			const userTitle = document.createElement("div");
			userTitle.className = "feedTitle";
			userTitle.innerText = this.userPrefixed;
			headerElements.push(userTitle);
			headerElements.push(Ph_FeedInfo.getInfoButton(
				FeedType.user,
				`/${this.userPrefixed}`
			));
		}
		// subreddit info button
		const subTitle = document.createElement("div");
		subTitle.className = "feedTitle";
		subTitle.innerText = this.subredditPrefixed;
		headerElements.push(subTitle);
		headerElements.push(Ph_FeedInfo.getInfoButton(
			this.subredditPrefixed[0] === "r" ? FeedType.subreddit : FeedType.user,
			`/${this.subredditPrefixed}`
		));

		// sorter
		headerElements.push(this.sorter);

		(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
	}

	async handleSort(valueChain: any[]) {
		const path = extractPath(history.state.url);
		const params = new URLSearchParams(extractQuery(history.state.url));
		params.set("sort", valueChain[0]);

		const loadingIcon = document.createElement("img");
		loadingIcon.alt = "loading";
		loadingIcon.src = "/img/loading.svg";
		this.sorter.toggleButton.appendChild(loadingIcon);

		try {
			const newUrl = `${path}?${params.toString()}`;
			const newComments: RedditApiType[] = await redditApiRequest(newUrl, [], false);
			if (newComments["error"])
				throw `Sorting error (${JSON.stringify(newComments, null, 4)})`;

			this.comments.innerText = "";

			for (let comment of newComments[1].data.children) {
				this.comments.appendChild(new Ph_Comment(comment, false, false, this.post));
			}

			ViewsStack.changeCurrentUrl(newUrl);
		}
		catch (e) {
			console.error("Error sorting comments");
			console.error(e);
			new Ph_Toast(Level.Error, "Error sorting comments");
		}

		loadingIcon.remove();
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
