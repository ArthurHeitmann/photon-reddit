import { redditApiRequest } from "../../../api/redditApi.js";
import Ph_MarkdownForm from "../../misc/markdownForm/markdownForm.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

export default class Ph_MessageCompose extends HTMLElement {
	to: string = "";
	subject: string = "";
	message: string = "";

	constructor(receiver?: string) {
		super();

		this.classList.add("messageCompose");

		const title = document.createElement("h1");
		title.innerText = "Send a message";
		this.appendChild(title);

		const toInput = this.makeTextInput("To 'u/username' or 'r/subreddit'", newText => {
			if (newText.length > 23)
				new Ph_Toast(Level.warning, "Name cannot be longer than 21 characters", { timeout: 2000 });
			this.to = newText;
		});
		this.makeTextInput("Subject", newText => {
			if (newText.length > 100)
				new Ph_Toast(Level.warning, "Subject cannot be longer than 21 characters", { timeout: 2000 });
			this.subject = newText;
		});
		const message = new Ph_MarkdownForm("", false);
		message.textField.placeholder = "Message (Markdown)";
		message.textField.addEventListener("input", () => this.message = message.textField.value);
		this.appendChild(message);

		const sendButton = document.createElement("button");
		sendButton.innerText = "Send";
		sendButton.className = "button";
		sendButton.addEventListener("click", this.sendMessage.bind(this));
		this.appendChild(sendButton);

		if (receiver) {
			const toFromUrl = receiver.replace(/^\//, "");		// remove leading /
			toInput.value = toFromUrl;
			this.to = toFromUrl;
		}
	}

	private makeTextInput(placeholder: string, onInput: (newText: string) => void) {
		const inputWrapper = document.createElement("div");
		inputWrapper.className = "inputWrapper";
		const input = document.createElement("input");
		input.placeholder = placeholder;
		input.addEventListener("change", e => onInput((e.target as HTMLInputElement).value));
		inputWrapper.appendChild(input);
		this.appendChild(inputWrapper)
		return input;
	}

	async sendMessage() {
		const params = [
			["subject", this.subject],
			["message", this.message],
		];
		if (/^\/?u\//i.test(this.to)) {
			const user = this.to.match(/(?=u\/).*/i)[0];		// /u/user --> user
			if (!user) {
				new Ph_Toast(Level.error, "Missing username", { timeout: 2500 });
				return;
			}
			params.push(["to", user]);
		}
		else if (/^\/?r\//i.test(this.to)) {
			const sub = this.to.match(/(?<=r\/).*/i)[0];		// r/sub --> sub
			if (!sub) {
				new Ph_Toast(Level.error, "Missing Subreddit", { timeout: 2500 });
				return;
			}
			params.push(["to", "r/" + sub]);
		}
		else {
			new Ph_Toast(Level.error, "Invalid prefix must be 'u/' or 'r/'", { timeout: 2500 });
			return;
		}

		const r = await redditApiRequest("/api/compose", params, true, { method: "POST" });
		new Ph_Toast(
			r["success"] ? Level.success : Level.error,
			r["jquery"][14][3][0],
			{ timeout: r["success"] ? 3500 : 6000 }
		);
	}
}

customElements.define("ph-message-compose", Ph_MessageCompose);
