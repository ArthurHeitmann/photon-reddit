import { comment } from "../../api/redditApi.js";
import { RedditApiType } from "../../types/misc.js";
import { thisUser } from "../../utils/globals.js";
import { escADQ, escHTML } from "../../utils/htmlStatics.js";
import { linksToSpa } from "../../utils/htmlStuff.js";
import { timePassedSinceStr } from "../../utils/utils.js";
import Ph_Readable from "../feed/feedItem/readable/readable.js";
import Ph_MarkdownForm from "../misc/markdownForm/markdownForm.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";

/**
 * A message that has been sent by someone
 */
export default class Ph_Message extends Ph_Readable {
	fullName: string;
	/** If in a message thread, this is the most recent message that wasn't sent by the current user */
	lastMessageFromOther: Ph_Message;

	constructor(messageData: RedditApiType, isInFeed: boolean, isReply: boolean = false) {
		super(messageData.data["name"], isInFeed ? `/message/messages/${messageData.data["id"]}` : null, !isReply,
			messageData.data["dest"] === thisUser.name, !messageData.data["new"]);

		this.fullName = this.itemId;
		this.classList.add("message");

		if (messageData.kind !== "t4") {
			console.error(`Invalid message kind (${messageData.kind})`);
			new Ph_Toast(Level.error, "Invalid message kind");
			throw `Invalid message kind (${messageData.kind})`;
		}

		let userAdditionClasses = "";
		if (messageData.data["distinguished"] === "moderator") {
			userAdditionClasses += " mod";
		} else if (messageData.data["distinguished"] === "admin") {
			userAdditionClasses += " admin";
		}
		const mainPart = document.createElement("div");
		this.appendChild(mainPart);
		mainPart.classList.add("w100");
		mainPart.innerHTML = `
			<h3 class="subjectLine">${escHTML(messageData.data["subject"])}</h3>
			<div class="header flex">
				${
				messageData.data["author"]
				? `<span>from</span>
							<a href="/user/${escADQ(messageData.data["author"])}" class="user${userAdditionClasses}">
								<span>u/${messageData.data["author"]}</span>
							</a>`
				: ""
				}
				${
				messageData.data["subreddit"]
				? `<span>in</span>
							<a href="/r/${escADQ(messageData.data["subreddit"])}" class="user${userAdditionClasses}">
								<span>r/${messageData.data["subreddit"]}</span>
							</a>`
				: ""
				}
				${
				messageData.data["dest"]
				? `<span>to</span>
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

		this.lastMessageFromOther = this;
		if (!isInFeed) {
			if (messageData.data["replies"]) {
				for (const reply of messageData.data["replies"]["data"]["children"]) {
					mainPart.appendChild(document.createElement("hr"));
					const message = new Ph_Message(reply, false, true);
					mainPart.appendChild(message);
					if (reply.data["author"] !== thisUser.name)
						this.lastMessageFromOther = message;
				}
			}

			if (!isReply) {
				const replyForm = new Ph_MarkdownForm("Send", false);
				mainPart.appendChild(replyForm);
				replyForm.addEventListener("ph-submit", async () => {
					const response = await comment(this.lastMessageFromOther, replyForm.textField.value);
					if (response.json.errors.length) {
						for (const error of response.json.errors) {
							new Ph_Toast(Level.error, error instanceof Array ? error.join(" | ") : escHTML(JSON.stringify(error)));
						}
						console.error(response);
						throw "Error replying to message";
					}
					replyForm.insertAdjacentElement("beforebegin", document.createElement("hr"));
					const newMessageData = response.json.data.things[0];
					const message = new Ph_Message(newMessageData, false, true);
					replyForm.insertAdjacentElement("beforebegin", message);
					if (newMessageData.data["author"] !== thisUser.name)
						this.lastMessageFromOther = message;
				});
			}
		}

		linksToSpa(this);
	}
}

customElements.define("ph-message", Ph_Message);

