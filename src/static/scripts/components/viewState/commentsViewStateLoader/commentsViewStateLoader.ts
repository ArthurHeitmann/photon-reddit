import ViewsStack from "../../../historyState/viewsStack";
import { HistoryState, RedditApiType } from "../../../types/misc";
import { hasParams } from "../../../utils/utils";
import Ph_Post from "../../post/post";
import PostDoubleLink from "../../post/postDoubleLink/postDoubleLink";
import Ph_PostAndComments from "../../postAndComments/postAndComments";
import { Ph_ViewState } from "../viewState";

/**
 * A Ph_ViewState with a loading screen
 */
export default class Ph_CommentsViewStateLoader extends Ph_ViewState {
	post: Ph_Post
	postAndComments: Ph_PostAndComments;
	isReadyForCleanup = false;

	constructor(state: HistoryState, postHint: PostDoubleLink) {
		super(state);
		if (!hasParams(arguments)) return;

		this.addEventListener("click", this.onBackAreaClick);
		this.post = postHint.post;
		this.postAndComments = new Ph_PostAndComments(null,{
			post: postHint.post,
			subredditPrefixed: postHint.postSubredditPrefixed,
			userPrefixed: postHint.postUserPrefixed
		});
		this.appendChild(this.postAndComments);
	}

	finishWith(postAndCommentsData: RedditApiType[]) {
		this.postAndComments.initWithData(postAndCommentsData);
	}

	error() {
		this.postAndComments.insertAdjacentHTML("beforeend", `
			<div class="center-h-alt">
				<h2>Oh no an error occurred!</h2>
				<div>What could have happened?</div>
				<ul>
					<li>The page you tried to visit was deleted or isn't publicly visible.</li>
					<li>Reddit is having problems. Check <a href="https://www.redditstatus.com" target="_blank">redditstatus.com</a></li>
					<li>Some internal error occurred. Check the browser console logs.</li>
				</ul>
			</div>
		`)
	}

	onBackAreaClick(e: MouseEvent) {
		if (e.currentTarget !== e.target || !ViewsStack.hasPreviousLoaded())
			return;

		history.back();
	}

	/** Ownership by PostDoubleLink; only if post and viewState are removed, start cleanup */
	onRemoved() {
		if (!this.isReadyForCleanup)
			return;
		super.onRemoved();
	}

	connectedCallback() {
		super.connectedCallback();

		this.setIsNotReadyForCleanup()
	}

	setIsReadyForCleanup() {
		if (this.isConnected)
			this.isReadyForCleanup = true;
		else
			super.onRemoved();
	}

	setIsNotReadyForCleanup() {
		this.isReadyForCleanup = false;
	}
}

customElements.define("ph-comments-view-state-loader", Ph_CommentsViewStateLoader);
