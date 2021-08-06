import { redditApiRequest } from "../../api/redditApi";
import ViewsStack from "../../historyState/viewsStack";
import { RedditApiType, SortCommentsOrder, SortCommentsOrderNamed } from "../../types/misc";
import { getLoadingIcon } from "../../utils/htmlStatics";
import { elementWithClassInTree } from "../../utils/htmlStuff";
import { extractPath, extractQuery, hasHTML, hasParams } from "../../utils/utils";
import Ph_Comment from "../comment/comment";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed";
import { FeedType } from "../feed/feedInfo/feedInfo";
import FeedInfoFactory from "../feed/feedInfo/feedInfoFactory";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown";
import { DropDownActionData } from "../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm";
import Ph_Toast, { Level } from "../misc/toast/toast";
import Ph_Post from "../post/post";
import { Ph_ViewState } from "../viewState/viewState";

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
	firstTimeConnected = false;

	constructor(data: RedditApiType[], postHint?: { post: Ph_Post, subredditPrefixed: string, userPrefixed: string }) {
		super();
		if (!hasParams(arguments)) return;

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
		this.append(this.post);

		// comments & more
		if (data)
			this.initWithData(data);
		else
			this.append(this.tmpLoadingIcon = getLoadingIcon())
	}

	initWithData(data: RedditApiType[]) {
		if (!hasParams(arguments)) return;

		// write comment form
		if (!this.post.isLocked) {
			const commentForm = new Ph_CommentForm(this.post, false);
			this.append(commentForm);
			commentForm.addEventListener("ph-comment-submitted",
				(e: CustomEvent) => this.comments.insertAdjacentElement("afterbegin",
					new Ph_Comment(e.detail, false, false, this.post)));
		}

		// comments
		this.comments = new Ph_CommentsFeed(data[1], this.post, data[0].data.children[0].data["suggested_sort"]);
		this.append(this.comments);

		// highlighted comment
		// /r/sub/comments/<postId>/<postTitle>/<commentId> --> <commentId>
		const commentLinkMatches = history.state.url.match(/\/comments\/[^/]+\/[^/]+\/([^/?#]+)/);
		if (commentLinkMatches) {
			const highlightedComment = this.comments.$css(`[data-id=t1_${commentLinkMatches[1]}]`)[0];
			if (highlightedComment) {
				highlightedComment.classList.add("highlight");
				this.comments.insertParentLink(this.post.permalink, "Load all comments");
				setTimeout(() => highlightedComment.scrollIntoView({ behavior: "smooth" }), 500);
			}
		}

		// sorting
		const curSort = this.comments.sort;
		this.sorter = new Ph_DropDown([
			{ label: SortCommentsOrderNamed.best,	 		value: SortCommentsOrder.best, 			labelImgUrl: "/img/rocket.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.top,	 		value: SortCommentsOrder.top, 			labelImgUrl: "/img/top.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.new,	 		value: SortCommentsOrder.new, 			labelImgUrl: "/img/new.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.controversial,	value: SortCommentsOrder.controversial,	labelImgUrl: "/img/lightning.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.old,	 		value: SortCommentsOrder.old, 			labelImgUrl: "/img/history.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.qa,	 			value: SortCommentsOrder.qa, 			labelImgUrl: "/img/qa.svg", onSelectCallback: this.handleSort.bind(this) },
			{ label: SortCommentsOrderNamed.random,	 		value: SortCommentsOrder.random, 		labelImgUrl: "/img/shuffle.svg", onSelectCallback: this.handleSort.bind(this) },
		], curSort ? `Sort - ${SortCommentsOrderNamed[curSort]}` : "Sort - Default", DirectionX.right, DirectionY.bottom, false);
		this.sorter.classList.add("commentsSorter");

		this.tmpLoadingIcon?.remove();

		if (!this.areHeaderElementsSet && this.isConnected)
			this.setHeaderElements();
	}

	connectedCallback() {
		if (!hasHTML(this)) return;
		if (this.firstTimeConnected)
			return;
		setTimeout(() => document.scrollingElement.scrollTo({ top: 0 }), 0);
		if (this.comments)
			this.setHeaderElements();
		this.firstTimeConnected = true;
	}

	setHeaderElements() {
		const headerElements: HTMLElement[] = [];

		// user info button
		if (this.userPrefixed !== this.subredditPrefixed && this.userPrefixed !== "u/[deleted]") {
			const userTitle = document.createElement("div");
			userTitle.className = "feedTitle";
			userTitle.innerText = this.userPrefixed;
			headerElements.push(userTitle);
			headerElements.push(FeedInfoFactory.getInfoButton(
				FeedType.user,
				`/${this.userPrefixed}`
			));
		}
		// subreddit info button
		const subTitle = document.createElement("div");
		subTitle.className = "feedTitle";
		subTitle.innerText = this.subredditPrefixed;
		headerElements.push(subTitle);
		headerElements.push(FeedInfoFactory.getInfoButton(
			this.subredditPrefixed[0] === "r" ? FeedType.subreddit : FeedType.user,
			`/${this.subredditPrefixed}`
		));

		// sorter
		headerElements.push(this.sorter);

		(elementWithClassInTree(this.parentElement, "viewState") as Ph_ViewState).setHeaderElements(headerElements);
		this.areHeaderElementsSet = true;
	}

	async handleSort(data: DropDownActionData) {
		const sorting = data.valueChain[0] as SortCommentsOrder
		const path = extractPath(history.state.url);
		const params = new URLSearchParams(extractQuery(history.state.url));
		params.set("sort", sorting);

		data.setButtonLabel(getLoadingIcon());

		try {
			const newUrl = `${path}?${params.toString()}`;
			const newComments: RedditApiType[] = await redditApiRequest(newUrl, [], false);
			if (newComments["error"])
				throw `Sorting error (${JSON.stringify(newComments, null, 4)})`;

			this.comments.innerText = "";

			for (const comment of newComments[1].data.children) {
				this.comments.append(new Ph_Comment(comment, false, false, this.post));
			}

			ViewsStack.changeCurrentUrl(newUrl);
			data.setButtonLabel(`Sort - ${sorting}`);
		}
		catch (e) {
			console.error("Error sorting comments");
			console.error(e);
			new Ph_Toast(Level.error, "Error sorting comments");
			data.setButtonLabel(data.initialLabel);
		}

	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
