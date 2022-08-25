import {
	deleteThing,
	edit,
	loadMoreComments,
	save,
	vote,
	VoteDirection,
	voteDirectionFromLikes
} from "../../api/redditApi";
import {PhEvents} from "../../types/Events";
import {RedditCommentData, RedditCommentObj, RedditMessageObj, RedditMoreCommentsObj} from "../../types/redditTypes";
import {$css, emojiFlagsToImages} from "../../utils/htmlStatics";
import {addRedditEmojis, elementWithClassInTree, linksToSpa} from "../../utils/htmlStuff";
import {
	commentsToTree,
	hasParams,
	isCommentDeleted,
	isObjectEmpty,
	makeElement,
	numberToShort,
	timePassedSince,
	timePassedSinceStr
} from "../../utils/utils";
import Ph_CommentsFeed from "../feed/commentsFeed/commentsFeed";
import Ph_Readable from "../feed/feedItem/readable/readable";
import Ph_AwardsInfo from "../misc/awardsInfo/awardsInfo";
import Ph_DropDown, {DirectionX, DirectionY} from "../misc/dropDown/dropDown";
import Ph_DropDownEntry, {DropDownActionData, DropDownEntryParam} from "../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Flair from "../misc/flair/flair";
import Ph_CommentForm from "../misc/markdownForm/commentForm/commentForm";
import Ph_MarkdownForm from "../misc/markdownForm/markdownForm";
import Ph_Toast, {Level} from "../misc/toast/toast";
import Ph_VoteButton from "../misc/voteButton/voteButton";
import Users from "../../multiUser/userManagement";
import Ph_Post from "../post/post";
import Ph_PhotonSettings from "../global/photonSettings/photonSettings";
import {PhotonSettings} from "../global/photonSettings/settingsConfig";
import {getCommentFromPushshift, getCommentRepliesFromPushshift} from "../../api/pushshiftApi";

/**
 * A comment that has been posted under a post
 *
 * Can be displayed with a post or detached without
 */
export default class Ph_Comment extends Ph_Readable {
	voteUpButton: Ph_VoteButton;
	currentUpvotes: HTMLElement;
	upvotesCollapsedOnly: HTMLElement;
	voteDownButton: Ph_VoteButton;
	replyForm: Ph_CommentForm;
	childComments: HTMLElement;
	data: RedditCommentData;
	totalVotes: number;
	fullName: string;
	username: string;
	isPinned: boolean;
	currentVoteDirection: VoteDirection;
	isSaved: boolean;
	postFullName: string;
	bodyMarkdown: string;
	editForm: Ph_MarkdownForm;

