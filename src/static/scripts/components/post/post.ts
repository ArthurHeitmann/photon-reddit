import { save, vote, VoteDirection, voteDirectionFromLikes } from "../../api/api.js";
import { mainURL } from "../../utils/consts.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import { numberToShort as numberToShort, numberToShortStr, timePassedSinceStr } from "../../utils/utils.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Flair from "../misc/flair/flair.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Votable from "../misc/votable/votable.js";
import Ph_VoteButton from "../misc/voteButton/voteButton.js";
import Ph_PostBody from "./postBody/postBody.js";

export default class Post extends Ph_FeedItem implements Votable {
	actionBar: HTMLDivElement;
	voteUpButton: Ph_VoteButton;
	currentUpvotes: HTMLDivElement;
	voteDownButton: Ph_VoteButton;
	url: string;
	permalink: string;
	// Votable implementation
	totalVotes: number;
	votableId: string;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;


	constructor(postData: RedditApiType, isInFeed: boolean) {
		super(postData, isInFeed);

		if (postData.kind !== "t3")
			throw "Invalid comment data type";

		this.votableId = postData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(postData.data["likes"]);
		this.totalVotes = parseInt(postData.data["ups"]) + -parseInt(this.currentVoteDirection);
		this.isSaved = postData.data["saved"];
		this.url = postData.data["url"];
		this.permalink = postData.data["permalink"];
		this.classList.add("post");

		// actions bar
		this.actionBar = document.createElement("div");
		this.actionBar.className = "actions";
		const actionWrapper = document.createElement("div");
		this.actionBar.appendChild(actionWrapper);
		actionWrapper.className = "wrapper";
		// vote up button
		this.voteUpButton = new Ph_VoteButton(true);
		this.voteUpButton.addEventListener("click", e => this.vote(VoteDirection.up));
		actionWrapper.appendChild(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes";
		this.setVotesState(this.currentVoteDirection);
		actionWrapper.appendChild(this.currentUpvotes);
		// vote down button
		this.voteDownButton = new Ph_VoteButton(false);
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
		], "", DirectionX.left, DirectionY.bottom, true);
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
		numberOfComments.setAttribute("data-tooltip", postData.data["num_comments"]);
		actionWrapper.appendChild(numberOfComments);

		const mainPart = document.createElement("div");
		mainPart.className = "w100";
		let userAdditionClasses = "";
		if (postData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		}
		else if (postData.data["distinguished"] === "admin") {
			userAdditionClasses += " admin";
		}
		mainPart.innerHTML = `
			<div class="header">
				<div class="top flex">
					<span>Posted in</span>
					<a href="/${postData.data["subreddit_name_prefixed"]}" class="subreddit">
						<img src="#" alt="" class="subredditIcon"/>
						<span>${postData.data["subreddit_name_prefixed"]}</span>
					</a>
					<span>by</span>
					<a href="/user/${postData.data["author"]}" class="user${userAdditionClasses}">
						<span>u/${postData.data["author"]}</span>
					</a>
					<span>posted</span>
					<div class="time" data-tooltip="${new Date(postData.data["created_utc"] * 1000).toString()}">${timePassedSinceStr(postData.data["created_utc"])}</div>
					<span>ago</span>
					${ postData.data["edited"]
					? `edited <div class="time" data-tooltip="${new Date(postData.data["edited"] * 1000).toString()}">${timePassedSinceStr(postData.data["edited"])}</div>`
					: ""
					}
				</div>
				<div class="bottom flex">
						<div class="title">${postData.data["title"]}</div>
				</div>
			</div>
		`;
		mainPart.getElementsByClassName("header")[0]
			.appendChild(new Ph_Flair(postData.data, "link"));
		mainPart.getElementsByClassName("user")[0]
			.insertAdjacentElement("afterend", new Ph_Flair(postData.data, "author"));
		mainPart.appendChild(new Ph_PostBody(postData));
		this.appendChild(mainPart);

		this.appendChild(this.actionBar);

		linksToSpa(this);
	}

	async vote(dir: VoteDirection): Promise<void> {
		const prevDir = this.currentVoteDirection;
		this.setVotesState(dir === this.currentVoteDirection ? VoteDirection.none : dir);
		const res = await vote(this);
		if (!res) {
			console.error("Error voting on post");
			this.setVotesState(prevDir);
			new Ph_Toast(Level.Error, "Error occurred while voting");
		}
	};

	setVotesState(voteDirection: VoteDirection) {
		this.currentUpvotes.innerText = numberToShort(this.totalVotes + parseInt(voteDirection));
		this.currentUpvotes.setAttribute("data-tooltip", (this.totalVotes + parseInt(voteDirection)).toString());

		const isAnimated = voteDirection !== this.currentVoteDirection;

		switch (this.currentVoteDirection) {
			case VoteDirection.up:
				this.voteUpButton.unVote();
				break;
			case VoteDirection.down:
				this.voteDownButton.unVote();
				break;
		}
		this.currentVoteDirection = voteDirection;
		switch (this.currentVoteDirection) {
			case VoteDirection.up:
				this.voteUpButton.vote(isAnimated);
				break;
			case VoteDirection.down:
				this.voteDownButton.vote(isAnimated);
				break;
		}
	}

	async toggleSave(valueChain: any[], source: Ph_DropDownEntry) {
		this.isSaved = !this.isSaved;
		source.innerText = this.isSaved ? "Unsave" : "Save";
		if (!await save(this)) {
			console.error(`error voting on post ${this.votableId}`);
			new Ph_Toast(Level.Error, "Error saving post");
		}
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
				throw "Invalid share type";
				
		}
	}

	crossPost() {

	}
}

customElements.define("ph-post", Post);
