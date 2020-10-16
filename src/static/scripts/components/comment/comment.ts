import { replaceRedditLinks, timePassedSince, timePassedSinceStr, numberToShortStr } from "../../utils/conv.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";

export default class Ph_Comment extends Ph_FeedItem {
	constructor(commentData: RedditApiType, isChild: boolean, isInFeed: boolean) {
		super(commentData, isInFeed);

		if (commentData.kind === "more") {
			const loadMoreButton = document.createElement("button");
			loadMoreButton.innerText = `Load more (${commentData.data["count"]})`;
			this.appendChild(loadMoreButton);
			return;
		}
		else if (commentData.kind !== "t1")
			throw new Error("Invalid comment data type");

		this.classList.add("comment");
		if (!isChild)
			this.classList.add("rootComment");

		const actionBar = document.createElement("div");
		actionBar.className = "actions no-select";
		actionBar.innerHTML = `
			<button class="vote">+</button>
			<div class="upvotes">${numberToShortStr(commentData.data["ups"])}</div>
			<button class="vote">-</button>
			<button class="additionalActions">^</button>
		`;
		const commentCollapser = document.createElement("div");
		commentCollapser.className = "commentCollapser";
		commentCollapser.innerHTML = `<div></div>`;
		commentCollapser.addEventListener("click", e => this.collapse(e));
		actionBar.appendChild(commentCollapser);
		this.appendChild(actionBar);

		const mainPart = document.createElement("div");
		mainPart.innerHTML = `
			<div class="header flex">
				<a href="/u/${commentData.data["author"]}" class="user">
					<span>u/${commentData.data["author"]}</span>
				</a>
				<div class="dropdown">${ new Date(parseInt(commentData.data["created_utc"])).toTimeString() }</div>
				<div class="time">${timePassedSinceStr(commentData.data["created_utc"])}</div>
				<span>ago</span>
			</div>
			<div class="content">
				${commentData.data["body_html"]}
			</div>
		`;

		
			
		for (const a of mainPart.getElementsByTagName("a"))
			a.target = "_blank";

		if (commentData.data["replies"] && commentData.data["replies"]["data"]["children"]) {
			const childComments = document.createElement("div");
			childComments.className = "replies";
			for (const comment of commentData.data["replies"]["data"]["children"])
				childComments.appendChild(new Ph_Comment(comment, true, false));
			mainPart.appendChild(childComments);
		}

		this.appendChild(mainPart);

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	collapse(e: MouseEvent) {
		this.classList.toggle("isCollapsed");
	}
}

customElements.define("ph-comment", Ph_Comment);