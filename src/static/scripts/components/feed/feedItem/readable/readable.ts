import { readAllMessages, setMessageReadStatus } from "../../../../api/redditApi.js";
import { pushLinkToHistoryComb } from "../../../../historyState/historyStateManager.js";
import { FullName } from "../../../../types/votable.js";
import { thisUser } from "../../../../utils/globals.js";
import { $class, $css } from "../../../../utils/htmlStatics.js";
import { hasParams } from "../../../../utils/utils.js";
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
		if (!hasParams(arguments)) return;

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
		this.append(markReadButton);
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

	static getMessageFeedHeaderElements(setMessageSection: (v: any[]) => void): HTMLElement[] {
		const elements = [];
		const composeButton = document.createElement("button");
		composeButton.className = "composeMsgBtn transparentButtonAlt";
		composeButton.addEventListener("click", () => pushLinkToHistoryComb("/message/compose"));
		composeButton.setAttribute("data-tooltip", "Compose Message");
		elements.push(composeButton);
		const markReadAllButton = document.createElement("button");
		markReadAllButton.className = "markRead transparentButtonAlt";
		markReadAllButton.addEventListener("click", Ph_Readable.readAllMessages);
		markReadAllButton.setAttribute("data-tooltip", "Read All Messages");
		elements.push(markReadAllButton);
		elements.push(new Ph_DropDown(
			[
				{ label: "All", value: MessageSection.all, onSelectCallback: setMessageSection },
				{ label: "Unread", value: MessageSection.unread, onSelectCallback: setMessageSection },
				{ label: "Messages", value: MessageSection.messages, onSelectCallback: setMessageSection },
				{ label: "Comment Replies", value: MessageSection.commentReplies, onSelectCallback: setMessageSection },
				{ label: "Post Replies", value: MessageSection.postReplies, onSelectCallback: setMessageSection },
				{ label: "Username mentions", value: MessageSection.mentions, onSelectCallback: setMessageSection },
				{ label: "Sent", value: MessageSection.sent, onSelectCallback: setMessageSection },
			],
			"Sections",
			DirectionX.left,
			DirectionY.bottom,
			false
		));
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
