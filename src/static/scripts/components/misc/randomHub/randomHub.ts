import { getRandomSubreddit, getRandomSubredditPostUrl } from "../../../api/photonApi";
import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager";
import { hasParams } from "../../../utils/utils";
import Ph_Toast, { Level } from "../toast/toast";

enum RandomTarget {
	Random, RandNsfw, RandomPost
}

export default class Ph_RandomHub extends HTMLElement {
	randomTarget: RandomTarget;
	subreddit: string;
	otherParams: string = "";

	/** one of: r/random, r/randnsfw, r/{sub}/random */
	constructor(url: string) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("randomHub");

		const actionButton = document.createElement("button");
		actionButton.className = "randomButton";
		actionButton.addEventListener("click", this.onButtonClick.bind(this));
		const buttonText = document.createElement("div");
		actionButton.append(buttonText);
		this.append(actionButton);

		if (/^\/r\/random([/#?].*)?$/i.test(url)) {
			this.randomTarget = RandomTarget.Random;
			buttonText.innerText = "Random Subreddit";
			this.otherParams = url.match(/\/r\/[^/]+([/?#].*)?/i)[1] || "";		// /r/random/top?t=all --> /top?t=all
		}
		else if (/^\/r\/randnsfw([/#?].*)?$/i.test(url)) {
			this.randomTarget = RandomTarget.RandNsfw;
			buttonText.innerText = "Random NSFW Subreddit";
			this.otherParams = url.match(/\/r\/[^/]+([/?#].*)?/i)[1] || "";		// as ^
		}
		else if (/^\/r\/[^/?#]+\/random([/#?].*)?$/i.test(url)) {
			this.randomTarget = RandomTarget.RandomPost;
			this.subreddit = url.match(/\/r\/([^/?#]+)/i)[1];					// /r/pics/top?q --> pics
			buttonText.innerText = `Random Post on r/${this.subreddit}`;
			this.otherParams = url.match(/\/r\/[^/]+\/random([/?#].*)?/i)[1] || "";	// as ^^
		}
		else
			throw "invalid url scheme";
	}

	onButtonClick() {
		new Ph_Toast(Level.error, "Reddit has discontinued the random feature", { timeout: 5000, groupId: "random_hub" });
		return;
		switch (this.randomTarget) {
			case RandomTarget.Random:
				this.goToRandomSubreddit();
				break;
			case RandomTarget.RandNsfw:
				this.goToRandomSubreddit(true);
				break;
			case RandomTarget.RandomPost:
				this.goToRandomSubredditPost(this.subreddit);
				break;
		}
	}

	async goToRandomSubreddit(isNsfw = false) {
		const randomSub = await getRandomSubreddit(isNsfw);
		if (randomSub)
			pushLinkToHistoryComb(`/r/${randomSub}${this.otherParams}`);
		else
			new Ph_Toast(Level.error, "Couldn't get random subreddit")
	}

	async goToRandomSubredditPost(subreddit: string) {
		const randomPost = await getRandomSubredditPostUrl(this.subreddit);
		if (randomPost)
			pushLinkToHistoryComb(randomPost + this.otherParams);
		else
			new Ph_Toast(Level.error, "Couldn't get random subreddit")
	}
}

customElements.define("ph-random-hub", Ph_RandomHub);
