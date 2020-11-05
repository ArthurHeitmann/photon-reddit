import { mainURL } from "../../utils/consts.js";
import { numberToShort, numberToShortStr, replaceRedditLinks, timePassedSinceStr } from "../../utils/utils.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Votable from "../misc/votable/votable.js";
import { save, vote, VoteDirection, voteDirectionFromLikes } from "../../api/api.js";
import Ph_CommentForm from "./commentForm/commentForm.js";

export default class Ph_Comment extends Ph_FeedItem implements Votable {
	voteUpButton: HTMLButtonElement;
	currentUpvotes: HTMLDivElement;
	voteDownButton: HTMLButtonElement;
	replyForm: Ph_CommentForm;
	// Votable implementation
	totalVotes: number;
	votableId: string;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;

	constructor(commentData: RedditApiType, isChild: boolean, isInFeed: boolean) {
		super(commentData, isInFeed);

		if (commentData.kind === "more") {
			const loadMoreButton = document.createElement("button");
			loadMoreButton.innerText = `Load more (${commentData.data["count"]})`;
			this.appendChild(loadMoreButton);
			return;
		} else if (commentData.kind !== "t1") {
			new Ph_Toast(Level.Error, "Error occurred while making comment");
			throw "Invalid comment data type";
		}

		this.votableId = commentData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(commentData.data["likes"]);
		this.totalVotes = parseInt(commentData.data["ups"]) + -parseInt(this.currentVoteDirection);
		this.isSaved = commentData.data["saved"];

		this.classList.add("comment");
		if (!isChild) {
			this.classList.add("rootComment");
		}


		// actions bar
		const actionBar = document.createElement("div");
		actionBar.className = "actions";
		// vote up button
		this.voteUpButton = document.createElement("button");
		this.voteUpButton.className = "vote";
		this.voteUpButton.innerText = "+";
		this.voteUpButton.addEventListener("click", e => this.vote(VoteDirection.up));
		actionBar.appendChild(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes";
		this.setVotesState();
		actionBar.appendChild(this.currentUpvotes);
		// vote down button
		this.voteDownButton = document.createElement("button");
		this.voteDownButton.className = "vote";
		this.voteDownButton.innerText = "-";
		this.voteDownButton.addEventListener("click", e => this.vote(VoteDirection.down));
		actionBar.appendChild(this.voteDownButton);
		// additional actions drop down
		const moreDropDown = new Ph_DropDown([
			{ displayHTML: "Reply", onSelectCallback: this.showReplyForm.bind(this) },
			{ displayHTML: this.isSaved ? "Unsave" : "Save", onSelectCallback: this.toggleSave.bind(this) },
			{ displayHTML: "Share", nestedEntries: [
					{ displayHTML: "Copy Comment Link", value: "comment link", onSelectCallback: this.share.bind(this) },
					{ displayHTML: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
				] }
		], "...", DirectionX.left, DirectionY.bottom, true);
		actionBar.appendChild(moreDropDown);
		const commentCollapser = document.createElement("div");
		commentCollapser.className = "commentCollapser";
		commentCollapser.innerHTML = `<div></div>`;
		commentCollapser.addEventListener("click", e => this.collapse(e));
		actionBar.appendChild(commentCollapser);
		this.appendChild(actionBar);

		const mainPart = document.createElement("div");
		mainPart.className = "w100"
		let userAdditionClasses = "";
		if (commentData.data["is_submitter"]) {
			userAdditionClasses += " op";
		}
		if (commentData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		}
		mainPart.innerHTML = `
			<div class="header flex">
				<a href="/user/${commentData.data["author"]}" class="user${userAdditionClasses}">
					<span>u/${commentData.data["author"]}</span>
				</a>
				<div class="dropdown">${new Date(parseInt(commentData.data["created_utc"])).toTimeString()}</div>
				<div class="time">${timePassedSinceStr(commentData.data["created_utc"])}</div>
				<span>ago</span>
			</div>
			<div class="content">
				${commentData.data["body_html"]}
			</div>
		`;

		for (const a of mainPart.getElementsByTagName("a")) {
			a.target = "_blank";
		}

		const childComments = document.createElement("div");
		childComments.className = "replies";
		mainPart.appendChild(childComments);

		this.replyForm = new Ph_CommentForm(this);
		this.replyForm.hidden = true;
		this.replyForm.addEventListener("ph-comment-submitted",
			(e: CustomEvent) => this.replyForm.insertAdjacentElement("afterend", new Ph_Comment(e.detail, true, false)));

		childComments.appendChild(this.replyForm);
		if (commentData.data["replies"] && commentData.data["replies"]["data"]["children"]) {
			for (const comment of commentData.data["replies"]["data"]["children"]) {
				childComments.appendChild(new Ph_Comment(comment, true, false));
			}
		}

		this.appendChild(mainPart);

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	collapse(e: MouseEvent) {
		this.classList.toggle("isCollapsed");
	}

	showReplyForm() {
		this.replyForm.hidden = false;
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
			new Ph_Toast(Level.Error, "Error occurred while voting");
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

	async toggleSave(valueChain: any[], source: Ph_DropDownEntry) {
		this.isSaved = !this.isSaved;
		source.innerText = this.isSaved ? "Unsave" : "Save";
		if (!await save(this)) {
			console.error(`error voting on comment ${this.votableId}`);
			new Ph_Toast(Level.Error, "Error saving post");
		}
	}

	share([ _, shareType ]) {
		switch (shareType) {
			case "comment link":
				navigator.clipboard.writeText(mainURL + this.link);
				break;
			case "reddit link":
				navigator.clipboard.writeText("reddit.com" + this.link);
				break;
			default:
				throw "Invalid share type";

		}
	}
}

customElements.define("ph-comment", Ph_Comment);
