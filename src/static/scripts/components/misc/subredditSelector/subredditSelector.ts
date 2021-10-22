import { getSubInfo, searchSubreddits } from "../../../api/redditApi";
import { RedditSubredditObj, SubredditDetails } from "../../../types/redditTypes";
import { isElementIn } from "../../../utils/htmlStuff";
import { throttle } from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_Toast, { Level } from "../toast/toast";
import BlurEvent = JQuery.BlurEvent;

export type OnSubSelectCallbackSignature = (subName: string, subData: RedditSubredditObj) => Promise<void> | void;

/**
 * Binds to a text field. When text is entered into that field a pop up will appear,
 * displaying clickable subreddit suggestions.
 */
export default class Ph_SubredditSelector extends HTMLElement {
	private input: HTMLInputElement;
	private onSubSelectedCallback: OnSubSelectCallbackSignature;
	private removeLeadingR: boolean;
	private blurNsfw: boolean;
	private isEnabled: boolean;

	constructor(blurNsfw: boolean = true, isInitiallyEnabled: boolean = true) {
		super();

		this.className = "subredditSelector remove";
		this.blurNsfw = blurNsfw;
		this.isEnabled = isInitiallyEnabled;
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

	setIsEnabled(isEnabled: boolean) {
		this.isEnabled = isEnabled;
	}

	async onTextInput(e: Event) {
		if (!this.isEnabled)
			return;
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (this.removeLeadingR)
			this.input.value = this.input.value.replace(/^\/?r\//i, "");	// remove r/ prefix
		if (this.input.value) {
			this.classList.remove("remove");
			if (this.classList.contains("loading"))
				return;
			const subs = await searchSubreddits(this.input.value, 6);
			this.innerText = "";
			subs.data.children.forEach(sub => {
				const selectSubBtn = new Ph_FeedLink(sub, this.blurNsfw, false);
				this.appendChild(selectSubBtn);
				selectSubBtn.addEventListener("click", () => this.onSubSelected(sub.data.display_name, sub));
			});
		} else {
			this.classList.add("remove");
			this.innerText = "";
		}
	}

	private async onSubSelected(subName: string, subData: RedditSubredditObj) {
		if ((subData.data as SubredditDetails).over18 === null) {
			new Ph_Toast(Level.error, "Error selecting subreddit", { groupId: "multi add sub", timeout: 4000 });
			return;
		}
		try {
			this.classList.add("loading");
			await this.onSubSelectedCallback(subName, subData);
			this.classList.add("remove");
		} catch (e) {
			new Ph_Toast(Level.error, "Error selecting subreddit", { groupId: "multi add sub", timeout: 4000 });
			console.error("Error adding sub to multi", e);
		}
		this.classList.remove("loading");
	}

	private onTextEnter(e: KeyboardEvent) {
		if (!this.isEnabled)
			return;
		if (!["Enter", "NumpadEnter"].includes(e.code) || !this.input.value)
			return;
		this.selectCurrent();
	}

	async selectCurrent() {
		const subInfo = await getSubInfo(`/r/${this.input.value.replace(/^\/?r\//, "")}`);
		if (subInfo["error"]) {
			new Ph_Toast(Level.error, "Couldn't find subreddit", { timeout: 2000 });
			return;
		}
		await this.onSubSelected(this.input.value, subInfo);
	}

	private onTextFocus() {
		if (!this.isEnabled)
			return;
		if (!this.input.value)
			return;
		this.classList.remove("remove");
	}

	private onTextBlur(e: BlurEvent) {
		if (!this.isEnabled)
			return;
		if (e.relatedTarget && isElementIn(this, e.relatedTarget as HTMLElement))
			return;
		this.classList.add("remove")
	}
}

customElements.define("ph-subreddit-selector", Ph_SubredditSelector);
