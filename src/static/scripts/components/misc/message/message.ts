import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiType } from "../../../utils/types.js";
import { replaceRedditLinks } from "../../../utils/utils.js";
import Ph_FeedItem from "../../feed/feedItem/feedItem.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export default class Ph_Message extends Ph_FeedItem {
	constructor(messageData: RedditApiType) {
		super(messageData.data["name"],`/message/messages/${messageData.data["id"]}`, true);

		if (messageData.kind !== "t4") {
			console.error(`Invalid message kind (${messageData.kind})`);
			new Ph_Toast(Level.Error, "Invalid message kind");
			throw `Invalid message kind (${messageData.kind})`;
		}

		const messageBody = document.createElement("div");
		messageBody.innerHTML = messageData.data["body_html"];

		this.appendChild(messageBody);

		linksToSpa(this);
		replaceRedditLinks(this)
	}
}

customElements.define("ph-message", Ph_Message);
