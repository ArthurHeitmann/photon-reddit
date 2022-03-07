import {SortCommentsOrder} from "../../../types/misc";
import {RedditCommentObj, RedditListingObj} from "../../../types/redditTypes";
import {linksToSpa} from "../../../utils/htmlStuff";
import {extractQuery, hasParams, makeElement, throttle} from "../../../utils/utils";
import Ph_Comment from "../../comment/comment";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Ph_Post from "../../post/post";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {Ph_ViewState} from "../../viewState/viewState";

/**
 * A list of Ph_Comment; has sorter; can have special link
 */
export default class Ph_CommentsFeed extends Ph_PhotonBaseElement {
	sort: SortCommentsOrder;
	private pendingComments: RedditCommentObj[] = [];
	private post: Ph_Post;

	constructor(comments: RedditListingObj<RedditCommentObj>, post: Ph_Post, suggestedSort: SortCommentsOrder | string | null) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("commentsFeed");

		const urlSort = new URLSearchParams(extractQuery(history.state.url)).get("sort");
		this.sort = urlSort ? SortCommentsOrder[urlSort] : suggestedSort;
		this.post = post;
		this.pendingComments = comments.data.children;
		const initialComments = this.preparePendingComments();

		this.addWindowEventListener("scroll",
			throttle(this.tryAddPendingComments.bind(this), 200));

		for (const commentData of initialComments)
			this.appendComment(commentData);
	}

	connectedCallback() {
		super.connectedCallback();

		this.tryAddPendingComments();
	}

	private tryAddPendingComments() {
		if (this.canAddPendingComments()) {
			const newComments = this.preparePendingComments();
			for (const comment of newComments)
				this.appendComment(comment);
		}
	}

	private appendComment(commentData) {
		try {
			const comment = new Ph_Comment(commentData, false, false, this.post);
			this.append(comment);
		}
		catch (e) {
			console.error("Error making root comment");
			console.error(e);
			new Ph_Toast(Level.error, "Error making comment");
		}
	}

	addPendingComments(comments: RedditCommentObj[]) {
		this.pendingComments.push(...comments);
		this.tryAddPendingComments();
	}

	reset() {
		this.innerText = "";
		this.pendingComments = [];
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

	private preparePendingComments(): RedditCommentObj[] {
		let newComments = 0;
		let i = 0;
		while (i < this.pendingComments.length && (newComments < 40 || i < 3)) {
			newComments += this.countAllNestedComments(this.pendingComments[i]);
			i++;
		}

		const outComments = this.pendingComments.slice(0, i);
		this.pendingComments = this.pendingComments.slice(i);
		return outComments;
	}

	private countAllNestedComments(comment: RedditCommentObj): number {
		let count = 1;
		const replies = (comment?.data?.replies as RedditListingObj<RedditCommentObj>)?.data?.children;
		if (replies?.length) {
			for (const reply of replies)
				count += this.countAllNestedComments(reply);
		}
		return count;
	}

	private canAddPendingComments(): boolean {
		if (this.pendingComments.length === 0)
			return false;
		if (Ph_ViewState.getViewOf(this).classList.contains("hide"))
			return false;
		if (this.childElementCount === 0)
			return true;
		const bottomDist = this.children[this.childElementCount - 1].getBoundingClientRect().bottom - window.innerHeight;
		return bottomDist < 1000;
	}
}

customElements.define("ph-comments-feed", Ph_CommentsFeed);