	/**
	 * @param commentData Data returned by the reddit API
	 * @param isChild false --> root comment
	 * @param isInFeed true --> child of Ph_UniversalFeed, false --> child of Ph_PostAndComments|Ph_CommentsFeed
	 * @param post parent post if available should be supplied (needed to load possible child comments)
	 */
	constructor(commentData: RedditCommentObj | RedditMoreCommentsObj | RedditMessageObj, isChild: boolean, isInFeed: boolean, post?: Ph_Post) {
		super(
			commentData?.data.name,
			commentData?.data["permalink"] ? commentData?.data["permalink"] + "?context=3" : commentData?.data["context"],
			isInFeed,
			commentData ? "first_message" in commentData.data : false,
			!Boolean(commentData?.data["new"])
		);
		if (!hasParams(arguments)) return;

		this.classList.add("comment");
		if (!isChild)
			this.classList.add("rootComment");

		this.data = commentData.data as RedditCommentData;
		this.username = (commentData.data as RedditCommentData)?.author || "";
		this.isPinned = commentData.data["stickied"];

		// this is not a comment, this is a load more comments button
		if (commentData.kind === "more") {
			const loadMoreButton = makeElement("button", { class: "loadMoreButton button light" }) as HTMLButtonElement;
			this.append(loadMoreButton);

			// continue thread button/link
			if (commentData.data.children.length === 0) {
				loadMoreButton.append(makeElement("a", { href: `${post.data.permalink}${commentData.data.parent_id.slice(3)}` }, "Continue thread"));
				linksToSpa(loadMoreButton);
			}
			// load n more comments button
			else {
				this.postFullName = post.data.name;
				const moreId = commentData.data.name;
				const loadMoreBtnText: string = `Load more (${commentData.data.count})`;
				loadMoreButton.innerText = loadMoreBtnText;
				let nextChildren = commentData.data.children;
				loadMoreButton.addEventListener("click", async () => {
					loadMoreButton.disabled = true;
					loadMoreButton.innerHTML = `<img src="/img/loading3.svg" alt="loading">`;
					try {
						const loadedComments = await this.loadMoreComments(nextChildren, moreId);

						if (this.parentElement instanceof Ph_CommentsFeed) {
							this.parentElement.addPendingComments(loadedComments);
						}
						else {
							for (const comment of loadedComments) {
								this.insertAdjacentElement("beforebegin",
									new Ph_Comment(comment, isChild, isInFeed, post));
							}
						}
						this.remove();
					} catch (e) {
						console.error("Error loading more comments");
						console.error(e);
						new Ph_Toast(Level.error, "Error loading more comments");
						loadMoreButton.disabled = false;
						loadMoreButton.innerText = loadMoreBtnText;
					}
				});
			}
			return;
		}
		else if (commentData.kind !== "t1") {
			new Ph_Toast(Level.error, "Error occurred while making comment");
			throw "Invalid comment data type";
		}

		// set this properties
		this.bodyMarkdown = commentData.data.body;

		this.fullName = commentData.data.name;
		this.currentVoteDirection = voteDirectionFromLikes(commentData.data.likes);
		this.totalVotes = parseInt(commentData.data["ups"] ?? 0) + -parseInt(this.currentVoteDirection);
		this.isSaved = "saved" in commentData.data ? commentData.data.saved : false;

		// if this is currently a root comment with a parent id (so not actually the root), create button to view parent comments
		if (!isInFeed && !isChild && commentData.data.parent_id && commentData.data.parent_id.slice(0, 3) === "t1_") {
			setTimeout(() =>
				(elementWithClassInTree(this.parentElement, "commentsFeed") as Ph_CommentsFeed)
					.insertParentLink(`${post.data.permalink}${commentData.data.parent_id.slice(3)}?context=3`, "Load parent comment")
				, 0)
		}

		// HTML elements

		// actions bar
		const actionBar = makeElement("div", { class: "actions" });
		this.appendChild(actionBar);
		// vote up button
		this.voteUpButton = new Ph_VoteButton(true);
		this.voteUpButton.addEventListener("click", () => this.vote(VoteDirection.up));
		actionBar.appendChild(this.voteUpButton);
		// current votes
		actionBar.append(this.currentUpvotes = makeElement("div", { class: "upvotes" }));
		// vote down button
		this.voteDownButton = new Ph_VoteButton(false);
		this.voteDownButton.addEventListener("click", () => this.vote(VoteDirection.down));
		actionBar.appendChild(this.voteDownButton);
		// additional actions drop down
		const isLocked = commentData.data["locked"] || commentData.data["archived"] || false;
		const lockedReason = commentData.data["locked"] ? "Locked" : "Archived";
		let dropDownParams: DropDownEntryParam[] = [];
		if (!isLocked)
			dropDownParams.push({ label: "Reply", labelImgUrl: "/img/commentEmpty.svg", onSelectCallback: this.showReplyForm.bind(this) });
		if (commentData.data.author === Users.current.name) {
			this.setupEditForm();
			dropDownParams.push({ label: "Edit", labelImgUrl: "/img/edit.svg", onSelectCallback: this.editStart.bind(this) });
			dropDownParams.push({ label: "Delete", labelImgUrl: "/img/delete.svg", onSelectCallback: this.deletePrompt.bind(this) });
		}
		dropDownParams.push(...[
			{
				label: this.isSaved ? "Unsave" : "Save",
				labelImgUrl: this.isSaved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg",
				onSelectCallback: this.toggleSave.bind(this)
			},
			{
				label: "Filter out",
				labelImgUrl: "/img/filter.svg",
				nestedEntries: [
					{ label: "Filter out...", labelImgUrl: "/img/filter.svg" },
					{ label: ` u/${this.username}`, labelImgUrl: "/img/user.svg", onSelectCallback: () => this.filterUserComments()},
				]
			},
			{ label: "Share", labelImgUrl: "/img/share.svg", nestedEntries: [
					{ label: "Copy Comment Link", value: "comment link", onSelectCallback: this.share.bind(this) },
					{ label: "Copy Reddit Link", value: "reddit link", onSelectCallback: this.share.bind(this) },
				]
			}
		]);
		const moreDropDown = new Ph_DropDown(dropDownParams, "", DirectionX.left, DirectionY.bottom, true);
		moreDropDown.toggleButton.classList.add("transparentButton");
		actionBar.appendChild(moreDropDown);
		// comment collapser
		const commentCollapser = makeElement("div", { class: "commentCollapser" }, [makeElement("div")]);
		commentCollapser.addEventListener("click", () => this.collapse());
		actionBar.appendChild(commentCollapser);

		// special user distinctions
		let userAdditionClasses = "";
		if (commentData.data["is_submitter"])
			userAdditionClasses += " op";
		if (commentData.data.distinguished === "moderator")
			userAdditionClasses += " mod";
		else if (commentData.data.distinguished === "admin")
			userAdditionClasses += " admin";

		const mainPart = makeElement("div", { class: "w100" }, [
			makeElement("div", { class: "header flex" }, [
				this.isPinned && makeElement("img", { class: "pinned", src: "/img/pin.svg", alt: "pinned", draggable: "false" }),
				makeElement("a", { href: `/user/${commentData.data.author}`, class: `user${userAdditionClasses}` }, [
					makeElement("span", null, `u/${commentData.data.author}`),
					commentData.data["author_cakeday"] && makeElement("img", { src: "/img/cake.svg", class: "cakeDay", alt: "cake day" }),
					commentData.data["controversiality"] === 1 && makeElement("div", { class: "controversial", "data-tooltip": "Controversial" })
				]),
				this.upvotesCollapsedOnly = makeElement("span", { class: "upvotesCollapsedOnly" }),
				makeElement(
					"span",
					{ class: "time", "data-tooltip": `${new Date(commentData.data.created_utc * 1000).toString()}` },
					timePassedSince(commentData.data.created_utc)
				),
				makeElement("span", null, "ago"),
					...(commentData.data["edited"] ? [
					makeElement("span", null, "|"),
					makeElement("span", null, "edited"),
					makeElement("span", { class: "time", "data-tooltip": `${new Date(commentData.data["edited"] * 1000).toString()}` }, timePassedSinceStr(commentData.data["edited"])),
					makeElement("span", null, "ago"),
				] : []),
				isLocked && makeElement(
					"span",
					{ class: "locked", "data-tooltip": lockedReason },
					[makeElement("img", { "src": "/img/locked.svg", alt: "locked" })]
				)
			]),
			makeElement("div", { class: "content" }, commentData.data.body_html, true),
			isCommentDeleted(commentData.data as RedditCommentData) &&
				makeElement("button", { class: "loadPushshiftBtn", onclick: this.loadPushshiftVersion.bind(this) }, "Load Archived Version"),
		]);

		this.setVotesState(this.currentVoteDirection);
		emojiFlagsToImages(mainPart);
		addRedditEmojis(mainPart.$class("content")[0], commentData.data as RedditCommentData);
		if (commentData.data["all_awardings"] && commentData.data["all_awardings"].length > 0) {
			const nonLocked = mainPart.$css(".header > :not(.locked)");
			nonLocked[nonLocked.length - 1].insertAdjacentElement("afterend", new Ph_AwardsInfo(commentData.data["all_awardings"]));
		}

		// user flair
		mainPart.$class("user")[0]
			.insertAdjacentElement("afterend", Ph_Flair.fromThingData(commentData.data, "author"));

		// child comments
		mainPart.appendChild(this.childComments = makeElement("div", { class: "replies" }));

		// reply form
		if (!isLocked) {
			this.replyForm = new Ph_CommentForm(this.fullName, true);
			this.replyForm.classList.add("replyForm")
			this.replyForm.addEventListener(PhEvents.commentSubmitted, (e: CustomEvent) => {
				this.replyForm.insertAdjacentElement("afterend",
					new Ph_Comment(e.detail, true, false, post));
				this.classList.remove("isReplying");
			});
			this.replyForm.addEventListener(PhEvents.cancel, () => this.classList.remove("isReplying"));

			this.childComments.appendChild(this.replyForm);
		}

		if (commentData.data.replies && commentData.data.replies.data.children) {
			for (const comment of commentData.data.replies.data.children) {
				this.childComments.appendChild(new Ph_Comment(comment, true, false, post));
			}
		}

		this.addWindowEventListener(PhEvents.settingsChanged, (e: CustomEvent) => this.onSettingsChanged(e.detail));
		this.onSettingsChanged(Users.global.d.photonSettings);

		this.appendChild(mainPart);

		linksToSpa(this, true);
	}

