import { RedditApiType } from "../../utils/types.js";
import Ph_Comment from "../comment/comment.js";
import Ph_CommentsFeed from "../commentsFeed/commentsFeed.js";
import Ph_Post from "../post/post.js";
import { Ph_ViewState } from "../viewState/viewState.js";

export default class Ph_PostAndComments extends Ph_ViewState {
	constructor(data: RedditApiType[], url: string) {
		super({}, "Title", url);

		this.className = "postAndComments flex f-direction-column";

		this.appendChild(new Ph_Post(data[0].data.children[0], false));
		this.appendChild( new Ph_CommentsFeed(data[1]));
	}
}

customElements.define("ph-post-and-comments", Ph_PostAndComments);
