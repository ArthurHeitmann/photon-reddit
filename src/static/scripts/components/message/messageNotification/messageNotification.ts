import { redditApiRequest } from "../../../api/redditApi.js";
import { RedditApiType } from "../../../types/misc.js";
import { isLoggedIn, thisUser } from "../../../utils/globals.js";
import { $class, $css } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { numberToShort } from "../../../utils/utils.js";
import Ph_Readable from "../../feed/feedItem/readable/readable.js";
import Ph_UserDropDown from "../../global/userDropDown/userDropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

export default class Ph_MessageNotification extends HTMLElement {
	static previousUnreadMessages = 0;
	static currentlyDisplayedNotification: Ph_MessageNotification = null;
	isRequestInProgress = false;
	isClosing = false;

	constructor(newMessages: RedditApiType[]) {
		super();

		this.classList.add("messageNotification");
		this.classList.add("shadow-4");

		if (newMessages.length === 1 && newMessages[0].data["author"]) {
			const messageLink = newMessages[0].kind == "t1"
				? newMessages[0].data["context"]
				: `/message/messages/${newMessages[0].data["id"]}`;
			this.innerHTML = `
				<a href="${messageLink}">New message from u/${newMessages[0].data["author"]}</a>
			`;
		}
		else {
			this.innerHTML = `
				<a href="/message/unread">${numberToShort(newMessages.length)} new message${newMessages.length > 1 ? "s" : ""}</a>
			`;
		}
		this.insertAdjacentHTML("beforeend", `<button class="markRead transparentButtonAlt"</button>`);
		const newIds = newMessages.map(msg => msg.data["name"]);
		this.$class("markRead")[0].addEventListener("click", () => this.markRead(newIds));
		this.insertAdjacentHTML("beforeend", `<button class="close transparentButtonAlt"><img src="/img/close.svg" alt="close"></button>`);
		this.$class("close")[0].addEventListener("click", this.close.bind(this));

		linksToSpa(this);

		document.body.appendChild(this);
	}

	connectedCallback() {
		this.classList.add("show");
	}

	close() {
		this.isClosing = true;
		this.classList.remove("show");
		setTimeout(() => this.remove(), 550);
	}

	async markRead(messageFullNames: string[]) {
		if (this.isRequestInProgress || this.isClosing)
			return;
		this.isRequestInProgress = true;
		const r = await redditApiRequest(
			"/api/read_message",
			[["id", messageFullNames.join(",")]],
			true,
			{method: "POST"}
		);
		this.isRequestInProgress = false;
		if (r["error"]) {
			new Ph_Toast(Level.Error, "Failed mark as read read");
			console.error("Failed to mark as read");
			console.error(r);
			return;
		}
		thisUser.inboxUnread -= messageFullNames.length;
		($class("userDropDown")[0] as Ph_UserDropDown).setUnreadCount(thisUser.inboxUnread);
		for (let msg of messageFullNames) {
			$css(`.readable[data-id="${msg}"]`)
				.forEach((readable: Ph_Readable) => readable.setIsRead(!readable.isRead));
		}
		this.close();
	}

	static async checkForNewMessages() {
		const unreadMessagesData = await redditApiRequest(`/message/unread`,
			[], true) as RedditApiType;
		const unreadMessages = unreadMessagesData.data.children;

		if (unreadMessages.length < Ph_MessageNotification.previousUnreadMessages)
			Ph_MessageNotification.previousUnreadMessages = unreadMessages.length;
		if (unreadMessages.length === Ph_MessageNotification.previousUnreadMessages)
			return;


		const newMessages = Array.from(unreadMessages);
		newMessages.splice(unreadMessages.length - Ph_MessageNotification.previousUnreadMessages);

		if (Ph_MessageNotification.currentlyDisplayedNotification) {
			Ph_MessageNotification.currentlyDisplayedNotification.close();
			Ph_MessageNotification.currentlyDisplayedNotification = null;
		}
		Ph_MessageNotification.currentlyDisplayedNotification = new Ph_MessageNotification(newMessages);

		Ph_MessageNotification.previousUnreadMessages = newMessages.length;
	}
}

window.addEventListener("ph-page-ready", () => {
	if (!isLoggedIn)
		return;
	Ph_MessageNotification.checkForNewMessages();
	setInterval(Ph_MessageNotification.checkForNewMessages, 30 * 1000);
}, { once: true })

customElements.define("ph-message-notification", Ph_MessageNotification);
