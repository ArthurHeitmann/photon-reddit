import { comment, redditApiRequest } from "../../../api/redditApi.js";
import { FullName } from "../../../types/votable.js";
import { thisUser } from "../../../utils/globals.js";
import { $class, $css, escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../utils/types.js";
import { replaceRedditLinks, timePassedSinceStr } from "../../../utils/utils.js";
import Ph_FeedItem from "../../feed/feedItem/feedItem.js";
import { MessageSection } from "../../feed/universalFeed/universalFeed.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../dropDown/dropDown.js";
import Ph_MarkdownForm from "../markdownForm/markdownForm.js";
import Ph_Toast, { Level } from "../toast/toast.js";
import Ph_UserDropDown from "../userDropDown/userDropDown.js";

export default class Ph_Message extends Ph_FeedItem implements FullName {
	fullName: string;
	lastMessageFromOther: Ph_Message;
	isRead: boolean;

	constructor(messageData: RedditApiType, isInFeed: boolean, isReply: boolean = false) {
		super(messageData.data["name"],isInFeed ? `/message/messages/${messageData.data["id"]}` : null, !isReply);
		this.fullName = this.itemId;

		this.classList.add("message");

		if (messageData.kind !== "t4") {
			console.error(`Invalid message kind (${messageData.kind})`);
			new Ph_Toast(Level.Error, "Invalid message kind");
			throw `Invalid message kind (${messageData.kind})`;
		}

		this.setIsRead(!messageData.data["new"])

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
			<h3 class="subjectLine">${escHTML(messageData.data["subject"])}</h3>
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
					const response = await comment(this.lastMessageFromOther, replyForm.commentTextField.value);
					if (response.json.errors.length) {
						for (let error of response.json.errors) {
							new Ph_Toast(Level.Error, error instanceof Array ? error.join(" | ") : escHTML(JSON.stringify(error)));
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
		replaceRedditLinks(this)
	}

	setIsRead(read: boolean) {
		this.isRead = read;
		this.updateIsReadStatus();
	}

	updateIsReadStatus() {
		if (this.isRead)
			this.classList.remove("unread");
		else
			this.classList.add("unread");
	}

	static markReadAllButton: HTMLButtonElement;
	static getMessageFeedHeaderElements(setMessageSection: (v: any[]) => void): HTMLElement[] {
		const elements = [];
		elements.push(new Ph_DropDown(
			[
				{ displayHTML: "All", value: MessageSection.all, onSelectCallback: setMessageSection },
				{ displayHTML: "Unread", value: MessageSection.unread, onSelectCallback: setMessageSection },
				{ displayHTML: "Messages", value: MessageSection.messages, onSelectCallback: setMessageSection },
				{ displayHTML: "Comment Replies", value: MessageSection.commentReplies, onSelectCallback: setMessageSection },
				{ displayHTML: "Post Replies", value: MessageSection.postReplies, onSelectCallback: setMessageSection },
				{ displayHTML: "Username mentions", value: MessageSection.mentions, onSelectCallback: setMessageSection },
			],
			"Sections",
			DirectionX.left,
			DirectionY.bottom,
			false
		));
		if (!Ph_Message.markReadAllButton) {
			Ph_Message.markReadAllButton = document.createElement("button");
			Ph_Message.markReadAllButton.className = "markReadAll transparentButtonAlt";
			Ph_Message.markReadAllButton.addEventListener("click", Ph_Message.readAllMessages);
			Ph_Message.markReadAllButton.setAttribute("data-tooltip", "Read All Messages");
		}
		elements.push(Ph_Message.markReadAllButton);
		return elements;
	}

	static async readAllMessages() {
		const r = await redditApiRequest("/api/read_all_messages", [], true, { method: "POST" });
		if (r["error"]) {
			new Ph_Toast(Level.Error, "Error reading all messages");
			console.error("Error reading all messages");
			console.error(r);
			return;
		}
		new Ph_Toast(Level.Success, "", { timeout: 2000 });
		for (const message of $css(".message.unread")) {
			(message as Ph_Message).setIsRead(true);
		}
		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(0);
	}
}


customElements.define("ph-message", Ph_Message);

