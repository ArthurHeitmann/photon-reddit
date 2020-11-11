import {
	deleteThing,
	edit,
	redditApiRequest,
	save,
	vote,
	VoteDirection,
	voteDirectionFromLikes
} from "../../api/api.js";
import { mainURL } from "../../utils/consts.js";
import { thisUserName } from "../../utils/globals.js";
import { elementWithClassInTree, linksToInlineImages, linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import { isObjectEmpty, numberToShort, replaceRedditLinks, timePassedSinceStr } from "../../utils/utils.js";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry, { DropDownEntryParam } from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Flair from "../misc/flair/flair.js";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm.js";
import Ph_MarkdownForm from "../misc/markdownForm/markdownForm.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Votable from "../misc/votable/votable.js";
import Ph_VoteButton from "../misc/voteButton/voteButton.js";
import Post from "../post/post.js";

export default class Ph_Comment extends Ph_FeedItem implements Votable {
	voteUpButton: Ph_VoteButton;
	currentUpvotes: HTMLDivElement;
	voteDownButton: Ph_VoteButton;
	replyForm: Ph_CommentForm;
	childComments: HTMLElement;
	// Votable implementation
	totalVotes: number;
	votableId: string;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;
	postFullName: string;
	bodyMarkdown: string;

	constructor(commentData: RedditApiType, isChild: boolean, isInFeed: boolean, post: Post) {
		super(commentData, isInFeed);

		this.classList.add("comment");
		if (!isChild) {
			this.classList.add("rootComment");
		}

		if (commentData.kind === "more") {
			const loadMoreButton = document.createElement("button");
			loadMoreButton.className = "loadMoreButton";
			this.appendChild(loadMoreButton);

			if (commentData.data["children"].length === 0) {
				loadMoreButton.innerHTML = `<a href="${post.permalink}${commentData.data["parent_id"].slice(3)}">Continue thread</a>`;
				linksToSpa(loadMoreButton);
			}
			else {
				this.postFullName = post.votableId;
				const moreId = commentData.data["name"];
				const loadMoreBtnText: string = `Load more (${commentData.data["count"]})`;
				loadMoreButton.innerText = loadMoreBtnText;
				let nextChildren = commentData.data["children"] as unknown as string[];
				loadMoreButton.addEventListener("click", async () => {
					loadMoreButton.disabled = true;
					loadMoreButton.innerHTML = `<img src="/img/loading.svg">`;
					try {
						const loadedComments = await this.loadMoreComments(nextChildren, moreId);

						for (const comment of loadedComments) {
							this.insertAdjacentElement("beforebegin",
								new Ph_Comment(comment, isChild, isInFeed, post));
						}
						loadMoreButton.remove();
					} catch (e) {
						console.error("Error loading more comments");
						console.error(e);
						new Ph_Toast(Level.Error, "Error loading more comments");
						loadMoreButton.disabled = false;
						loadMoreButton.innerText = loadMoreBtnText;
					}
				});
			}
			return;
		}
		else if (commentData.kind !== "t1") {
			new Ph_Toast(Level.Error, "Error occurred while making comment");
			throw "Invalid comment data type";
		}

		this.setAttribute("data-id", commentData.data["name"].slice(3));
		this.bodyMarkdown = commentData.data["body"];

		this.votableId = commentData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(commentData.data["likes"]);
		this.totalVotes = parseInt(commentData.data["ups"]) + -parseInt(this.currentVoteDirection);
		this.isSaved = commentData.data["saved"];

		if (!isInFeed && !isChild && commentData.data["parent_id"] && commentData.data["parent_id"].slice(0, 3) === "t1_") {
			setTimeout(() =>
				(elementWithClassInTree(this.parentElement, "commentsFeed") as Ph_CommentsFeed)
					.insertParentLink(`${post.permalink}${commentData.data["parent_id"].slice(3)}?context=3`, "Load parent comment")
				, 0)
		}
		const isLocked = commentData.data["locked"] || commentData.data["archived"];
		const lockedReason = commentData.data["locked"] ? "locked" : "archived";

		// actions bar
		const actionBar = document.createElement("div");
		actionBar.className = "actions";
		// vote up button
		this.voteUpButton = new Ph_VoteButton(true);
		this.voteUpButton.addEventListener("click", e => this.vote(VoteDirection.up));
		actionBar.appendChild(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes";
		this.setVotesState(this.currentVoteDirection);
		actionBar.appendChild(this.currentUpvotes);
		// vote down button
		this.voteDownButton = new Ph_VoteButton(false);
		this.voteDownButton.addEventListener("click", e => this.vote(VoteDirection.down));
		actionBar.appendChild(this.voteDownButton);
		// additional actions drop down
		let dropDownParams: DropDownEntryParam[] = [];
		if (!isLocked)
			dropDownParams.push({ displayHTML: "Reply", onSelectCallback: this.showReplyForm.bind(this) });
		if (commentData.data["author"] === thisUserName) {
			dropDownParams.push({displayHTML: "Edit", onSelectCallback: this.edit.bind(this)});
			dropDownParams.push({displayHTML: "Delete", onSelectCallback: this.delete.bind(this)});
		}
		dropDownParams.push(...[
			{ displayHTML: this.isSaved ? "Unsave" : "Save", onSelectCallback: this.toggleSave.bind(this) },
			{ displayHTML: "Share", nestedEntries: [
					{displayHTML: "Copy Comment Link", value: "comment link", onSelectCallback: this.share.bind(this)},
					{displayHTML: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this)},
				]
			}
		]);
		const moreDropDown = new Ph_DropDown(dropDownParams, "", DirectionX.left, DirectionY.bottom, true);
		moreDropDown.toggleButton.classList.add("transparentButton");
		actionBar.appendChild(moreDropDown);
		const commentCollapser = document.createElement("div");
		commentCollapser.className = "commentCollapser";
		commentCollapser.innerHTML = `<div></div>`;
		commentCollapser.addEventListener("click", e => this.collapse(e));
		actionBar.appendChild(commentCollapser);
		this.appendChild(actionBar);

		let userAdditionClasses = "";
		if (commentData.data["is_submitter"]) {
			userAdditionClasses += " op";
		}
		if (commentData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		}
		else if (commentData.data["distinguished"] === "admin") {
			userAdditionClasses += " admin";
		}
		const mainPart = document.createElement("div");
		mainPart.className = "w100";
		mainPart.innerHTML = `
			<div class="header flex">
				<a href="/user/${commentData.data["author"]}" class="user${userAdditionClasses}">
					<span>u/${commentData.data["author"]}</span>
				</a>
				<span>commented</span>
				<div class="time" data-tooltip="${new Date(commentData.data["created_utc"] * 1000).toString()}">
					${timePassedSinceStr(commentData.data["created_utc"])}
				</div>
				<span>ago</span>
					${ commentData.data["edited"]
					? `	<span>|</span><span>edited</span>
						<div class="time" data-tooltip="${new Date(commentData.data["edited"] * 1000).toString()}">${timePassedSinceStr(commentData.data["edited"])}</div> 
						<span>ago</span>`
					: ""
					}
					${ 	isLocked 
						? `<span class="locked" data-tooltip="${lockedReason}"><img src="/img/locked.svg"></span>`
						: ""
					}
			</div>
			<div class="content">
				${commentData.data["body_html"]}
			</div>
		`;
		mainPart.getElementsByClassName("user")[0]
			.insertAdjacentElement("afterend", new Ph_Flair(commentData.data, "author"));
		linksToInlineImages(mainPart);

		for (const a of mainPart.getElementsByTagName("a")) {
			a.target = "_blank";
		}

		this.childComments = document.createElement("div");
		this.childComments.className = "replies";
		mainPart.appendChild(this.childComments);

		if (!isLocked) {
			this.replyForm = new Ph_CommentForm(this, true);
			this.replyForm.classList.add("hide");
			this.replyForm.addEventListener("ph-comment-submitted", (e: CustomEvent) => {
				this.replyForm.insertAdjacentElement("afterend",
					new Ph_Comment(e.detail, true, false, post));
				this.replyForm.classList.add("hide");
			});
			this.replyForm.addEventListener("ph-cancel", () => this.replyForm.classList.add("hide"));

			this.childComments.appendChild(this.replyForm);
		}

		if (commentData.data["replies"] && commentData.data["replies"]["data"]["children"]) {
			for (const comment of commentData.data["replies"]["data"]["children"]) {
				this.childComments.appendChild(new Ph_Comment(comment, true, false, post));
			}
		}

		this.appendChild(mainPart);

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	collapse(e: MouseEvent) {
		this.classList.toggle("isCollapsed");

		const top = this.getBoundingClientRect().top;
		if (top < 0)
			elementWithClassInTree(this.parentElement, "viewState").scrollBy(0, top);
	}

	showReplyForm() {
		this.replyForm.classList.remove("hide");
	}

	async loadMoreComments(children: string[], id: string): Promise<RedditApiType[]> {
		const childData = await redditApiRequest("/api/morechildren", [
			["api_type", "json"],
			["children", children.join(",")],
			["link_id", this.postFullName],
			["sort", (elementWithClassInTree(this.parentElement, "commentsFeed") as Ph_CommentsFeed).sort],
			["limit_children", "false"],
			["id", id]
		], false, {method: "POST"});

		let commentTree: RedditApiType[] = [];
		for (const comment of childData["json"]["data"]["things"] as RedditApiType[]) {
			if (!this.tryAttachToCommentTree(commentTree, comment)) {
				commentTree.push(comment);
			}

		}

		return commentTree;
	}

	private tryAttachToCommentTree(tree: RedditApiType[], commentData): boolean {
		for (let elem of tree) {
			if (elem.data["name"] === commentData.data["parent_id"]) {
				if (!elem.data["replies"] || elem.data["replies"]["kind"] !== "Listing") {
					elem.data["replies"] = <RedditApiType> {
						kind: "Listing",
						data: {
							children: []
						}
					};
				}
				elem.data["replies"]["data"]["children"].push(commentData);
				return true;
			} else if (elem.data["replies"] && elem.data["replies"]["kind"] === "Listing") {
				if (this.tryAttachToCommentTree(elem.data["replies"]["data"]["children"], commentData)) {
					return true;
				}
			}
		}

		return false;
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
		if (this.currentUpvotes.innerText.length > 3) {
			this.currentUpvotes.classList.add("small");
			this.currentUpvotes.classList.remove("medium");
		}
		else if (this.currentUpvotes.innerText.length === 3) {
			this.currentUpvotes.classList.add("medium");
			this.currentUpvotes.classList.remove("small");
		}
		else {
			this.currentUpvotes.classList.remove("medium");
			this.currentUpvotes.classList.remove("small");
		}
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
			console.error(`error voting on comment ${this.votableId}`);
			new Ph_Toast(Level.Error, "Error saving post");
		}
	}

	share([_, shareType]) {
		switch (shareType) {
			case "comment link":
				navigator.clipboard.writeText(`${mainURL + this.link}?context=3`);
				break;
			case "reddit link":
				navigator.clipboard.writeText(`reddit.com${this.link}?context=3`);
				break;
			default:
				throw "Invalid share type";

		}
	}

	async edit() {
		this.classList.add("isEditing");

		const editForm = new Ph_MarkdownForm("Edit", true);
		editForm.commentTextField.value = this.bodyMarkdown;
		editForm.addEventListener("ph-submit", async () => {
			try {
				const resp = await edit(this, editForm.commentTextField.value);

				if (resp["json"] && resp["json"]["errors"]) {
					new Ph_Toast(Level.Error, resp["json"]["errors"][0].join(" | "));
					return;
				} else if (resp["error"]) {
					new Ph_Toast(Level.Error, resp["message"]);
					return;
				}
				this.bodyMarkdown = resp["body"];
				this.classList.remove("isEditing");
				this.getElementsByClassName("content")[0].innerHTML = resp["body_html"];
				editForm.remove();
				new Ph_Toast(Level.Success, "Edited comment", 2000);
			} catch (e) {
				console.error("Error editing comment");
				console.error(e);
				new Ph_Toast(Level.Error, "Error editing comment");
			}
		});
		editForm.addEventListener("ph-cancel", () => editForm.remove());
		this.childComments.insertAdjacentElement("beforebegin", editForm);
	}

	async delete() {
		try {
			const resp = await deleteThing(this);

			if (!isObjectEmpty(resp) || resp["error"]) {
				console.error("Error deleting comment");
				console.error(resp);
				new Ph_Toast(Level.Error, "Error deleting comment");
				return;
			}

			this.getElementsByClassName("content")[0].innerHTML = "[deleted]";
			new Ph_Toast(Level.Success, "Deleted comment", 2000);
		} catch (e) {
			console.error("Error deleting comment");
			console.error(e);
			new Ph_Toast(Level.Error, "Error deleting comment");
		}
	}
}

customElements.define("ph-comment", Ph_Comment);
