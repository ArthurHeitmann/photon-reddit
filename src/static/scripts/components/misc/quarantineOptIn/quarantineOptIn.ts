import { quarantinedSubredditOptIn } from "../../../api/redditApi";
import { RedditQuarantineError } from "../../../types/redditTypes";
import { makeElement } from "../../../utils/utils";
import { Ph_ViewState } from "../../viewState/viewState";

export default class Ph_QuarantineOptIn extends HTMLElement {
	errorMessage: RedditQuarantineError;
	subredditName: string;

	constructor(errorMessage: RedditQuarantineError, path: string) {
		super();
		this.errorMessage = errorMessage;
		this.subredditName = path.match(/\/r\/([^/?#]+)/)[1];
		
		this.className = "quarantineOptIn";
		this.append(
			makeElement("h2", {}, `r/${this.subredditName} is quarantined`),
			makeElement("div", {}, errorMessage.quarantine_message_html, true),
			makeElement("button", { class: "button", onclick: this.optIn.bind(this) }, "Opt in"),
		);
	}

	async optIn() {
		await quarantinedSubredditOptIn(this.subredditName);
		Ph_ViewState.getViewOf(this).retryLoadingUrl();
	}
}

customElements.define("ph-quarantine-opt-in", Ph_QuarantineOptIn);
