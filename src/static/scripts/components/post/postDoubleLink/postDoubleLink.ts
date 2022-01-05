import ViewsStack from "../../../historyState/viewsStack";
import {PhEvents} from "../../../types/Events";
import {elementWithClassInTree} from "../../../utils/htmlStuff";
import Ph_UniversalFeed from "../../feed/universalFeed/universalFeed";
import Ph_PostAndComments from "../../postAndComments/postAndComments";
import Ph_CommentsViewStateLoader from "../../viewState/commentsViewStateLoader/commentsViewStateLoader";
import {Ph_ViewState} from "../../viewState/viewState";
import Ph_Post from "../post";

export default class PostDoubleLink {
	post: Ph_Post;
	previousElementInFeed: HTMLElement;
	postAndComments: Ph_PostAndComments;
	commentsViewStateLoader: Ph_CommentsViewStateLoader;
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
		this.post.addEventListener(PhEvents.added, this.onPostAddedRef);
		this.post.addEventListener(PhEvents.removed, this.onPostRemovedRef);
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
		if (activeView !== this.universalFeed.parentElement && activeView !== this.commentsViewStateLoader)
			return;

		let isInFeed = !(activeView instanceof Ph_CommentsViewStateLoader);

		if (activeView !== postView) {
			this.updatePlaceholderPosition();
			// new active view is post and comments
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
		if (!this.postAndComments && this.post.parentElement instanceof Ph_PostAndComments) {
			this.postAndComments = this.post.parentElement;
			this.commentsViewStateLoader = this.postAndComments.parentElement as Ph_CommentsViewStateLoader;
		}
		window.addEventListener(PhEvents.viewChange, this.viewChangeRef);
		this.commentsViewStateLoader?.setIsNotReadyForCleanup();
	}

	onPostRemoved() {
		window.removeEventListener(PhEvents.viewChange, this.viewChangeRef);
		this.commentsViewStateLoader?.setIsReadyForCleanup();
		// another edge case:
		// commentsViewStateLoader is loaded in the next history state
		// the post has been permanently removed from its parent feed
		setTimeout(() => {
			if (this.post.isConnected)
				return;
			ViewsStack.removeViewState(this.commentsViewStateLoader);
			this.disable();
			for (const props in this) {
				this[props] = null;
			}
		}, 0);
	}

	disable() {
		this.post.removeEventListener(PhEvents.added, this.onPostAddedRef);
		this.post.removeEventListener(PhEvents.removed, this.onPostRemovedRef);
	}
}