	collapse() {
		const shouldAdjustScroll = this.getBoundingClientRect().top < 0;
		this.classList.toggle("isCollapsed");

		if (shouldAdjustScroll)
			document.scrollingElement.scrollBy(0, this.getBoundingClientRect().top);
	}

	showReplyForm() {
		this.classList.add("isReplying");
	}

	async loadMoreComments(children: string[], id: string): Promise<RedditCommentObj[]> {
		const childData = await loadMoreComments(
			children,
			this.postFullName,
			(elementWithClassInTree(this.parentElement, "commentsFeed") as Ph_CommentsFeed).sort
			, id
		);

		// reddit returns here just an array of all comments, regardless whether they are parents/children of each other
		// therefore we have to assemble the comment tree with all the relations ourselves -_-
		return commentsToTree(childData.json.data.things as RedditCommentObj[]);
	}

	async vote(dir: VoteDirection): Promise<void> {
		const prevDir = this.currentVoteDirection;
		this.setVotesState(dir === this.currentVoteDirection ? VoteDirection.none : dir);
		const res = await vote(this.fullName, this.currentVoteDirection);
		if (!res) {
			console.error("Error voting on post");
			this.setVotesState(prevDir);
			new Ph_Toast(Level.error, "Error occurred while voting");
		}
	};

