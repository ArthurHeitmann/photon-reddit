import { vote, VoteDirection, voteDirectionFromLikes } from "../../api/api.js";
import { timePassedSinceStr, numberToShortStr } from "../../utils/conv.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Votable from "../misc/votable/votable.js";
import Ph_PostBody from "./postBody/postBody.js";

export default class Ph_Post extends Ph_FeedItem implements Votable {
	votableId: string;
	currentVoteDirection: VoteDirection;

	constructor(postData: RedditApiType, isInFeed: boolean) {
		super(postData, isInFeed);

		if (postData.kind !== "t3")
			throw new Error("Invalid comment data type");

		this.votableId = postData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(postData.data["likes"])
		this.classList.add("post");

		// actions bar
		const actionBar = document.createElement("div");
		this.appendChild(actionBar);
		actionBar.className = "actions";
		const actionWrapper = document.createElement("div");
		actionBar.appendChild(actionWrapper);
		actionWrapper.className = "wrapper";
		// vote up button
		const voteUpButton = document.createElement("button");
		voteUpButton.className = "vote";
		voteUpButton.innerText = "+";
		voteUpButton.addEventListener("click", e => this.vote(VoteDirection.up));
		actionWrapper.appendChild(voteUpButton);
		// current votes
		const currentUpvotes = document.createElement("button");
		currentUpvotes.className = "upvotes";
		currentUpvotes.innerText = numberToShortStr(postData.data["ups"]);
		actionWrapper.appendChild(currentUpvotes);
		// vote down button
		const voteDownButton = document.createElement("button");
		voteDownButton.className = "vote";
		voteDownButton.innerText = "-";
		voteDownButton.addEventListener("click", e => this.vote(VoteDirection.down));
		actionWrapper.appendChild(voteDownButton);
		// additional actions button
		const moreButton = document.createElement("button");
		moreButton.className = "button additionActions";
		moreButton.innerText = "^";
		actionWrapper.appendChild(moreButton);
		// go to comments link
		if (isInFeed) {
			const commentsLink = document.createElement("a");
			commentsLink.className = "comments";
			commentsLink.href = postData.data["permalink"];
			commentsLink.innerHTML = `<img alt="comments" src="/img/comments.svg">`;
			actionWrapper.appendChild(commentsLink);
		}
		// additional actions button
		const numberOfComments = document.createElement("div");
		numberOfComments.className = "";
		numberOfComments.innerText = numberToShortStr(postData.data["num_comments"]);
		actionWrapper.appendChild(numberOfComments);

		const mainPart = document.createElement("div");
		mainPart.className = "w100";
		mainPart.innerHTML = `
			<div class="header">
				<div class="top flex">
					<span>Posted in</span>
					<a href="/${postData.data["subreddit_name_prefixed"]}" class="subreddit">
						<img src="#" alt="" class="subredditIcon"></img>
						<span>${postData.data["subreddit_name_prefixed"]}</span>
					</a>
					<span>by</span>
					<a href="/u/${postData.data["author"]}" class="user">
						<span>u/${postData.data["author"]}</span>
					</a>
					<div class="dropdown">${new Date(parseInt(postData.data["created_utc"])).toTimeString()}</div>
					<div class="time">${timePassedSinceStr(postData.data["created_utc"])}</div>
					<span>ago</span>
				</div>
				<div class="bottom flex">
					<div class="title">${postData.data["title"]}</div>
					<div class="mla flex">
					</div>
				</div>
			</div>
		`;
		mainPart.appendChild(new Ph_PostBody(postData));
		this.appendChild(mainPart);

		linksToSpa(this);
	}

	async vote (dir: VoteDirection): Promise<void> {
		this.currentVoteDirection = dir === this.currentVoteDirection ? VoteDirection.none : dir;
		
		
		const res = await vote(this);
		if (!res) {
			// TODO display error
		}
	};
}

customElements.define("ph-post", Ph_Post);
