import {save, vote, VoteDirection, voteDirectionFromLikes} from "../../api/api.js";
import {mainURL} from "../../utils/consts.js";
import {numberToShort as numberToShort, numberToShortStr, timePassedSinceStr} from "../../utils/conv.js";
import {linksToSpa} from "../../utils/htmlStuff.js";
import {RedditApiType} from "../../utils/types.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Ph_DropDown, {DirectionX, DirectionY} from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Votable from "../misc/votable/votable.js";
import Ph_PostBody from "./postBody/postBody.js";

export default class Ph_Post extends Ph_FeedItem implements Votable {
	actionBar: HTMLDivElement;
	voteUpButton: HTMLButtonElement;
	currentUpvotes: HTMLDivElement;
	voteDownButton: HTMLButtonElement;
	// Votable implementation
	totalVotes: number;
	votableId: string;
	currentVoteDirection: VoteDirection;

	isSaved: boolean;
	url: string;

	constructor(postData: RedditApiType, isInFeed: boolean) {
		super(postData, isInFeed);

		if (postData.kind !== "t3")
			throw "Invalid comment data type";

		this.votableId = postData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(postData.data["likes"]);
		this.totalVotes = parseInt(postData.data["ups"]);
		this.isSaved = postData.data["saved"];
		this.url = postData.data["url"];
		this.classList.add("post");

		// actions bar
		this.actionBar = document.createElement("div");
		this.actionBar.className = "actions";
		const actionWrapper = document.createElement("div");
		this.actionBar.appendChild(actionWrapper);
		actionWrapper.className = "wrapper";
		// vote up button
		this.voteUpButton = document.createElement("button");
		this.voteUpButton.className = "vote";
		this.voteUpButton.innerText = "+";
		this.voteUpButton.addEventListener("click", e => this.vote(VoteDirection.up));
		actionWrapper.appendChild(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes";
		this.setVotesState();
		actionWrapper.appendChild(this.currentUpvotes);
		// vote down button
		this.voteDownButton = document.createElement("button");
		this.voteDownButton.className = "vote";
		this.voteDownButton.innerText = "-";
		this.voteDownButton.addEventListener("click", e => this.vote(VoteDirection.down));
		actionWrapper.appendChild(this.voteDownButton);
		// additional actions drop down
		const moreDropDown = new Ph_DropDown([ 
			{ displayHTML: this.isSaved ? "Unsave" : "Save", onSelectCallback: this.toggleSave.bind(this) },
			{ displayHTML: "Share", nestedEntries: [
				{ displayHTML: "Copy Post Link", value: "post link", onSelectCallback: this.share.bind(this) },
				{ displayHTML: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
				{ displayHTML: "Copy Link", value: "link", onSelectCallback: this.share.bind(this) },
				{ displayHTML: "Crosspost", onSelectCallback: this.crossPost.bind(this) },
			] }
		], "...", DirectionX.left, DirectionY.bottom, true);
		actionWrapper.appendChild(moreDropDown);
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

		this.appendChild(this.actionBar);

		linksToSpa(this);
	}

	async vote(dir: VoteDirection): Promise<void> {
		const prevDir = this.currentVoteDirection;
		this.currentVoteDirection = dir === this.currentVoteDirection ? VoteDirection.none : dir;
		this.setVotesState();
		const res = await vote(this);
		if (!res) {
			console.error("Error voting on post");
			this.currentVoteDirection = prevDir;
			this.setVotesState();
			// TODO display error
		}
	};

	setVotesState() {
		this.currentUpvotes.innerText = numberToShort(this.totalVotes + parseInt(this.currentVoteDirection));
		switch (this.currentVoteDirection) {
			case VoteDirection.up:
				this.currentUpvotes.style.color = "orange"; break;
			case VoteDirection.none:
				this.currentUpvotes.style.color = "inherit"; break;
			case VoteDirection.down:
				this.currentUpvotes.style.color = "royalblue"; break;
		}
	}

	toggleSave(valueChain: any[], source: Ph_DropDownEntry) {
		this.isSaved = !this.isSaved;
		source.innerText = this.isSaved ? "Unsave" : "Save";
		save(this.itemId, this.isSaved);
	}

	share([ _, shareType ]) {
		switch (shareType) {
			case "post link":
				navigator.clipboard.writeText(mainURL + this.link);
				break;
			case "reddit link":
				navigator.clipboard.writeText("reddit.com" + this.link);
				break;
			case "link":
				if (this.url)
					navigator.clipboard.writeText(this.url);
				break;
			default:
				throw new Error("Invalid share type");
				
		}
	}

	crossPost() {

	}
}

customElements.define("ph-post", Ph_Post);
