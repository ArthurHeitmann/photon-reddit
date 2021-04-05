import { readAllMessages, redditApiRequest, setMessageReadStatus } from "../../../../api/redditApi.js";
import { FullName } from "../../../../types/votable.js";
import { thisUser } from "../../../../utils/globals.js";
import { $class, $css } from "../../../../utils/htmlStatics.js";
import Ph_UserDropDown from "../../../global/userDropDown/userDropDown.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../../misc/toast/toast.js";
import { MessageSection } from "../../universalFeed/universalFeed.js";
import Ph_FeedItem from "../feedItem.js";

export default abstract class Ph_Readable extends Ph_FeedItem implements FullName {
	abstract fullName: string;
	isRead: boolean;
	canBeRead: boolean;
	
	protected constructor(id: string, link: string, isInFeed: boolean, canBeRead: boolean, isRead: boolean) {
		super(id, link, isInFeed);

		this.canBeRead = canBeRead;
		this.isRead = isRead;

		this.classList.add("readable")
		if (!isRead)
			this.classList.add("unread");
	}

	connectedCallback() {
		if (!this.canBeRead)
			return;
		const markReadButton = document.createElement("button");
		markReadButton.className = "markRead transparentButtonAlt";
		markReadButton.setAttribute("data-tooltip", "Toggle Mark Read");
		markReadButton.addEventListener("click", this.onToggleRead.bind(this));
		this.appendChild(markReadButton);
	}

	async onToggleRead() {
		const r = await setMessageReadStatus(!this.isRead, this.fullName);
		if (r["error"]) {
			new Ph_Toast(Level.error, "Failed to change read status");
			console.error("Failed to change read status");
			console.error(r);
			return;
		}
		if (this.isRead)
			thisUser.inboxUnread++;
		else
			thisUser.inboxUnread--;
		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(thisUser.inboxUnread);
		$css(`.readable[data-id="${this.getAttribute("data-id")}"]`)
			.forEach((readable: Ph_Readable) => readable.setIsRead(!readable.isRead));
	}

	setIsRead(read: boolean) {
		this.isRead = read;
		this.updateIsReadStatus();
	}

	updateIsReadStatus() {
		this.classList.toggle("unread", !this.isRead)
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
		if (!Ph_Readable.markReadAllButton) {
			Ph_Readable.markReadAllButton = document.createElement("button");
			Ph_Readable.markReadAllButton.className = "markRead transparentButtonAlt";
			Ph_Readable.markReadAllButton.addEventListener("click", Ph_Readable.readAllMessages);
			Ph_Readable.markReadAllButton.setAttribute("data-tooltip", "Read All Messages");
		}
		elements.push(Ph_Readable.markReadAllButton);
		return elements;
	}

	static async readAllMessages() {
		const r = await readAllMessages();
		if (r["error"]) {
			new Ph_Toast(Level.error, "Error reading all messages");
			console.error("Error reading all messages");
			console.error(r);
			return;
		}
		new Ph_Toast(Level.success, "", { timeout: 2000 });
		for (const message of $css(".readable.unread")) {
			(message as Ph_Readable).setIsRead(true);
		}
		thisUser.inboxUnread = 0;
		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(thisUser.inboxUnread);
	}
}
