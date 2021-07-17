import { searchSubreddits } from "../../../api/redditApi.js";
import { isElementIn } from "../../../utils/htmlStuff.js";
import { throttle } from "../../../utils/utils.js";
import Ph_FeedLink from "../../link/feedLink/feedLink.js";
import Ph_Toast, { Level } from "../toast/toast.js";
import BlurEvent = JQuery.BlurEvent;

export type OnSubSelectCallbackSignature = (subName: string) => Promise<void> | void;

/**
 * Binds to a text field. When text is entered into that field a pop up will appear,
 * displaying clickable subreddit suggestions.
 */
export default class Ph_SubredditSelector extends HTMLElement {
	private input: HTMLInputElement;
	private onSubSelectedCallback: OnSubSelectCallbackSignature;
	private removeLeadingR: boolean;
	private blurNsfw: boolean;

	constructor(blurNsfw: boolean = true) {
		super();

		this.className = "subredditSelector remove";
		this.blurNsfw = blurNsfw;
	}

	bind(input: HTMLInputElement, removeLeadingR, onSelectCallback: OnSubSelectCallbackSignature) {
		this.input = input;
		this.input.addEventListener("input", throttle(this.onTextInput.bind(this), 250));
		this.input.addEventListener("focus", this.onTextFocus.bind(this));
		this.input.addEventListener("keypress", this.onTextEnter.bind(this));
		this.input.addEventListener("blur", this.onTextBlur.bind(this));
		this.removeLeadingR = removeLeadingR;
		this.onSubSelectedCallback = onSelectCallback;
	}

	async onTextInput(e: Event) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (this.removeLeadingR)
			this.input.value = this.input.value.replace(/^\/?r\//i, "");	// remove r/ prefix
		if (this.input.value) {
			this.classList.remove("remove");
			if (this.classList.contains("loading"))
				return;
			const subs = await searchSubreddits(this.input.value);
			this.innerText = "";
			subs.data.children.forEach(sub => {
				const selectSubBtn = new Ph_FeedLink(sub, this.blurNsfw, false);
				this.appendChild(selectSubBtn);
				selectSubBtn.addEventListener("click", () => this.addSubToMulti(sub.data["display_name"]));
			});
		} else {
			this.classList.add("remove");
			this.innerText = "";
		}
	}

	private async addSubToMulti(subName: string) {
		try {
			this.classList.add("loading");
			await this.onSubSelectedCallback(subName);
			this.classList.add("remove");
		} catch (e) {
			new Ph_Toast(Level.error, "Error adding subreddit", { groupId: "multi add sub", timeout: 4000 });
			console.error("Error adding sub to multi", e);
		}
		this.classList.remove("loading");
	}

	private onTextEnter(e: KeyboardEvent) {
		if (!["Enter", "NumpadEnter"].includes(e.code) || !this.input.value)
			return;
		this.addSubToMulti(this.input.value);
	}

	private onTextFocus() {
		if (!this.input.value)
			return;
		this.classList.remove("remove");
	}

	private onTextBlur(e: BlurEvent) {
		if (e.relatedTarget && isElementIn(this, e.relatedTarget as HTMLElement))
			return;
		this.classList.add("remove")
	}
}

customElements.define("ph-subreddit-selector", Ph_SubredditSelector);
