import { escADQ } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../utils/types.js";
import { replaceRedditLinks, timePassedSinceStr } from "../../../utils/utils.js";
import Ph_FeedItem from "../../feed/feedItem/feedItem.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export default class Ph_Message extends Ph_FeedItem {
	constructor(messageData: RedditApiType, isInFeed: boolean, isReply: boolean = false) {
		super(messageData.data["name"],isInFeed ? `/message/messages/${messageData.data["id"]}` : null, !isReply);

		this.classList.add("message");

		if (messageData.kind !== "t4") {
			console.error(`Invalid message kind (${messageData.kind})`);
			new Ph_Toast(Level.Error, "Invalid message kind");
			throw `Invalid message kind (${messageData.kind})`;
		}

		let userAdditionClasses = "";
		if (messageData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		}
		else if (messageData.data["distinguished"] === "admin") {
			userAdditionClasses += " admin";
		}
		const mainPart = document.createElement("div");
		this.appendChild(mainPart);
		mainPart.classList.add("w100");
		mainPart.innerHTML = `
			<div class="header flex">
				${
					messageData.data["author"] 
						?  `<span>from</span>
							<a href="/user/${escADQ(messageData.data["author"])}" class="user${userAdditionClasses}">
								<span>u/${messageData.data["author"]}</span>
							</a>` 
						: ""
				}
				${
					messageData.data["subreddit"] 
						?  `<span>in</span>
							<a href="/r/${escADQ(messageData.data["subreddit"])}" class="user${userAdditionClasses}">
								<span>r/${messageData.data["subreddit"]}</span>
							</a>` 
						: ""
				}
				${
					messageData.data["dest"] 
						?  `<span>to</span>
							<a href="/user/${escADQ(messageData.data["dest"])}" class="user${userAdditionClasses}">
								<span>u/${messageData.data["dest"]}</span>
							</a>` 
						: ""
				}
				<span class="time" data-tooltip="${new Date(messageData.data["created_utc"] * 1000).toString()}">
					${timePassedSinceStr(messageData.data["created_utc"])}
				</span>
				<span>ago</span>
				${
				messageData.data["replies"] && isInFeed
					? `<a class="replies" href="${escADQ(this.link)}">${messageData.data["replies"]["data"]["children"].length} replies</a>` 
					: ""
				}
			</div>
			<div class="content">
				${messageData.data["body_html"]}
			</div>
		`;

		if (!isInFeed && messageData.data["replies"]) {
			for (const reply of messageData.data["replies"]["data"]["children"]) {
				mainPart.appendChild(document.createElement("hr"));
				mainPart.appendChild(new Ph_Message(reply, false, true));
			}
		}

		linksToSpa(this);
		replaceRedditLinks(this)
	}
}

customElements.define("ph-message", Ph_Message);
