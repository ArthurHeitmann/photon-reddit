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
} from "../../api/redditApi";
import {pushLinkToHistoryComb, PushType} from "../../historyState/historyStateManager";
import ViewsStack from "../../historyState/viewsStack";
import {PhEvents} from "../../types/Events";
import {FlairApiData, RedditApiObj, RedditListingObj, RedditPostData, RedditPostObj} from "../../types/redditTypes";
import {$css, emojiFlagsToImages, escADQ, escHTML, getLoadingIcon} from "../../utils/htmlStatics";
import {linksToSpa} from "../../utils/htmlStuff";
import {
	escRegex,
	getFullscreenElement,
	getPostIdFromUrl,
	getSubredditIconUrl,
	hasParams,
	isObjectEmpty,
	makeElement,
	numberToShort as numberToShort,
	timePassedSince
} from "../../utils/utils";
import Ph_FeedItem from "../feed/feedItem/feedItem";
import Ph_PhotonSettings, {NsfwPolicy, PhotonSettings} from "../global/photonSettings/photonSettings";
import Ph_AwardsInfo from "../misc/awardsInfo/awardsInfo";
import Ph_DropDown, {DirectionX, DirectionY} from "../misc/dropDown/dropDown";
import Ph_DropDownEntry, {DropDownActionData, DropDownEntryParam} from "../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Flair from "../misc/flair/flair";
import Ph_Toast, {Level} from "../misc/toast/toast";
import Ph_VoteButton from "../misc/voteButton/voteButton";
import Users from "../../multiUser/userManagement";
import Ph_PostBody from "./postBody/postBody";
import Ph_PostText from "./postBody/postText/postText";
import PostDoubleLink from "./postDoubleLink/postDoubleLink";

interface PostOptionalParams {
	isInFeed?: boolean,
	feedUrl?: string,
	preferSmallerPost?: boolean
}

/**
 * A reddit post
 */
export default class Ph_Post extends Ph_FeedItem {
	private actionBar: HTMLDivElement;
	private voteUpButton: Ph_VoteButton;
	private currentUpvotes: HTMLDivElement;
	private voteDownButton: Ph_VoteButton;
	private feedUrl: string;
	private cover: HTMLElement = null;
	private totalVotes: number;
	private currentVoteDirection: VoteDirection;
	private postBody: Ph_PostBody;
	data: RedditPostData;
	private wasInitiallySeen: boolean;
	private doubleLink: PostDoubleLink = null;
	private haveFlairsLoaded = false;
	private postFlair: Ph_Flair;
	private preferSmallerPost: boolean;

