import { redditApiRequest } from "../../../api/redditApi.js";
import { thisUser } from "../../../utils/globals.js";
import Ph_FeedInfo, { FeedType } from "../../feed/feedInfo/feedInfo.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

export default class Ph_SubmitPostForm extends HTMLElement {
	subInput: HTMLDivElement;
	validIndicator: HTMLImageElement;
	subInfoButton: HTMLDivElement;
	subSubmitText: HTMLDivElement;
	titleInput: HTMLDivElement;
	linkUrlInput: HTMLDivElement;
	textInput: HTMLDivElement;
	submitButton: HTMLButtonElement;
	isCommunityNameValid: boolean = false;

	constructor() {
		super();

		this.className = "submitPost";

		this.subInput = this.makeTextInput("sub", "Subreddit or User Name");
		this.subInput.addEventListener("input", this.setCommunityIsNeutral.bind(this));
		this.subInput.addEventListener("change", this.onSubChange.bind(this));
		this.validIndicator = document.createElement("img");
		this.validIndicator.className = "validStatus";
		this.subInput.appendChild(this.validIndicator);
		this.subInfoButton = document.createElement("div");
		this.subInfoButton.className = "subInfoButtonWrapper";
		this.subInput.appendChild(this.subInfoButton);
		this.appendChild(this.subInput);

		this.subSubmitText = document.createElement("div");
		this.subSubmitText.className = "el2 roundedM hide";
		this.appendChild(this.subSubmitText);

		this.titleInput = this.makeTextInput("", "Title");
		this.appendChild(this.titleInput);

		this.linkUrlInput = this.makeTextInput("", "Url");
		this.appendChild(this.linkUrlInput);

		this.textInput = this.makeTextInput("postthis.textInput", "Text", true);
		this.appendChild(this.textInput);

		this.submitButton = document.createElement("button");
		this.submitButton.innerText = "Submit";
		this.submitButton.className = "button";
		this.appendChild(this.submitButton);
		this.submitButton.addEventListener("click", this.onSubmitPost.bind(this))

		if (/^\/r\/\w+\/submit/.test(history.state.url)) {
			const subMatches = history.state.url.match(/(?<=^\/r\/)\w+/);
			(this.subInput.$tag("input")[0] as HTMLInputElement).value = `r/${subMatches[0]}`;
			this.subInput.dispatchEvent(new Event("change"));
		}
		else if (/^\/(u|user)\/\w+\/submit/.test(history.state.url)) {
			const userMatches = history.state.url.match(/(?<=^\/(u|user)\/)\w+/);
			(this.subInput.$tag("input")[0] as HTMLInputElement).value = `user/${userMatches[0]}`;
			this.subInput.dispatchEvent(new Event("change"));
		}
	}

	private makeTextInput(className: string, placeHolderText: string, isTextArea: boolean = false): HTMLDivElement {
		const wrapper = document.createElement("div");
		wrapper.className = `phInput el2 roundedL ${className}`;
		if (isTextArea)
			wrapper.classList.add("textarea");
		const input = document.createElement(!isTextArea ? "input" : "textarea");
		if (input instanceof HTMLInputElement)
			input.type = "text";
		input.placeholder = placeHolderText;
		wrapper.appendChild(input)
		return wrapper;
	}

	private async onSubmitPost() {
		// const params = [];
		// params.push(["sr", this.subInput.value]);
		// params.push(["kind", textRadio.checked ? "self" : "link"]);
		// if (textRadio.checked)
		// 	params.push(["text", this.textInput.value]);
		// else
		// 	params.push(["url", this.linkUrlInput.value]);
		// params.push(["title", this.titleInput.value]);
		//
		// const r = redditApiRequest("/api/submit", params, true, { method: "POST" })
	}

	private async onSubChange() {
		let community = (this.subInput.$tag("input")[0] as HTMLInputElement).value;
		if (!/^(r|u|user)\//.test(community)) {
			new Ph_Toast(Level.Error, `Community must start with "r/" or "u/" or "user/"`, {timeout: 3500});
			return;
		} else if (!/^(r|u|user)\/[a-zA-z0-9_-]{3,21}$/.test(community)) {
			new Ph_Toast(Level.Error, `Invalid community name`, {timeout: 3500});
			return;
		}
		else if (/^(u|user)\//.test(community) && community.match(/(?<=^(u|user)\/)\w+/)[0] !== thisUser.name) {
			new Ph_Toast(Level.Error, `You can only submit posts on your profile`, {timeout: 3500});
			return;
		}
		community = community.replace(/^\/?/, "/");

		if (community.startsWith("/r/")) {
			const r = await redditApiRequest(`${community}/api/submit_text`, [], false);
			if (r["kind"] === "listing" || r["error"]) {
				new Ph_Toast(Level.Error, "Subreddit not found", {timeout: 2500});
				this.setCommunityIsInvalid();
				return;
			}
			this.setCommunityIsValid();
			if (r["submit_text"])
				this.subSubmitText.innerHTML = r["submit_text_html"];
			else
				this.subSubmitText.classList.add("hide");
			this.subInfoButton.innerText = "";
			this.subInfoButton.appendChild(Ph_FeedInfo.getInfoButton(FeedType.subreddit, community));
		}
		else {
			const r = await redditApiRequest(`${community}/about`, [], false);
			if (r["kind"] === "listing" || r["error"]) {
				new Ph_Toast(Level.Error, "User not found", {timeout: 2500});
				this.setCommunityIsInvalid();
				return;
			}
			this.setCommunityIsValid();
			this.subInfoButton.innerText = "";
			this.subInfoButton.appendChild(Ph_FeedInfo.getInfoButton(FeedType.user, community));
		}
		// info button
	}

	setCommunityIsValid() {
		this.validIndicator.classList.remove("hide");
		this.validIndicator.src = "/img/check.svg";
		this.validIndicator.alt = "Valid Name";
		this.subSubmitText.classList.remove("hide");
	}

	setCommunityIsInvalid() {
		this.validIndicator.classList.remove("hide");
		this.validIndicator.src = "/img/close.svg";
		this.validIndicator.alt = "Wrong Name";
		this.subSubmitText.classList.add("hide");
		this.subInfoButton.innerText = "";
	}

	setCommunityIsNeutral() {
		this.validIndicator.classList.add("hide");
		this.validIndicator.alt = "waiting";
		this.subSubmitText.classList.add("hide");
		this.subInfoButton.innerText = "";
	}
}

customElements.define("ph-submit-post-form", Ph_SubmitPostForm);
