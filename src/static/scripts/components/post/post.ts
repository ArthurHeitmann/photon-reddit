import { timePassedSinceStr, voteShortStr } from "../../utils/conv.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { RedditApiType } from "../../utils/types.js";
import { FeedItem } from "../feed/feed.js";
import Ph_PostBody from "../postBody/postBody.js";

export default class Ph_Post extends HTMLElement implements FeedItem {
	itemId: string;
	link: string;

	constructor(postData: RedditApiType, isInFeed: boolean) {
		super();

		if (postData.kind !== "t3")
			throw new Error("Invalid comment data type");

		this.link = postData.data["permalink"];
		this.itemId = postData.data["name"];

		this.className = "post" + (isInFeed ? " isInFeed" : "");

		const backgroundLink = document.createElement("a");
		backgroundLink.className = "backgroundLink";
		backgroundLink.href = this.link;
		this.appendChild(backgroundLink);

		const actionBar = document.createElement("div");
		actionBar.className = "actions";
		actionBar.innerHTML = `
			<button class="vote">+</button>
			<div class="upvotes">${voteShortStr(postData.data["ups"])}</div>
			<button class="vote">-</button>
			<button class="additionalActions">^</button>` +
			(isInFeed ?
				`<button class="comments">
					<img alt="comments" src="/img/comments.svg">
				</button> `
				: "");
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
