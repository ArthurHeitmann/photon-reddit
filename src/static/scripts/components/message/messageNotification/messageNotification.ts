import { redditApiRequest, setMessageReadStatus } from "../../../api/redditApi";
import { PhEvents } from "../../../types/Events";
import { RedditCommentObj, RedditListingObj, RedditMessageObj } from "../../../types/redditTypes";
import { $css, escADQ, escHTML } from "../../../utils/htmlStatics";
import { linksToSpa } from "../../../utils/htmlStuff";
import { ensurePageLoaded, hasParams, numberToShort } from "../../../utils/utils";
import Ph_Readable from "../../feed/feedItem/readable/readable";
import { PhotonSettings } from "../../global/photonSettings/photonSettings";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";

export default class Ph_MessageNotification extends HTMLElement {
	static previousUnreadMessages = 0;
	static currentlyDisplayedNotification: Ph_MessageNotification = null;
	isRequestInProgress = false;
	isClosing = false;

	constructor(newMessages: (RedditMessageObj | RedditCommentObj)[]) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("messageNotification");
		this.classList.add("shadow-4");

		if (newMessages.length === 1 && newMessages[0].data.author) {
			const messageLink = newMessages[0].kind == "t1"
				? newMessages[0].data["context"]
				: `/message/messages/${newMessages[0].data.id}`;
			this.innerHTML = `
				<a href="${escADQ(messageLink)}">New message from u/${escHTML(newMessages[0].data.author)}</a>
			`;
		}
		else {
			this.innerHTML = `
				<a href="/message/unread">${numberToShort(newMessages.length)} new message${newMessages.length > 1 ? "s" : ""}</a>
			`;
		}
		this.insertAdjacentHTML("beforeend", `<button class="markRead transparentButtonAlt"</button>`);
		const newIds = newMessages.map(msg => msg.data.name);
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
		const r = await setMessageReadStatus(true, messageFullNames.join(","));
		this.isRequestInProgress = false;
		if (r["error"]) {
			new Ph_Toast(Level.error, "Failed mark as read read");
			console.error("Failed to mark as read");
			console.error(r);
			return;
		}

		Users.current.setInboxIdsUnreadState(messageFullNames, false);
		for (const msg of messageFullNames) {
			$css(`.readable[data-id="${msg}"]`)
				.forEach((readable: Ph_Readable) => readable.setIsRead(true));
		}
		this.close();
	}

	static async checkForNewMessages() {
		if (!Users.current.d.auth.isLoggedIn)
			return;
		const unreadMessagesData = await redditApiRequest(`/message/unread`,
			[], true) as RedditListingObj<RedditMessageObj>;
		const unreadMessages = unreadMessagesData.data.children;

		Users.current.setInboxIdsUnreadState(unreadMessages.map(msg => msg.data.name), true);

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

let messageCheckInterval = null;
ensurePageLoaded().then( () => {
	if (!Users.current.d.auth.isLoggedIn)
		return;
	Ph_MessageNotification.checkForNewMessages();
	if (Users.global.d.photonSettings.messageCheckIntervalMs > 0)
		messageCheckInterval = setInterval(Ph_MessageNotification.checkForNewMessages, Users.global.d.photonSettings.messageCheckIntervalMs);
});
window.addEventListener(PhEvents.settingsChanged, (e: CustomEvent) => {
	const changed = e.detail as PhotonSettings;
	if (changed.messageCheckIntervalMs === undefined)
		return;
	if (messageCheckInterval !== null)
		clearInterval(messageCheckInterval);
	if (changed.messageCheckIntervalMs > 0)
		messageCheckInterval = setInterval(Ph_MessageNotification.checkForNewMessages, Users.global.d.photonSettings.messageCheckIntervalMs);
});

customElements.define("ph-message-notification", Ph_MessageNotification);
