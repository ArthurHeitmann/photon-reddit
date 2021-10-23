import { blockUser, readAllMessages, setMessageReadStatus } from "../../../../api/redditApi";
import { pushLinkToHistoryComb } from "../../../../historyState/historyStateManager";
import { $css } from "../../../../utils/htmlStatics";
import { hasParams } from "../../../../utils/utils";
import Ph_DropDown, { DirectionX, DirectionY } from "../../../misc/dropDown/dropDown";
import { DropDownActionData, DropDownEntryParam } from "../../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Toast, { Level } from "../../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";
import { MessageSection } from "../../universalFeed/universalFeed";
import Ph_FeedItem from "../feedItem";

export default abstract class Ph_Readable extends Ph_FeedItem {
	abstract fullName: string;
	isRead: boolean;
	canBeRead: boolean;
	actionEntries: DropDownEntryParam[] = [];
	
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
		const actionBar = document.createElement("div");
		actionBar.className = "actionBar";
		this.actionEntries.push({
			label:" Block User",
			labelImgUrl: "/img/block.svg",
			onSelectCallback: this.blockUser.bind(this)
		});
		const kebabImg = document.createElement("img");
		kebabImg.src = "/img/kebab.svg";
		kebabImg.alt = "actions";
		const actionsDropdown = new Ph_DropDown(
			this.actionEntries,
			kebabImg,
			DirectionX.right,
			DirectionY.bottom,
			false
		);
		actionsDropdown.toggleButton.classList.add("transparentButtonAlt")
		actionBar.append(actionsDropdown);
		const markReadButton = document.createElement("button");
		markReadButton.className = "markRead transparentButtonAlt";
		markReadButton.setAttribute("data-tooltip", "Toggle Mark Read");
		markReadButton.addEventListener("click", this.onToggleRead.bind(this));
		actionBar.append(markReadButton);
		this.append(actionBar);
	}

	async onToggleRead() {
		const r = await setMessageReadStatus(!this.isRead, this.fullName);
		if (r["error"]) {
			new Ph_Toast(Level.error, "Failed to change read status");
			console.error("Failed to change read status");
			console.error(r);
			return;
		}
		Users.current.setInboxIdUnreadState(this.fullName, this.isRead)
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

	static getMessageFeedHeaderElements(setMessageSection: (data: DropDownActionData) => void): HTMLElement[] {
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
			DirectionX.right,
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
		Users.current.setAllInboxIdsAsRead();
	}

	async blockUser() {
		if (await blockUser(this.fullName))
			new Ph_Toast(Level.success, "", { timeout: 3000 });
		else
			new Ph_Toast(Level.error, "");
	}
}
