import {blockMessageUser, readAllMessages, setMessageReadStatus} from "../../../../api/redditApi";
import {$css} from "../../../../utils/htmlStatics";
import {hasParams} from "../../../../utils/utils";
import Ph_DropDown, {DirectionX, DirectionY} from "../../../misc/dropDown/dropDown";
import {DropDownEntryParam} from "../../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Toast, {Level} from "../../../misc/toast/toast";
import Users from "../../../../multiUser/userManagement";
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
		if (await blockMessageUser(this.fullName))
			new Ph_Toast(Level.success, "", { timeout: 3000 });
		else
			new Ph_Toast(Level.error, "");
	}
}