	setVotesState(voteDirection: VoteDirection) {
		const votesText = numberToShort(this.totalVotes + parseInt(voteDirection));
		this.currentUpvotes.innerText = votesText;
		this.upvotesCollapsedOnly.innerText = `${votesText} 🠉`;
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

	async toggleSave(data: DropDownActionData) {
		this.isSaved = !this.isSaved;
		data.source.setLabel(this.isSaved ? "Unsave" : "Save");
		data.source.setLabelImg(this.isSaved ? "/img/bookmarkFilled.svg" : "/img/bookmarkEmpty.svg");
		if (!await save(this.fullName, this.isSaved)) {
			console.error(`error voting on comment ${this.fullName}`);
			new Ph_Toast(Level.error, "Error saving post");
		}
	}

	share(data: DropDownActionData) {
		switch (data.valueChain[1]) {
			case "comment link":
				navigator.clipboard.writeText(`${location.origin + this.link}`);
				break;
			case "reddit link":
				navigator.clipboard.writeText(`https://reddit.com${this.link}`);
				break;
			default:
				throw "Invalid share type";
		}
	}

	setupEditForm() {
		this.editForm = new Ph_MarkdownForm("Edit", true);
		this.editForm.classList.add("editForm")
		this.editForm.textField.value = this.bodyMarkdown;
		this.editForm.addEventListener(PhEvents.submit, async () => {
			this.editForm.submitCommentBtn.disabled = true;
			const resp = await edit(this.fullName, this.editForm.textField.value);
			this.editForm.submitCommentBtn.disabled = false;

			if (resp["json"] && resp["json"]["errors"]) {
				new Ph_Toast(Level.error, resp["json"]["errors"][0].join(" | "));
				return;
			} else if (resp["error"]) {
				new Ph_Toast(Level.error, resp["message"]);
				return;
			}
			this.bodyMarkdown = resp["body"];
			this.classList.remove("isEditing");
			const content = this.getElementsByClassName("content")[0] as HTMLElement;
			content.innerHTML = resp["body_html"];
			emojiFlagsToImages(content);
			linksToSpa(content, true);
			new Ph_Toast(Level.success, "Edited comment", { timeout: 2000 });
		});
		this.editForm.addEventListener(PhEvents.cancel, () => this.classList.remove("isEditing"));
		setTimeout(() => this.childComments.insertAdjacentElement("beforebegin", this.editForm), 0);
	}

	async editStart() {
		this.classList.add("isEditing");
		this.editForm.updateHeight();
	}

	deletePrompt(data: DropDownActionData) {
		new Ph_Toast(
			Level.warning,
			"Are you sure you want to delete this comment?",
			{ onConfirm: () => this.delete(data.source) }
		);
	}

	async delete(dropDownEntry: Ph_DropDownEntry) {
		try {
			const resp = await deleteThing(this.fullName);

			if (!isObjectEmpty(resp) || resp["error"]) {
				console.error("Error deleting comment");
				console.error(resp);
				new Ph_Toast(Level.error, "Error deleting comment");
				return;
			}

			this.$class("content")[0].innerHTML = "[deleted]";

			Array.from(dropDownEntry.parentElement.children)		// remove all dropdown entries that have edit or delete in the text
				.filter((entry: HTMLElement) => /delete|edit/i.test(entry.textContent))
				.forEach(entry => entry.remove());

			new Ph_Toast(Level.success, "Deleted comment", { timeout: 2000 });
		} catch (e) {
			console.error("Error deleting comment");
			console.error(e);
			new Ph_Toast(Level.error, "Error deleting comment");
		}
	}

	onSettingsChanged(changed: PhotonSettings) {
		if ("applyUserBlacklistToComments" in changed || "userBlacklist" in changed) {
			const applyUserBlacklistToComments = changed.applyUserBlacklistToComments ?? Users.global.d.photonSettings.applyUserBlacklistToComments;
			const userBlacklist = changed.userBlacklist ?? Users.global.d.photonSettings.userBlacklist;
			const isBlacklisted = applyUserBlacklistToComments && userBlacklist.includes(this.username);
			this.classList.toggle("hide", isBlacklisted);
		}
		if ("autoCollapsePinnedComment" in changed) {
			const hidePinned = changed.autoCollapsePinnedComment && this.isPinned;
			if (hidePinned && !this.classList.contains("isCollapsed"))
				this.collapse();
		}
	}

	filterUserComments() {
		const settings = $css(".photonSettings")[0] as Ph_PhotonSettings;
		if (!Users.global.d.photonSettings.applyUserBlacklistToComments)
			settings.setSettingTo("applyUserBlacklistToComments", true);
		const newList = [...Users.global.d.photonSettings.userBlacklist];
		newList.push(this.username);
		settings.setSettingTo("userBlacklist", newList);
	}

	async loadPushshiftVersion() {
		const loadBtn = this.$class("loadPushshiftBtn")[0] as HTMLButtonElement;
		loadBtn.disabled = true;
		loadBtn.classList.add("loading");

		const currentReplies = this.data.replies?.data?.children ?? [];
		const commentsIdsToKeep = currentReplies
			.filter((comment: RedditCommentObj | RedditMoreCommentsObj) => comment.kind !== "more")
			.map(c => c.data.id);
		let commentData: RedditCommentData;
		let newReplies: RedditCommentObj[];
		try {
			commentData = await getCommentFromPushshift(this.data);
			newReplies = await getCommentRepliesFromPushshift(this.data, commentsIdsToKeep);
		} catch (e) {
			console.error(e);
		}

		loadBtn.disabled = false;
		loadBtn.classList.remove("loading");
		if (!commentData || !newReplies) {
			new Ph_Toast(Level.warning, "Couldn't load comment. Maybe pushshift is having problems");
			return;
		}
		loadBtn.remove();

		// update current comment
		const content = this.$class("content")[0] as HTMLElement;
		content.innerHTML = commentData.body_html;
		const userLink = this.$css("a.user")[0] as HTMLAnchorElement;
		userLink.href = `/user/${commentData.author}`;
		userLink.$tag("span")[0].textContent = `u/${commentData.author}`;

		// update replies
		[...this.childComments.children]
			.filter(c => c instanceof Ph_Comment && !commentsIdsToKeep.includes(c.data.id))
			.forEach(c => c.remove());
		this.childComments.append(...newReplies.map(comment => new Ph_Comment(comment, true, false)));

		emojiFlagsToImages(content);
		addRedditEmojis(content, this.data);
		linksToSpa(content, true);
	}
}

customElements.define("ph-comment", Ph_Comment);
