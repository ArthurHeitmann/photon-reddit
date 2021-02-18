import { redditApiRequest } from "../../../api/redditApi.js";
import { RedditApiType } from "../../../types/misc.js";
import { isLoggedIn } from "../../../utils/globals.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { numberToShort } from "../../../utils/utils.js";

export default class Ph_MessageNotification extends HTMLElement {
	constructor(newMessages: RedditApiType[]) {
		super();

		this.classList.add("messageNotification");
		this.classList.add("shadow-4");

		if (newMessages.length === 1) {
			const messageLink = newMessages[0].kind == "t1"
				? newMessages[0].data["context"]
				: `/message/messages/${newMessages[0].data["id"]}`;
			this.innerHTML = `
				<a href="${messageLink}">New message from u/${newMessages[0].data["author"]}</a>
			`;
		}
		else {
			this.innerHTML = `
				<a href="/message/unread">${numberToShort(newMessages.length)} new messages</a>
			`;
		}
		this.insertAdjacentHTML("beforeend", `<button class="close"><img src="/img/close.svg" alt="close"></button>`);
		this.$tag("button")[0].addEventListener("click", this.close.bind(this));

		linksToSpa(this);

		document.body.appendChild(this);
	}

	connectedCallback() {
		this.classList.add("show");
		setTimeout(this.close.bind(this), 10000);
	}

	close() {
		this.classList.remove("show");
		setTimeout(() => this.remove(), 550);
	}

	static previousUnreadMessages = 0;
	static async checkForNewMessages() {
		if (document.hidden)
			return;

		const unreadMessages = await redditApiRequest(`/message/unread`,
			[], true) as RedditApiType;

		if (unreadMessages.data.children.length < Ph_MessageNotification.previousUnreadMessages)
			Ph_MessageNotification.previousUnreadMessages = unreadMessages.data.children.length;
		if (unreadMessages.data.children.length === Ph_MessageNotification.previousUnreadMessages)
			return;

		const newMessages = unreadMessages.data.children.splice(Ph_MessageNotification.previousUnreadMessages);
		new Ph_MessageNotification(newMessages);

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
