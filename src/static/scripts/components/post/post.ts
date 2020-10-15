import { timePassedSinceStr, voteShortStr } from "../../utils/conv.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_FeedItem from "../feed/feedItem/feedItem.js";
import Ph_PostBody from "./postBody/postBody.js";

export default class Ph_Post extends Ph_FeedItem {

	constructor(postData: RedditApiType, isInFeed: boolean) {
		super(postData, isInFeed);

		if (postData.kind !== "t3")
			throw new Error("Invalid comment data type");

		this.classList.add("post");

		const actionBar = document.createElement("div");
		actionBar.className = "actions";
		actionBar.innerHTML = `
			<div class="wrapper">
				<button class="vote">+</button>
				<div class="upvotes">${voteShortStr(postData.data["ups"])}</div>
				<button class="vote">-</button>
				<button class="additionalActions">^</button>
				${isInFeed ?
					`<button class="comments">
						<img alt="comments" src="/img/comments.svg">
					</button> `
					: ""}
			</div>`;
		;
		this.appendChild(actionBar);

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


}

customElements.define("ph-post", Ph_Post);
