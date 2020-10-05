import { timePassedSince, timePassedSinceStr, voteShortStr } from "../../utils/conv.js";
import { RedditApiType } from "../../utils/types.js";

export default class Ph_Comment extends HTMLElement {
	constructor(commentData: RedditApiType) {
		super();

		if (commentData.kind === "more") {
			const loadMoreButton = document.createElement("button");
			loadMoreButton.innerText = `Load more (${commentData.data["count"]})`;
			this.appendChild(loadMoreButton);
			return;
		}
		else if (commentData.kind !== "t1")
			throw new Error("Invalid comment data type");

		this.className = "comment flex";

		const actionBar = document.createElement("div");
		actionBar.className = "actions flex f-direction-column f-align-center";
		actionBar.innerHTML = `
			<button class="vote">+</button>
			<div class="upvotes">${voteShortStr(commentData.data["ups"])}</div>
			<button class="vote">-</button>
			<button class="additionalActions mta">^</button>
		`;
		this.appendChild(actionBar);

		const mainPart = document.createElement("div");
		mainPart.innerHTML = `
			<div class="header flex">
				<a href="/u/${commentData.data["author"]}" class="subredditTitle">
					<span class="subredditTitle">u/${commentData.data["author"]}</span>
				</a>
				<div class="dropdown">${ new Date(parseInt(commentData.data["created_utc"])).toTimeString() }</div>
				<div class="time">${timePassedSinceStr(commentData.data["created_utc"])}</div>
				<span>ago</span>
			</div>
			<div class="content">
				${commentData.data["body_html"]}
			</div>
		`;
		if (commentData.data["replies"] && commentData.data["replies"]["data"]["children"]) {
			const childComments = document.createElement("div");
			for (const comment of commentData.data["replies"]["data"]["children"])
				childComments.appendChild(new Ph_Comment(comment));
			mainPart.appendChild(childComments);
		}

		this.appendChild(mainPart);
	}
}

customElements.define("ph-comment", Ph_Comment);