	constructor(postData: RedditPostObj, optionalParams: PostOptionalParams = {}) {
		const {
			isInFeed = false,
			feedUrl = undefined,
			preferSmallerPost = false,
		} = optionalParams;

		super(postData?.data.name, postData?.data.permalink, isInFeed);
		if (!hasParams(arguments)) return;

		if (postData.kind !== "t3")
			throw "Invalid comment data type";

		this.data = postData.data;
		this.currentVoteDirection = voteDirectionFromLikes(postData.data.likes);
		this.totalVotes = postData.data.ups + -parseInt(this.currentVoteDirection);
		this.feedUrl = feedUrl;
		this.wasInitiallySeen = Users.global.hasPostsBeenSeen(this.data.name);
		this.preferSmallerPost = preferSmallerPost;
		this.classList.add("post");

		if (isInFeed)
			this.isCleanupProtected = true;
		this.addWindowEventListener(PhEvents.settingsChanged, this.onSettingsChanged.bind(this));

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

		this.postBody = new Ph_PostBody(undefined, preferSmallerPost);
		if (!isInFeed)
			this.initPostBody();

		// additional actions drop down
		const dropDownEntries: DropDownEntryParam[] = [
			{
				label: this.data.saved ? "Unsave" : "Save",
				labelImgUrl: this.data.saved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg",
				onSelectCallback: this.toggleSave.bind(this)
			},
			{
				label: "Filter out",
				labelImgUrl: "/img/filter.svg",
				nestedEntries: [
					{ label: "Filter out...", labelImgUrl: "/img/filter.svg" },
					{ label: ` r/${this.data.subreddit}`, labelImgUrl: "/img/rSlash.svg", onSelectCallback: () => this.addToFilters("subredditBlacklist", this.data.subreddit) },
					{ label: ` u/${this.data.author}`, labelImgUrl: "/img/user.svg", onSelectCallback: () => this.addToFilters("userBlacklist", this.data.author)},
				]
			},
			{ label: "Share", labelImgUrl: "/img/share.svg", nestedEntries: [
					{ label: "Copy Post Link", value: "post link", onSelectCallback: this.share.bind(this) },
					{ label: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
					{ label: "Copy Link", value: "link", onSelectCallback: this.share.bind(this) },
					// { label: "Crosspost", onSelectCallback: this.crossPost.bind(this) },
			] }
		];
		this.postFlair = Ph_Flair.fromThingData(postData.data, "link");
		if (Users.current.name === postData.data.author) {
			const editEntries: DropDownEntryParam[] = [];
			if (postData.data.is_self)
				editEntries.push({ label: "Edit Text", labelImgUrl: "/img/text.svg", onSelectCallback: this.editPost.bind(this) });
			editEntries.push({ label: this.data.over_18 ? "Unmark NSFW" : "Mark NSFW", labelImgUrl: "/img/18+.svg", onSelectCallback: this.toggleNsfw.bind(this) });
			editEntries.push({ label: this.data.spoiler ? "Unmark Spoiler" : "Mark Spoiler", labelImgUrl: "/img/warning.svg", onSelectCallback: this.toggleSpoiler.bind(this) });
			editEntries.push({ label: `${this.data.send_replies ? "Disable" : "Enable"} Reply Notifications`, labelImgUrl: "/img/notification.svg", onSelectCallback: this.toggleSendReplies.bind(this) });
			if (!this.postFlair.classList.contains("empty")) {
				editEntries.push({ label: "Change Flair", labelImgUrl: "/img/tag.svg", onSelectCallback: this.onEditFlairClick.bind(this), nestedEntries: [
					{ label: getLoadingIcon() }
				]});
			}
			dropDownEntries.push({ label: "Edit", labelImgUrl: "/img/edit.svg", nestedEntries: editEntries });
			dropDownEntries.push({ label: "Delete", labelImgUrl: "/img/delete.svg", onSelectCallback: this.deletePostPrompt.bind(this) });
		}
		if (postData.data.num_crossposts > 0) {
			dropDownEntries.push({ label:
				makeElement(
					"a",
					{ href: `${this.data.permalink.replace("comments", "duplicates")}`, class: "noStyle" },
					`View ${postData.data.num_crossposts} Crossposts`
				),
				labelImgUrl: "/img/shuffle.svg"
			});
		}
		const moreDropDown = new Ph_DropDown(dropDownEntries, "", DirectionX.left, DirectionY.bottom, true);
		moreDropDown.toggleButton.classList.add("transparentButtonAlt");
		actionWrapper.append(moreDropDown);
		// go to comments link
		const commentsLink = document.createElement("a");
		commentsLink.className = "commentsLink transparentButtonAlt";
		commentsLink.href = this.data.permalink;
		commentsLink.setAttribute("data-tooltip", postData.data.num_comments.toString());
		const numbOfComments = numberToShort(postData.data.num_comments);
		let commentsSizeClass = "";
		if (numbOfComments.length > 3)
			commentsSizeClass = " small";
		else if (numbOfComments.length === 3)
			commentsSizeClass = "medium";
		commentsLink.innerHTML = `
			<img alt="comments" src="/img/comments.svg">
			<div class="${commentsSizeClass}">${numbOfComments}</div>
		`;
		actionWrapper.append(commentsLink);

		const isLocked = postData.data.locked || postData.data.archived;
		const lockedReason = postData.data.locked ? "Locked" : "Archived";
		let userAdditionClasses = "";
		if (postData.data.distinguished === "moderator") {
			userAdditionClasses += " mod";
		}
		else if (postData.data.distinguished === "admin") {
			userAdditionClasses += " admin";
		}
		const subredditIconUrl = postData.data.sr_detail && getSubredditIconUrl(postData.data.sr_detail, false);
		const mainPart = document.createElement("div");
		mainPart.className = "w100";
		mainPart.innerHTML = `
			<div class="header">
				<div class="top flex">
					${ this.data.stickied ? `<img class="pinned" src="/img/pin.svg" alt="pinned" draggable="false">` : "" }
					<a href="/${escADQ(postData.data.subreddit_name_prefixed)}" class="subreddit">
						${subredditIconUrl ? `<img src="${escADQ(subredditIconUrl)}" alt="${postData.data.subreddit}" class="srIcon">` : ""}
						<span>${escHTML(postData.data.subreddit_name_prefixed)}</span>
					</a>
					<span>Posted by</span>
					<a href="/user/${escADQ(postData.data.author)}" class="user${userAdditionClasses}">
						<span>u/${escHTML(postData.data.author)}</span>
						${ postData.data.author_cakeday ? `<img src="/img/cake.svg" class="cakeDay" alt="cake day">` : "" }
					</a>
					<span class="time" data-tooltip="${new Date(postData.data.created_utc * 1000).toString()}">${timePassedSince(postData.data.created_utc)}</span>
					<span>ago</span>
					${ postData.data.edited
					? `	<span>|</span><span>edited</span> 
						<span class="time" data-tooltip="${new Date(postData.data.edited * 1000).toString()}">${timePassedSince(postData.data.edited)}</span>
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
					<div class="title">${escHTML(this.data.title)}</div>
				</div>
			</div>
		`;
		emojiFlagsToImages(mainPart);
		if (postData.data.all_awardings && postData.data.all_awardings.length > 0)
			mainPart.$class("flairWrapper")[0].insertAdjacentElement("beforebegin", new Ph_AwardsInfo(postData.data.all_awardings));
		if (postData.data.crosspost_parent_list?.length > 0) {
			const crosspostData = postData.data.crosspost_parent_list[0];
			const miniPost = document.createElement("div");
			miniPost.className = "miniPost";
			miniPost.innerHTML = `
				<a href="${escADQ(crosspostData.permalink)}" class="miniBackgroundLink"></a>
				<div class="postSummary">
					<div class="leftItems">
						<div>
							<img src="/img/downArrow.svg" class="votesImg" alt="votes">
							<span>${numberToShort(crosspostData.ups)}</span>
						</div>
						<div>
							<img src="/img/comments.svg" class="commentsImg" alt="comments">
							<span>${numberToShort(crosspostData.num_comments)}</span>
						</div>
						
					</div>
					<div>
						<div class="info">
							<span>Crossposted from</span>
							<a href="/${escADQ(crosspostData.subreddit_name_prefixed)}" class="subreddit">
								<span>${escHTML(crosspostData.subreddit_name_prefixed)}</span>
							</a>
							<span>by</span>
							<a href="/user/${escADQ(crosspostData.author)}" class="user">
								<span>u/${escHTML(crosspostData.author)}</span>
								${ crosspostData.author_cakeday ? `<img src="/img/cake.svg" class="cakeDay" alt="cake day">` : "" }
							</a>
							<span class="time" data-tooltip="${new Date(crosspostData.created_utc * 1000).toString()}">${timePassedSince(crosspostData.created_utc)}</span>
							<span>ago</span>
							${ crosspostData.edited
								? `	<span>|</span><span>edited</span> 
									<span class="time" data-tooltip="${new Date(crosspostData.edited * 1000).toString()}">${timePassedSince(crosspostData.edited)}</span>
									<span>ago</span>`
								: ""
							}
						</div>
						<div class="title">${emojiFlagsToImages(escHTML(crosspostData.title))}</div>
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
		if (this.data.over_18)
			this.classList.add("nsfw");
		makeFlair("darkred", "NSFW");
		if (this.data.spoiler)
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

		if (this.shouldPostBeHidden())
			this.classList.add("remove");

		if (!this.postBody.isInitialized)
			this.addEventListener(PhEvents.almostVisible, this.initPostBody.bind(this), {once: true});
	}

	initPostBody() {
		try {
			this.postBody.init(this.data, this.preferSmallerPost);
		}
		catch (e) {
			console.error(`Error making post for ${this.data.permalink}`);
			console.error(e);
			new Ph_Toast(Level.error, "Error making post");
		}
		if (
			(this.data.spoiler || this.data.over_18 && Users.global.d.photonSettings.nsfwPolicy === NsfwPolicy.covered) &&
			!this.cover && this.isInFeed && !this.isEmpty()
		) {
			this.postBody.classList.add("covered");
			this.cover = this.postBody.appendChild(this.makeContentCover());
		}
		else
			this.cover = null;
	}

	private isEmpty(): boolean {
		return this.postBody.innerHTML === "" || this.postBody.$css(".postText > *:empty").length > 0
	}

	onIsOnScreen() {
		const focusableChild = this.$css("[tabindex]") as HTMLCollectionOf<HTMLElement>;
		// post became visible
		if (focusableChild.length > 0)
			focusableChild[0].focus({ preventScroll: true });
	}

	onIsOffScreen() {
		const focusableChild = this.$css("[tabindex]") as HTMLCollectionOf<HTMLElement>;
		if (focusableChild.length > 0 && !getFullscreenElement())
			focusableChild[0].blur();
	}

	private onSettingsChanged(e: CustomEvent) {
		const changed: PhotonSettings = e.detail;
		this.classList.toggle("remove", this.shouldPostBeHidden(changed));

		const nsfwPolicy: NsfwPolicy = changed.nsfwPolicy;
		if (!nsfwPolicy)		// this setting hasn't been changed
			return;
		if (this.cover && !this.data.spoiler && changed.nsfwPolicy !== undefined)
			this.cover.click();
		if (this.data.over_18 && nsfwPolicy === NsfwPolicy.covered && this.isInFeed && !this.isEmpty()) {		// add cover
			this.postBody.classList.add("covered");
			this.cover = this.postBody.appendChild(this.makeContentCover());
		}
	}

	shouldPostBeHidden(changedSettings?: PhotonSettings): boolean {
		// This is a solution with the best UX and least unexpected hidden posts
		const isInUserFeed = /^\/(u|user)\/([^/]+\/?){1,2}$/i.test(this.feedUrl);	// matches /u/user/submitted or /user/x/saved; 1, 2 to exclude multireddits /user/x/m/multi
		if (changedSettings === undefined) {
			return (
				!this.data.stickied && Users.global.d.photonSettings.hideSeenPosts && !isInUserFeed && Users.global.hasPostsBeenSeen(this.data.name)
				|| this.data.over_18 && Users.global.d.photonSettings.nsfwPolicy === NsfwPolicy.never
				|| this.shouldPostBeFiltered()
			);
		}
		else {
			if (this.data.over_18 && Users.global.d.photonSettings.nsfwPolicy === NsfwPolicy.never)
				return true;
			if (this.shouldPostBeFiltered())
				return true;
			if (this.data.stickied)
				return false;
			if (changedSettings.hideSeenPosts !== undefined)
				return changedSettings.hideSeenPosts && !isInUserFeed && this.wasInitiallySeen && Users.global.hasPostsBeenSeen(this.data.name);
			return this.wasInitiallySeen && Users.global.d.photonSettings.hideSeenPosts;
		}
	}

	private shouldPostBeFiltered() {
		return Users.global.d.photonSettings.subredditBlacklist.some(entry => entry.toLowerCase() === this.data.subreddit.toLowerCase()) && !new RegExp(`/r/${this.data.subreddit}([/?#]|$)`, "i").test(this.feedUrl)
			|| Users.global.d.photonSettings.userBlacklist.some(entry => entry.toLowerCase() === this.data.author.toLowerCase()) && !new RegExp(`/(u|user)/${this.data.author}([/?#]|$)`, "i").test(this.feedUrl)
			|| Users.global.d.photonSettings.tileTextBlacklist.length > 0 && new RegExp(Users.global.d.photonSettings.tileTextBlacklist.map(t => escRegex(t)).join("|"), "i").test(this.data.title)
			|| Users.global.d.photonSettings.flairTextBlacklist.length > 0 && new RegExp(Users.global.d.photonSettings.flairTextBlacklist.map(t => escRegex(t)).join("|"), "i").test(this.postFlair.textContent);
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

	updateWithData(postData: RedditPostData) {
		this.totalVotes = postData.ups + -parseInt(this.currentVoteDirection);
		this.setVotesState(this.currentVoteDirection);
		const commentsText = this.$css(".commentsLink div")[0] as HTMLElement;
		const numCommentsStr = numberToShort(postData.num_comments);
		commentsText.innerText = numCommentsStr;
		commentsText.classList.remove("small");
		commentsText.classList.remove("medium");
		let commentsSizeClass = "";
		if (numCommentsStr.length > 3)
			commentsSizeClass = "small";
		else if (numCommentsStr.length === 3)
			commentsSizeClass = "medium";
		commentsText.classList.add(commentsSizeClass);
	}

	async vote(dir: VoteDirection): Promise<void> {
		const prevDir = this.currentVoteDirection;
		this.setVotesState(dir === this.currentVoteDirection ? VoteDirection.none : dir);
		const res = await vote(this.data.name, this.currentVoteDirection);
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
		this.currentUpvotes.setAttribute("data-tooltip", `${(this.totalVotes + parseInt(voteDirection)).toString()}🠉 — ${Math.round(this.data.upvote_ratio * 100)}%`);

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
		this.data.saved = !this.data.saved;
		data.source.setLabel(this.data.saved ? "Unsave" : "Save");
		data.source.setLabelImg(this.data.saved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg");
		if (!await save(this.data.name, this.data.saved)) {
			console.error(`error voting on post ${this.data.name}`);
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
				if (this.data.url)
					navigator.clipboard.writeText(this.data.url);
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
		const resp = await deleteThing(this.data.name);

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
		const success = await setPostNsfw(this.data.name, !this.data.over_18);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing nsfw", { timeout: 2500 });
			return;
		}
		this.data.over_18 = !this.data.over_18;
		this.classList.toggle("nsfw", this.data.over_18);
		data.source.setLabel(this.data.over_18 ? "Unmark NSFW" : "Mark NSFW");
	}

	async toggleSpoiler (data: DropDownActionData) {
		const success = await setPostSpoiler(this.data.name, !this.data.spoiler);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing spoiler", { timeout: 2500 });
			return;
		}
		this.data.spoiler = !this.data.spoiler;
		this.classList.toggle("spoiler", this.data.spoiler);
		data.source.setLabel(this.data.spoiler ? "Unmark Spoiler" : "Mark Spoiler");
	}

	async toggleSendReplies (data: DropDownActionData) {
		const success = await setPostSendReplies(this.data.name, !this.data.send_replies);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing send replies", { timeout: 2500 });
			return;
		}
		this.data.send_replies = !this.data.send_replies;
		data.source.setLabel(`${this.data.send_replies ? "Disable" : "Enable"} Reply Notifications`);
	}

	async onEditFlairClick(data: DropDownActionData) {
		if (this.haveFlairsLoaded)
			return;
		this.haveFlairsLoaded = true;
		const sub = this.data.permalink.match(/\/\w+\/([^/?#]+)/)[1];		// /r/sub/top? --> sub
		const flairs: FlairApiData[] = await getSubFlairs("/r/" + sub);
		const flairSelection: DropDownEntryParam[] = flairs.map(flair => {
			const flairElem = Ph_Flair.fromFlairApi(flair);
			return {
				label: flairElem,
				value: { flair: flairElem, sub },
				onSelectCallback: this.selectFlair.bind(this)
			};
		});
		data.source.nextDropDown.setEntries(flairSelection);
	}

	async selectFlair(data: DropDownActionData) {
		const { flair, sub } = data.valueChain[2];
		if ((flair as Ph_Flair).isEditing)
			return;

		const success = await setPostFlair(this.data.name, sub, flair);
		if (!success) {
			new Ph_Toast(Level.error, "Error changing post flair");
			return;
		}

		const newPostData: RedditListingObj<RedditApiObj>[] = await redditApiRequest(this.data.permalink, [["limit", "1"]], true);
		const postData = newPostData[0].data.children[0].data;
		const newFlair = Ph_Flair.fromThingData(postData, "link");
		this.postFlair.insertAdjacentElement("afterend", newFlair);
		this.postFlair.remove();
		this.postFlair = newFlair;
	}

	crossPost() {
		new Ph_Toast(Level.info, "Currently not supported", { timeout: 5000 });
	}

	private addToFilters(key: keyof PhotonSettings, entry: string) {
		const newList = [...Users.global.d.photonSettings[key] as string[]];
		newList.push(entry);
		const settings = $css(".photonSettings")[0] as Ph_PhotonSettings;
		settings.setSettingTo(key, newList);
	}
}

customElements.define("ph-post", Ph_Post);
