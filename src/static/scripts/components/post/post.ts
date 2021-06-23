import {
	deleteThing,
	getSubFlairs,
	redditApiRequest,
	save,
	setPostFlair,
	setPostNsfw,
	setPostSendReplies,
	setPostSpoiler,
	vote,
	VoteDirection,
	voteDirectionFromLikes
} from "../../api/redditApi.js";
import { pushLinkToHistoryComb, PushType } from "../../historyState/historyStateManager.js";
import ViewsStack from "../../historyState/viewsStack.js";
import { RedditApiData, RedditApiType } from "../../types/misc.js";
import Votable from "../../types/votable.js";
import { hasPostsBeenSeen, markPostAsSeen, thisUser } from "../../utils/globals.js";
import { emojiFlagsToImages, escADQ, escHTML, getLoadingIcon } from "../../utils/htmlStatics.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import {
	getPostIdFromUrl,
	hasParams,
	isObjectEmpty,
	numberToShort as numberToShort,
	numberToShortStr,
	timePassedSinceStr
} from "../../utils/utils.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import { globalSettings, NsfwPolicy, PhotonSettings } from "../global/photonSettings/photonSettings.js";
import Ph_AwardsInfo from "../misc/awardsInfo/awardsInfo.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownEntry, {
	DropDownActionData,
	DropDownEntryParam
} from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Flair, { FlairApiData } from "../misc/flair/flair.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_VoteButton from "../misc/voteButton/voteButton.js";
import Ph_PostBody from "./postBody/postBody.js";
import Ph_PostText from "./postBody/postText/postText.js";
import PostDoubleLink from "./postDoubleLink/postDoubleLink.js";

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
	postTitle: string
	cover: HTMLElement = null;
	totalVotes: number;
	fullName: string;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;
	isLocked: boolean;
	sendReplies: boolean;
	postBody: Ph_PostBody;
	isPinned: boolean;
	isNsfw: boolean;
	isSpoiler: boolean;
	wasInitiallySeen: boolean;
	becameVisibleAt: number;
	doubleLink: PostDoubleLink = null;
	haveFlairsLoaded = false;
	postFlair: Ph_Flair;

	constructor(postData: RedditApiType, isInFeed: boolean, feedUrl?: string) {
		super(postData?.data["name"], postData?.data["permalink"], isInFeed);
		if (!hasParams(arguments)) return;

		if (postData.kind !== "t3")
			throw "Invalid comment data type";

		this.fullName = postData.data["name"];
		this.currentVoteDirection = voteDirectionFromLikes(postData.data["likes"]);
		this.totalVotes = parseInt(postData.data["ups"]) + -parseInt(this.currentVoteDirection);
		this.isSaved = postData.data["saved"];
		this.url = postData.data["url"];
		this.feedUrl = feedUrl;
		this.permalink = postData.data["permalink"];
		this.postTitle = postData.data["title"];
		this.isPinned = postData.data["stickied"];
		this.sendReplies = postData.data["send_replies"];
		this.isNsfw = postData.data["over_18"];
		this.isSpoiler = postData.data["spoiler"];
		this.wasInitiallySeen = hasPostsBeenSeen(this.fullName);
		this.classList.add("post");

		if (this.shouldPostBeHidden())
			this.classList.add("hide");

		this.addWindowEventListener("ph-settings-changed", this.onSettingsChanged.bind(this));

		// actions bar
		this.actionBar = document.createElement("div");
		this.actionBar.className = "actions";
		this.append(this.actionBar);
		const actionWrapper = document.createElement("div");
		this.actionBar.append(actionWrapper);
		actionWrapper.className = "wrapper";
		// vote up button
		this.voteUpButton = new Ph_VoteButton(true);
		this.voteUpButton.addEventListener("click", this.vote.bind(this, VoteDirection.up));
		actionWrapper.append(this.voteUpButton);
		// current votes
		this.currentUpvotes = document.createElement("div");
		this.currentUpvotes.className = "upvotes ";
		actionWrapper.append(this.currentUpvotes);
		// vote down button
		this.voteDownButton = new Ph_VoteButton(false);
		this.voteDownButton.addEventListener("click", this.vote.bind(this, VoteDirection.down));
		actionWrapper.append(this.voteDownButton);
		this.setVotesState(this.currentVoteDirection);



		this.postBody = new Ph_PostBody(undefined);
		if (!isInFeed)
			this.initPostBody(postData);

		// additional actions drop down
		const dropDownEntries: DropDownEntryParam[] = [
			{
				label: this.isSaved ? "Unsave" : "Save",
				labelImgUrl: this.isSaved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg",
				onSelectCallback: this.toggleSave.bind(this)
			},
			{ label: "Share", labelImgUrl: "/img/share.svg", nestedEntries: [
					{ label: "Copy Post Link", value: "post link", onSelectCallback: this.share.bind(this) },
					{ label: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
					{ label: "Copy Link", value: "link", onSelectCallback: this.share.bind(this) },
					// { label: "Crosspost", onSelectCallback: this.crossPost.bind(this) },
			] }
		];
		this.postFlair = Ph_Flair.fromThingData(postData.data, "link");
		if (thisUser && thisUser.name === postData.data["author"]) {
			const editEntries: DropDownEntryParam[] = [];
			if (postData.data["is_self"])
				editEntries.push({ label: "Edit Text", labelImgUrl: "/img/text.svg", onSelectCallback: this.editPost.bind(this) });
			editEntries.push({ label: this.isNsfw ? "Unmark NSFW" : "Mark NSFW", labelImgUrl: "/img/18+.svg", onSelectCallback: this.toggleNsfw.bind(this) });
			editEntries.push({ label: this.isSpoiler ? "Unmark Spoiler" : "Mark Spoiler", labelImgUrl: "/img/warning.svg", onSelectCallback: this.toggleSpoiler.bind(this) });
			editEntries.push({ label: `${this.sendReplies ? "Disable" : "Enable"} Reply Notifications`, labelImgUrl: "/img/notification.svg", onSelectCallback: this.toggleSendReplies.bind(this) });
			if (!this.postFlair.classList.contains("empty")) {
				editEntries.push({ label: "Change Flair", labelImgUrl: "/img/tag.svg", onSelectCallback: this.onEditFlairClick.bind(this), nestedEntries: [
					{ label: getLoadingIcon() }
				]});
			}
			dropDownEntries.push({ label: "Edit", labelImgUrl: "/img/edit.svg", nestedEntries: editEntries });
			dropDownEntries.push({ label: "Delete", labelImgUrl: "/img/delete.svg", onSelectCallback: this.deletePostPrompt.bind(this) });
		}
		if (postData.data["num_crossposts"] > 0) {
			dropDownEntries.push({ label:
				`<a href="${this.permalink.replace("comments", "duplicates")}" class="noStyle">View ${postData.data["num_crossposts"]} Crossposts</a>`,
				labelImgUrl: "/img/shuffle.svg"
			});
		}
		const moreDropDown = new Ph_DropDown(dropDownEntries, "", DirectionX.left, DirectionY.bottom, true);
		moreDropDown.toggleButton.classList.add("transparentButtonAlt");
		actionWrapper.append(moreDropDown);
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
		actionWrapper.append(commentsLink);

		this.isLocked = postData.data["locked"] || postData.data["archived"];
		const lockedReason = postData.data["locked"] ? "Locked" : "Archived";
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
						${ 	this.isLocked
							? `<span data-tooltip="${lockedReason}" class="locked"><img src="/img/locked.svg" alt="locked"></span>`
							: ""
						}
					</div>
				</div>
				<div class="bottom flex">
					<div class="title">${escHTML(this.postTitle)}</div>
				</div>
			</div>
		`;
		emojiFlagsToImages(mainPart);
		if (postData.data["all_awardings"] && postData.data["all_awardings"].length > 0)
			mainPart.$class("flairWrapper")[0].insertAdjacentElement("beforebegin", new Ph_AwardsInfo(postData.data["all_awardings"]));
		if (postData.data["crosspost_parent_list"]?.length > 0) {
			const crosspostData: RedditApiData = postData.data["crosspost_parent_list"][0];
			const miniPost = document.createElement("div");
			miniPost.className = "miniPost";
			miniPost.innerHTML = `
				<a href="${escADQ(crosspostData["permalink"])}" class="miniBackgroundLink"></a>
				<div class="postSummary">
					<div class="leftItems">
						<div>
							<img src="/img/downArrow.svg" class="votesImg" alt="votes">
							<span>${numberToShort(crosspostData["ups"])}</span>
						</div>
						<div>
							<img src="/img/comments.svg" class="commentsImg" alt="comments">
							<span>${numberToShort(crosspostData["num_comments"])}</span>
						</div>
						
					</div>
					<div>
						<div class="info">
							<span>Crossposted from</span>
							<a href="/${escADQ(crosspostData["subreddit_name_prefixed"])}" class="subreddit">
								<span>${escHTML(crosspostData["subreddit_name_prefixed"])}</span>
							</a>
							<span>by</span>
							<a href="/user/${escADQ(crosspostData["author"])}" class="user">
								<span>u/${escHTML(crosspostData["author"])}</span>
								${ crosspostData["author_cakeday"] ? `<img src="/img/cake.svg" class="cakeDay" alt="cake day">` : "" }
							</a>
							<span class="time" data-tooltip="${new Date(crosspostData["created_utc"] * 1000).toString()}">${timePassedSinceStr(crosspostData["created_utc"])}</span>
							<span>ago</span>
							${ crosspostData["edited"]
								? `	<span>|</span><span>edited</span> 
									<span class="time" data-tooltip="${new Date(crosspostData["edited"] * 1000).toString()}">${timePassedSinceStr(crosspostData["edited"])}</span>
									<span>ago</span>`
								: ""
							}
						</div>
						<div class="title">${escHTML(crosspostData["title"])}</div>
					</div>
				</div>
			`;
			mainPart.append(miniPost);
		}
		mainPart.append(this.postBody);
		this.append(mainPart);

		mainPart.$class("flairWrapper")[0]
			.append(this.postFlair);
		mainPart.$class("user")[0]
			.insertAdjacentElement("afterend", Ph_Flair.fromThingData(postData.data, "author"));

		const makeFlair = (flairColor: string, flairText: string) => {
			const flair = new Ph_Flair({ type: "text", backgroundColor: flairColor, text: flairText });
			flair.classList.add(flairText.toLowerCase());
			mainPart.$class("flairWrapper")[0].appendChild(flair);
		}
		if (this.isNsfw) {
			this.classList.add("nsfw");
			if (globalSettings.nsfwPolicy === NsfwPolicy.never)
				this.classList.add("hide");
		}
		makeFlair("darkred", "NSFW");
		if (this.isSpoiler)
			this.classList.add("spoiler");
		makeFlair("orange", "Spoiler");

		linksToSpa(this)

		if (isInFeed)
			(this.$class("backgroundLink")[0] as HTMLAnchorElement).onclick = this.linkToCommentsClick.bind(this);

		commentsLink.onclick = (e: MouseEvent) => {
			if (this.isInFeed)
				return this.linkToCommentsClick(e);
			document.scrollingElement.scrollBy(0, this.getBoundingClientRect().bottom);
			return false;
		};

		this.addEventListener("ph-intersection-change", this.onIntersectionChange.bind(this));
		if (!this.postBody.isInitialized)
			this.addEventListener("ph-almost-visible", () => this.initPostBody(postData), { once: true });
	}

	private initPostBody(postData: RedditApiType) {
		try {
			this.postBody.init(postData);
		}
		catch (e) {
			console.error(`Error making post for ${postData.data["permalink"]}`);
			console.error(e);
			new Ph_Toast(Level.error, "Error making post");
		}
		if (
			(this.isSpoiler || this.isNsfw && globalSettings.nsfwPolicy === NsfwPolicy.covered) &&
			!this.cover && this.isInFeed && !this.isEmpty(this.postBody)
		) {
			this.postBody.classList.add("covered");
			this.cover = this.postBody.appendChild(this.makeContentCover());
		}
		else
			this.cover = null;
	}

	private isEmpty(element: HTMLElement): boolean {
		return element.innerHTML === "" || Boolean(element.$css(".postText > *:empty").length > 0)
	}

	private onIntersectionChange(e: CustomEvent) {
		const isVisible: boolean = e.detail;
		const focusableChild = this.$css("[tabindex]") as HTMLCollectionOf<HTMLHtmlElement>;
		// post became visible
		if (isVisible) {
			if (focusableChild.length > 0)
				focusableChild[0].focus({ preventScroll: true });
			this.becameVisibleAt = Date.now();
		}
		// post got hidden
		else {
			if (focusableChild.length > 0 && !document.fullscreenElement)
				focusableChild[0].blur();
			if (this.becameVisibleAt) {
				const visibilityDuration = Date.now() - this.becameVisibleAt;
				this.becameVisibleAt = null;
				if (visibilityDuration > 750 && globalSettings.markSeenPosts && this.isInFeed) {
					markPostAsSeen(this.fullName);
				}
			}
		}
	}

	private onSettingsChanged(e: CustomEvent) {
		const changed: PhotonSettings = e.detail;
		this.classList.toggle("hide", this.shouldPostBeHidden(false, changed));

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
		const isInUserFeed = /^\/(u|user)\/([^/]+\/?){1,2}$/i.test(this.feedUrl);	// matches /u/user/submitted or /user/x/saved; 1, 2 to exclude multireddits /user/x/m/multi
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
		cover.addEventListener("click", e => {
			this.$class("content")[0].classList.remove("covered");
			(e.currentTarget as HTMLElement).remove();
			this.cover = null;
		}, { once: true })
		cover.appendChild(removeBtn);
		return cover;
	}

	forceShowWhenSeen() {
		if (!this.shouldPostBeHidden(true) && this.classList.contains("hide"))
			this.classList.remove("hide");
	}

	linkToCommentsClick(e) {
		if (e.ctrlKey)
			return true;
		const postHref = e.currentTarget.getAttribute("href");
		const nextHistoryUrl = ViewsStack.getNextState()?.state.url;
		if (!this.doubleLink && getPostIdFromUrl(nextHistoryUrl) !== getPostIdFromUrl(postHref))
			this.doubleLink = new PostDoubleLink(this);
		pushLinkToHistoryComb(postHref, PushType.pushAfter, this.doubleLink);
		return false;
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

		if (this.currentVoteDirection === VoteDirection.up)
			this.voteUpButton.unVote()
		else if (this.currentVoteDirection === VoteDirection.down)
			this.voteDownButton.unVote();

		this.currentVoteDirection = voteDirection;

		if (this.currentVoteDirection === VoteDirection.up)
			this.voteUpButton.vote(isAnimated)
		else if (this.currentVoteDirection === VoteDirection.down)
			this.voteDownButton.vote(isAnimated);
	}

	async toggleSave(data: DropDownActionData) {
		this.isSaved = !this.isSaved;
		data.source.setLabel(this.isSaved ? "Unsave" : "Save");
		data.source.setLabelImg(this.isSaved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg");
		if (!await save(this)) {
			console.error(`error voting on post ${this.fullName}`);
			new Ph_Toast(Level.error, "Error saving post");
		}
	}

	share(data: DropDownActionData) {
		switch (data.valueChain[1]) {
			case "post link":
				navigator.clipboard.writeText(location.origin + this.link);
				break;
			case "reddit link":
				navigator.clipboard.writeText(`https://www.reddit.com${this.link}`);
				break;
			case "link":
				if (this.url)
					navigator.clipboard.writeText(this.url);
				break;
			default:
				throw "Invalid share type";
				
		}
	}

	editPost() {
		const postText = this.postBody.children[0] as Ph_PostText;
		postText.startEditing();
	}

	deletePostPrompt(data: DropDownActionData) {
		new Ph_Toast(
			Level.warning,
			"Are you sure you want to delete this post?",
			{ onConfirm: this.deletePost.bind(this, data.source) }
		);
	}

	async deletePost(dropDownEntry: Ph_DropDownEntry) {
		const resp = await deleteThing(this);

		if (!isObjectEmpty(resp) || resp["error"]) {
			console.error("Error deleting post");
			console.error(resp);
			new Ph_Toast(Level.error, "Error deleting post");
			return;
		}

		this.postBody.innerText = "[deleted]";
		this.postBody.className = "content padded";

		Array.from(dropDownEntry.parentElement.children)		// remove all dropdown entries that have delete or edit in the text
			.filter((entry: HTMLElement) => /delete|edit/i.test(entry.textContent))
			.forEach(entry => entry.remove());

		new Ph_Toast(Level.success, "Deleted post", { timeout: 2000 });
	}

	async toggleNsfw (data: DropDownActionData) {
		const success = await setPostNsfw(this.fullName, !this.isNsfw);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing nsfw", { timeout: 2500 });
			return;
		}
		this.isNsfw = !this.isNsfw;
		this.classList.toggle("nsfw", this.isNsfw);
		data.source.setLabel(this.isNsfw ? "Unmark NSFW" : "Mark NSFW");
	}

	async toggleSpoiler (data: DropDownActionData) {
		const success = await setPostSpoiler(this.fullName, !this.isSpoiler);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing spoiler", { timeout: 2500 });
			return;
		}
		this.isSpoiler = !this.isSpoiler;
		this.classList.toggle("spoiler", this.isSpoiler);
		data.source.setLabel(this.isSpoiler ? "Unmark Spoiler" : "Mark Spoiler");
	}

	async toggleSendReplies (data: DropDownActionData) {
		const success = await setPostSendReplies(this.fullName, !this.sendReplies);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing send replies", { timeout: 2500 });
			return;
		}
		this.sendReplies = !this.sendReplies;
		data.source.setLabel(`${this.sendReplies ? "Disable" : "Enable"} Reply Notifications`);
	}

	async onEditFlairClick(data: DropDownActionData) {
		if (this.haveFlairsLoaded)
			return;
		this.haveFlairsLoaded = true;
		const sub = this.permalink.match(/(?<=\/\w+\/)[^/?#]+/)[0];		// /r/sub/top? --> sub
		const flairs: FlairApiData[] = await getSubFlairs("/r/" + sub);
		const flairSelection: DropDownEntryParam[] = flairs.map(flair => {
			const flairElem = Ph_Flair.fromFlairApi(flair);
			return {
				label: flairElem,
				value: { flair: flairElem, sub },
				onSelectCallback: this.selectFlair.bind(this)
			};
		});
		data.source.nextDropDown.setEntries(flairSelection, data.source.dropDown);
	}

	async selectFlair(data: DropDownActionData) {
		const { flair, sub } = data.valueChain[2];
		if ((flair as Ph_Flair).isEditing)
			return;

		const success = await setPostFlair(this.fullName, sub, flair);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing post flair");
			return;
		}

		const newPostData: RedditApiType[] = await redditApiRequest(this.permalink, [["limit", "1"]], true);
		const postData = newPostData[0].data.children[0].data;
		const newFlair = Ph_Flair.fromThingData(postData, "link");
		this.postFlair.insertAdjacentElement("afterend", newFlair);
		this.postFlair.remove();
		this.postFlair = newFlair;
	}

	crossPost() {
		new Ph_Toast(Level.info, "Currently not supported", { timeout: 5000 });
	}
}

customElements.define("ph-post", Ph_Post);
