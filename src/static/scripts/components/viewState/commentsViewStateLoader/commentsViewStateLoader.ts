import ViewsStack from "../../../historyState/viewsStack";
import {HistoryState} from "../../../types/misc";
import {RedditApiObj, RedditListing, RedditPostObj} from "../../../types/redditTypes";
import {hasParams, makeElement} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import Ph_Post from "../../post/post";
import PostDoubleLink from "../../post/postDoubleLink/postDoubleLink";
import Ph_PostAndComments, {PostCommentsListings} from "../../postAndComments/postAndComments";
import {Ph_ViewState} from "../viewState";
import {redditApiRequest} from "../../../api/redditApi";
import Ph_Toast, {Level} from "../../misc/toast/toast";

/**
 * A Ph_ViewState with a loading screen
 */
export default class Ph_CommentsViewStateLoader extends Ph_ViewState {
	private post: Ph_Post
	private postAndComments: Ph_PostAndComments;
	private isReadyForCleanup = false;
	private errorElement: HTMLElement;

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

	finishWith(postAndCommentsData: RedditApiObj[]) {
		this.postAndComments.initWithData(postAndCommentsData as PostCommentsListings);
		this.post.updateWithData((postAndCommentsData[0].data as RedditListing<RedditPostObj>).children[0].data);
	}

	error() {
		this.postAndComments.append(this.errorElement = makeElement(
			"div", { class: "center-h-alt flex f-direction-column" }, [
				makeElement("h2", {}, "Oh no an error occurred!"),
				makeElement("div", {}, "What could have happened?"),
				makeElement("ul", {}, [
					makeElement("li", {}, "The page you tried to visit was deleted or isn't publicly visible."),
					makeElement("li", {}, `Reddit is having problems. Check <a href="https://www.redditstatus.com" target="_blank">redditstatus.com</a>`, true),
					makeElement("li", {}, "Some internal error occurred. Check the browser console logs.")
				]),
				makeElement("button", { class: "button retryButton", onclick: this.retryLoadingUrl.bind(this) }, "Reload comments"),
			]
		));
	}

	onBackAreaClick(e: MouseEvent) {
		if (!Users.global.d.photonSettings.emptyAreaClickGoesBack)
			return;
		if (e.currentTarget !== e.target || !ViewsStack.hasPreviousLoaded())
			return;

		history.back();
	}

	protected async retryLoadingUrl() {
		this.errorElement?.remove();
		this.errorElement = null;

		try {
			const newData = await redditApiRequest(this.state.url, [], false);
			this.finishWith(newData);
		} catch (e) {
			console.error(e);
			new Ph_Toast(Level.error, "Couldn't load comments :(", { timeout: 3000, groupId: "reloadError" });
			this.error();
		}
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
