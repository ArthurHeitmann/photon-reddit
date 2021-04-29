import { redditApiRequest } from "../../api/redditApi.js";
import ViewsStack from "../../historyState/viewsStack.js";
import { RedditApiType, SortCommentsOrder } from "../../types/misc.js";
import { getLoadingIcon } from "../../utils/htmlStatics.js";
import { elementWithClassInTree } from "../../utils/htmlStuff.js";
import { extractPath, extractQuery } from "../../utils/utils.js";
import Ph_Comment from "../comment/comment.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_FeedInfo, { FeedType } from "../feed/feedInfo/feedInfo.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
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
	tmpLoadingIcon: HTMLElement;
	areHeaderElementsSet = false;

	constructor(data?: RedditApiType[], postHint?: { post: Ph_Post, subredditPrefixed: string, userPrefixed: string }) {
		super();

		this.classList.add("postAndComments");

		if (postHint) {
			this.subredditPrefixed = postHint.subredditPrefixed;
			this.userPrefixed = postHint.userPrefixed;
		}
		else {
			this.subredditPrefixed = data[0].data.children[0].data["subreddit_name_prefixed"];
			this.userPrefixed = `u/${data[0].data.children[0].data["author"]}`;
		}

		// post
		if (postHint)
			this.post = postHint.post;
		else {
			try {
				this.post = new Ph_Post(data[0].data.children[0], false);
			} catch (e) {
				console.error("Error making post in comments");
				console.error(e);
				new Ph_Toast(Level.error, "Error making post");
			}
		}
		this.appendChild(this.post);

		// comments & more
		if (data)
			this.initWithData(data);
		else
			this.appendChild(this.tmpLoadingIcon = getLoadingIcon())
	}

	initWithData(data: RedditApiType[]) {
		this.tmpLoadingIcon?.remove();
		Ph_ViewState.getViewOf(this)?.saveScroll();

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
			this.comments.$css(`[data-id=t1_${commentLinkMatches[1]}]`)[0].classList.add("highlight");
			this.comments.insertParentLink(this.post.permalink, "Load all comments");
		}

		// sorting
		const curSort = extractQuery(history.state.url).match(/(?<=sort=)\w+/);		// ?sort=top&limit=1 --> top
		this.sorter = new Ph_DropDown([
			{ label: "Best", value: SortCommentsOrder.best, onSelectCallback: this.handleSort.bind(this) },
			{ label: "Top", value: SortCommentsOrder.top, onSelectCallback: this.handleSort.bind(this) },
			{ label: "New", value: SortCommentsOrder.new, onSelectCallback: this.handleSort.bind(this) },
			{ label: "Controversial", value: SortCommentsOrder.controversial, onSelectCallback: this.handleSort.bind(this) },
			{ label: "Old", value: SortCommentsOrder.old, onSelectCallback: this.handleSort.bind(this) },
			{ label: "Q & A", value: SortCommentsOrder.qa, onSelectCallback: this.handleSort.bind(this) },
			{ label: "Random", value: SortCommentsOrder.random, onSelectCallback: this.handleSort.bind(this) },
		], curSort ? `Sort - ${curSort[0]}` : "Sorting", DirectionX.right, DirectionY.bottom, false);
		this.sorter.classList.add("commentsSorter");

		Ph_ViewState.getViewOf(this)?.loadScroll();

		if (!this.areHeaderElementsSet && this.isConnected)
			this.setHeaderElements();
	}

	connectedCallback() {
		if (this.comments)
			this.setHeaderElements();
	}

	setHeaderElements() {
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
		this.areHeaderElementsSet = true;
	}

	async handleSort([sorting]: SortCommentsOrder[], setLabel: (newLabel: ButtonLabel) => void, initialLabel: HTMLElement) {
		const path = extractPath(history.state.url);
		const params = new URLSearchParams(extractQuery(history.state.url));
		params.set("sort", sorting);

		setLabel(getLoadingIcon());

		try {
			const newUrl = `${path}?${params.toString()}`;
			const newComments: RedditApiType[] = await redditApiRequest(newUrl, [], false);
			if (newComments["error"])
				throw `Sorting error (${JSON.stringify(newComments, null, 4)})`;

			this.comments.innerText = "";

			for (const comment of newComments[1].data.children) {
				this.comments.appendChild(new Ph_Comment(comment, false, false, this.post));
			}

			ViewsStack.changeCurrentUrl(newUrl);
			setLabel(`Sort - ${sorting}`);
		}
		catch (e) {
			console.error("Error sorting comments");
			console.error(e);
			new Ph_Toast(Level.error, "Error sorting comments");
			setLabel(initialLabel);
		}

	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
