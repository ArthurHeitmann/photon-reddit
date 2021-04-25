import { elementWithClassInTree } from "../../../utils/htmlStuff.js";
import Ph_UniversalFeed from "../../feed/universalFeed/universalFeed.js";
import Ph_PostAndComments from "../../postAndComments/postAndComments.js";
import Ph_CommentsViewStateLoader from "../../viewState/commentsViewStateLoader/commentsViewStateLoader.js";
import { Ph_ViewState } from "../../viewState/viewState.js";
import Ph_Post from "../post.js";

export default class PostDoubleLink {
	post: Ph_Post;
	previousElementInFeed: HTMLElement;
	postAndComments: Ph_PostAndComments;
	universalFeed: Ph_UniversalFeed;
	postSubredditPrefixed: string;
	postUserPrefixed: string;
	postPlaceholder: HTMLDivElement;
	placeholderNextHeight: number;
	onPostAddedRef;
	onPostRemovedRef;
	viewChangeRef;

	constructor(postInFeed: Ph_Post) {
		this.onPostAddedRef = this.onPostAdded.bind(this);
		this.onPostRemovedRef = this.onPostRemoved.bind(this);
		this.post = postInFeed;
		this.post.addEventListener("ph-added", this.onPostAddedRef);
		this.post.addEventListener("ph-removed", this.onPostRemovedRef);
		this.previousElementInFeed = postInFeed.previousElementSibling as HTMLElement;
		this.universalFeed = elementWithClassInTree(postInFeed, "universalFeed") as Ph_UniversalFeed;
		this.postSubredditPrefixed = this.post.$css(".header a.subreddit")[0].getAttribute("href").slice(1);
		this.postUserPrefixed = this.post.$css(".header a.user > span")[0].innerHTML;
		this.viewChangeRef = this.onViewChange.bind(this);
		this.postPlaceholder = document.createElement("div");
		this.postPlaceholder.className = this.post.className;
		this.updatePlaceholderNextHeight();
		this.updatePlaceholderPosition();
	}

	onViewChange(e: CustomEvent) {
		const activeView = e.detail.viewState as Ph_ViewState;
		const postView = elementWithClassInTree(this.post, "viewState") as Ph_ViewState;

		// is this view change related to the post or triggered by something entirely different?
		if (activeView !== this.universalFeed.parentElement && activeView !== this.postAndComments.parentElement)
			return;

		let isInFeed = !(activeView instanceof Ph_CommentsViewStateLoader);

		if (activeView !== postView) {
			this.updatePlaceholderPosition();
			// new active view ist post and comments
			if (activeView instanceof Ph_CommentsViewStateLoader)
				this.postAndComments.insertAdjacentElement("afterbegin", this.post);
			// new active view is universal feed
			// post has a previous sibling
			else if (this.previousElementInFeed)
				this.previousElementInFeed.insertAdjacentElement("afterend", this.post);
			// post is first in universal feed
			else
				this.universalFeed.insertAdjacentElement("afterbegin", this.post);
		}

		this.post.isInFeed = isInFeed;
		this.postPlaceholder.className = this.post.className;
		this.post.classList.toggle("isInFeed", isInFeed);

		this.updatePlaceholderNextHeight();
	}

	updatePlaceholderNextHeight()  {
		this.placeholderNextHeight = this.post.offsetHeight;
	}

	updatePlaceholderPosition() {
		this.postPlaceholder.style.height = `${this.placeholderNextHeight}px`;
		this.post.insertAdjacentElement("beforebegin", this.postPlaceholder);
	}

	onPostAdded() {
		if (!this.postAndComments && this.post.parentElement instanceof Ph_PostAndComments)
			this.postAndComments = this.post.parentElement;
		window.addEventListener("ph-view-change", this.viewChangeRef);
	}

	onPostRemoved() {
		window.removeEventListener("ph-view-change", this.viewChangeRef);
	}

	disable() {
		this.post.removeEventListener("ph-added", this.onPostAddedRef);
		this.post.removeEventListener("ph-removed", this.onPostRemovedRef);
	}
}
