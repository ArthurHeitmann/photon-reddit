import { deleteThing, save, vote, VoteDirection, voteDirectionFromLikes } from "../../api/redditApi.js";
import Votable from "../../types/votable.js";
import { hasPostsBeenSeen, markPostAsSeen, thisUser } from "../../utils/globals.js";
import { escADQ, escHTML } from "../../utils/htmlStatics.js";
import { elementWithClassInTree, linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../types/misc.js";
import {
	isObjectEmpty,
	numberToShort as numberToShort,
	numberToShortStr,
	timePassedSinceStr
} from "../../utils/utils.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import { globalSettings, NsfwPolicy, PhotonSettings } from "../global/photonSettings/photonSettings.js";
import Ph_AwardsInfo from "../misc/awardsInfo/awardsInfo.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Flair from "../misc/flair/flair.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_VoteButton from "../misc/voteButton/voteButton.js";
import Ph_PostBody from "./postBody/postBody.js";

/**
 * A reddit post
 */
export default class Ph_Post extends Ph_FeedItem implements Votable {
	actionBar: HTMLDivElement;
	voteUpButton: Ph_VoteButton;
	currentUpvotes: HTMLDivElement;
	voteDownButton: Ph_VoteButton;
	url: string;
	feedUrl: string;
	permalink: string;
	cover: HTMLElement = null;
	totalVotes: number;
	fullName: string;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;
	isLocked: boolean;
	postBody: Ph_PostBody;
	isPinned: boolean;
	isNsfw: boolean;
	isSpoiler: boolean;
	wasInitiallySeen: boolean;

	constructor(postData: RedditApiType, isInFeed: boolean, feedUrl?: string) {
		super(postData.data["name"], postData.data["permalink"], isInFeed);

		if (postData.kind !== "t3")
			throw "Invalid comment data type";

		this.fullName = postData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(postData.data["likes"]);
		this.totalVotes = parseInt(postData.data["ups"]) + -parseInt(this.currentVoteDirection);
		this.isSaved = postData.data["saved"];
		this.url = postData.data["url"];
		this.feedUrl = feedUrl;
		this.permalink = postData.data["permalink"];
		this.isPinned = postData.data["stickied"];
		this.isNsfw = postData.data["over_18"];
		this.isSpoiler = postData.data["spoiler"];
		this.wasInitiallySeen = hasPostsBeenSeen(this.fullName);
		this.classList.add("post");

		if (this.shouldPostBeHidden())
			this.classList.add("hide");

		window.addEventListener("settingsChanged", this.onSettingsChanged.bind(this));

		// actions bar
		this.actionBar = document.createElement("div");
		this.actionBar.className = "actions";
		this.appendChild(this.actionBar);
		const actionWrapper = document.createElement("div");
		this.actionBar.appendChild(actionWrapper);
		actionWrapper.className = "wrapper";
		// vote up button
		this.voteUpButton = new Ph_VoteButton(true);
		this.voteUpButton.addEventListener("click", () => this.vote(VoteDirection.up));
		actionWrapper.appendChild(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes ";
		actionWrapper.appendChild(this.currentUpvotes);
		// vote down button
		this.voteDownButton = new Ph_VoteButton(false);
		this.voteDownButton.addEventListener("click", () => this.vote(VoteDirection.down));
		actionWrapper.appendChild(this.voteDownButton);
		this.setVotesState(this.currentVoteDirection);
		// additional actions drop down
		const dropDownEntries = [
			{ displayHTML: this.isSaved ? "Unsave" : "Save", onSelectCallback: this.toggleSave.bind(this) },
			{ displayHTML: "Share", nestedEntries: [
					{ displayHTML: "Copy Post Link", value: "post link", onSelectCallback: this.share.bind(this) },
					{ displayHTML: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
					{ displayHTML: "Copy Link", value: "link", onSelectCallback: this.share.bind(this) },
					{ displayHTML: "Crosspost", onSelectCallback: this.crossPost.bind(this) },
				] }
		];
		if (thisUser && thisUser.name === postData.data["author"])
			dropDownEntries.push({ displayHTML: "Delete", onSelectCallback: this.deletePost.bind(this) });
		const moreDropDown = new Ph_DropDown(dropDownEntries, "", DirectionX.left, DirectionY.bottom, true);
		moreDropDown.toggleButton.classList.add("transparentButtonAlt");
		actionWrapper.appendChild(moreDropDown);
		// go to comments link
		const commentsLink = document.createElement("a");
		commentsLink.className = "commentsLink transparentButtonAlt";
		commentsLink.href = this.permalink;
		commentsLink.setAttribute("data-tooltip", postData.data["num_comments"]);
		const numbOfComments = numberToShortStr(postData.data["num_comments"]);
		let commentsSizeClass = "";
		if (numbOfComments.length > 3) {
			commentsSizeClass = " small";
		}
		else if (numbOfComments.length === 3) {
			commentsSizeClass = "medium";
		}
		commentsLink.innerHTML = `
			<img alt="comments" src="/img/comments.svg">
			<div class="${commentsSizeClass}">${numbOfComments}</div>
		`;
		commentsLink.addEventListener("click", (e: MouseEvent) => {
			if (isInFeed)
				return true;
			document.scrollingElement.scrollBy(0, this.getBoundingClientRect().bottom);
			e.stopImmediatePropagation();
			e.preventDefault();
			return false;
		})
		actionWrapper.appendChild(commentsLink);

		const isLocked = this.isLocked = postData.data["locked"] || postData.data["archived"];
		const lockedReason = postData.data["locked"] ? "locked" : "archived";
		let userAdditionClasses = "";
		if (postData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		}
		else if (postData.data["distinguished"] === "admin") {
			userAdditionClasses += " admin";
		}
		const mainPart = document.createElement("div");
		mainPart.className = "w100";
		mainPart.innerHTML = `
			<div class="header">
				<div class="top flex">
					${ this.isPinned ? `<img class="pinned" src="/img/pin.svg" alt="pinned" draggable="false">` : "" }
					<span>Posted in</span>
					<a href="/${escADQ(postData.data["subreddit_name_prefixed"])}" class="subreddit">
						<span>${escHTML(postData.data["subreddit_name_prefixed"])}</span>
					</a>
					<span>by</span>
					<a href="/user/${escADQ(postData.data["author"])}" class="user${userAdditionClasses}">
						<span>u/${escHTML(postData.data["author"])}</span>
						${ postData.data["author_cakeday"] ? `<img src="/img/cake.svg" class="cakeDay" alt="cake day">` : "" }
					</a>
					<span class="time" data-tooltip="${new Date(postData.data["created_utc"] * 1000).toString()}">${timePassedSinceStr(postData.data["created_utc"])}</span>
					<span>ago</span>
					${ postData.data["edited"]
					? `	<span>|</span><span>edited</span> 
						<span class="time" data-tooltip="${new Date(postData.data["edited"] * 1000).toString()}">${timePassedSinceStr(postData.data["edited"])}</span>
						<span>ago</span>`
					: ""
					}
					<div class="flairWrapper">					
						${ 	isLocked
							? `<span data-tooltip="${lockedReason}" class="locked"><img src="/img/locked.svg" alt="locked"></span>`
							: ""
						}
					</div>
				</div>
				<div class="bottom flex">
					<div class="title">${escHTML(postData.data["title"])}</div>
				</div>
			</div>
		`;
		if (postData.data["all_awardings"] && postData.data["all_awardings"].length > 0)
			mainPart.$class("flairWrapper")[0].insertAdjacentElement("beforebegin", new Ph_AwardsInfo(postData.data["all_awardings"]));
		try {
			this.postBody = new Ph_PostBody(postData);
			mainPart.appendChild(this.postBody);
		}
		catch (e) {
			console.error(`Error making post for ${postData.data["permalink"]}`);
			console.error(e);
			new Ph_Toast(Level.error, "Error making post");
		}
		this.appendChild(mainPart);

		mainPart.$class("flairWrapper")[0]
			.appendChild(Ph_Flair.fromThingData(postData.data, "link"));
		mainPart.$class("user")[0]
			.insertAdjacentElement("afterend", Ph_Flair.fromThingData(postData.data, "author"));
		const makeCoverNFlair = (flairColor: string, flairText: string, makeCover: boolean) => {
			mainPart.$class("flairWrapper")[0]
				.appendChild(new Ph_Flair({type: "text", backgroundColor: flairColor, text: flairText}));
			if (makeCover && !this.cover && isInFeed && !this.isEmpty(this.postBody)) {
				this.postBody.classList.add("covered");
				this.cover = this.postBody.appendChild(this.makeContentCover());
			}
			else
				this.cover = null;
		}
		if (this.isNsfw) {
			this.classList.add("nsfw");
			if (globalSettings.nsfwPolicy === NsfwPolicy.never)
				this.classList.add("hide");
			else
				makeCoverNFlair("darkred", "NSFW", globalSettings.nsfwPolicy === NsfwPolicy.covered);
		}
		if (this.isSpoiler) {
			this.classList.add("spoiler");
			makeCoverNFlair("orange", "Spoiler", true);
		}

		linksToSpa(this);

		const intersectionObserver = new IntersectionObserver(
			(entries, obs) => {
				this.dispatchEvent(new CustomEvent("ph-intersection", { detail: entries }))
				if (globalSettings.markSeenPosts && entries[0].intersectionRatio > .4 && isInFeed) {
					markPostAsSeen(this.fullName);
				}
			},
			{
				threshold: .4,
			}
		);
		intersectionObserver.observe(this);
	}

	private isEmpty(element: HTMLElement): boolean {
		return element.innerHTML === "" || Boolean(element.$css(".postText > *:empty").length > 0)
	}

	private onSettingsChanged(e: CustomEvent) {
		const changed: PhotonSettings = e.detail;
		if (this.shouldPostBeHidden(false, changed))
			this.classList.add("hide");
		else
			this.classList.remove("hide");

		const nsfwPolicy: NsfwPolicy = changed.nsfwPolicy;
		if (!nsfwPolicy)		// this setting hasn't been changed
			return;
		if (this.cover && !this.isSpoiler && changed.nsfwPolicy !== undefined)
			this.cover.click();
		if (this.isNsfw && nsfwPolicy === NsfwPolicy.covered && this.isInFeed && !this.isEmpty(this.postBody)) {		// add cover
			this.postBody.classList.add("covered");
			this.cover = this.postBody.appendChild(this.makeContentCover());
		}
	}

	/** This is a solution with the best UX and least unexpected hidden posts */
	private shouldPostBeHidden(ignoreSeenSettings: boolean = false, changedSettings?: PhotonSettings): boolean {
		const isInUserFeed = /^\/(u|user)\/([^/]+\/?){1,2}$/.test(this.feedUrl);	// 1, 2 to exclude multireddits
		if (changedSettings === undefined) {
			return (
				this.isInFeed && (
					!this.isPinned && globalSettings.hideSeenPosts && !isInUserFeed && !ignoreSeenSettings && hasPostsBeenSeen(this.fullName)
					|| this.isNsfw && globalSettings.nsfwPolicy === NsfwPolicy.never
				)
			);
		}
		else {
			// the if notation might be a bit slower but is a lot more readable
			if (!this.isInFeed)
				return false;
			if (this.isNsfw && globalSettings.nsfwPolicy === NsfwPolicy.never)
				return true;
			if (this.isPinned)
				return false;
			if (ignoreSeenSettings)
				return false
			if (changedSettings.hideSeenPosts !== undefined)
				return changedSettings.hideSeenPosts && !isInUserFeed && this.wasInitiallySeen && hasPostsBeenSeen(this.fullName);
			return this.wasInitiallySeen && globalSettings.hideSeenPosts;
		}
	}

	makeContentCover(): HTMLElement {
		const cover = document.createElement("div");
		cover.className = "cover";
		const removeBtn = document.createElement("div");
		removeBtn.innerText = "Show Post";
		cover.addEventListener("click", () => {
			this.$class("content")[0].classList.remove("covered");
			cover.remove();
			this.cover = null;
		})
		cover.appendChild(removeBtn);
		return cover;
	}

	forceShowWhenSeen() {
		if (!this.shouldPostBeHidden(true) && this.classList.contains("hidden"))
			this.classList.remove("hidden");
	}

	async vote(dir: VoteDirection): Promise<void> {
		const prevDir = this.currentVoteDirection;
		this.setVotesState(dir === this.currentVoteDirection ? VoteDirection.none : dir);
		const res = await vote(this);
		if (!res) {
			console.error("Error voting on post");
			this.setVotesState(prevDir);
			new Ph_Toast(Level.error, "Error occurred while voting");
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

	async toggleSave(valueChain: any[], _, __, source: Ph_DropDownEntry) {
		this.isSaved = !this.isSaved;
		source.innerText = this.isSaved ? "Unsave" : "Save";
		if (!await save(this)) {
			console.error(`error voting on post ${this.fullName}`);
			new Ph_Toast(Level.error, "Error saving post");
		}
	}

	share([ _, shareType ]) {
		switch (shareType) {
			case "post link":
				navigator.clipboard.writeText(location.origin + this.link);
				break;
			case "reddit link":
				navigator.clipboard.writeText(`reddit.com${this.link}`);
				break;
			case "link":
				if (this.url)
					navigator.clipboard.writeText(this.url);
				break;
			default:
				throw "Invalid share type";
				
		}
	}

	async deletePost() {
		const resp = await deleteThing(this);

		if (!isObjectEmpty(resp) || resp["error"]) {
			console.error("Error deleting post");
			console.error(resp);
			new Ph_Toast(Level.error, "Error deleting post");
			return;
		}

		this.postBody.innerText = "[deleted]";
		this.postBody.className = "content padded";
	}

	crossPost() {
		new Ph_Toast(Level.info, "Currently not supported", { timeout: 5000 });
	}
}

customElements.define("ph-post", Ph_Post);
