import { RedditApiType } from "../../../types/misc.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { hasParams } from "../../../utils/utils.js";

export default class Ph_FeedLink extends HTMLElement {
	constructor(feedData: RedditApiType | string, blurNsfw = false, isClickable = true) {
		super();
		if (!hasParams(arguments)) return

		this.className = "feedLink";

		const linkWrapper = document.createElement(isClickable ? "a" : "button");
		linkWrapper.classList.add("linkWrapper");
		this.append(linkWrapper);
		const imageWrapper = document.createElement("div");
		imageWrapper.className = "imageWrapper";
		const linkText = document.createElement("div");
		linkText.className = "linkText";
		linkWrapper.append(imageWrapper, linkText);

		if (typeof feedData !== "string") {
			switch (feedData.kind) {
			case "t5":	// subreddit
				linkText.innerText = `r/${feedData.data["display_name"]}`;
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = `/r/${feedData.data["display_name"]}`;
				const subIconImg = feedData.data["community_icon"] || feedData.data["icon_img"];
				if (subIconImg)
					imageWrapper.innerHTML = `<img src="${subIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data["over18"]);
				this.classList.add("subreddit");
				break;
			case "t2":	// user
				linkText.innerText = `u/${feedData.data["name"]}`;
				if (feedData.data["is_suspended"] === true)
					linkText.innerText += " (suspended)";
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = `/user/${feedData.data["name"]}`;
				const userIconImg = feedData.data["subreddit"]?.["icon_img"] || feedData.data["icon_img"];
				if (userIconImg)
					imageWrapper.innerHTML = `<img src="${userIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data["subreddit"]?.["over_18"]);
				this.classList.add("user");
				break;
			case "LabeledMulti":	// multireddit
				linkText.innerText = feedData.data["display_name"];
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = feedData.data["path"];
				const multiIconImg = feedData.data["icon_url"];
				if (multiIconImg)
					imageWrapper.innerHTML = `<img src="${multiIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data["over_18"]);
				this.classList.add("multireddit");
				break;
			default:
				throw "Invalid feed type!";
			}
		}
		else {
			linkText.innerText = feedData;
			if (linkWrapper instanceof HTMLAnchorElement)
				linkWrapper.href = `/${feedData}`;
			if (feedData in specialFeedImages) {
				imageWrapper.innerHTML = `<img src="${specialFeedImages[feedData]}" alt="sub">`;
				imageWrapper.classList.add("noBorderRadius");
			}
			else
				imageWrapper.classList.add("default");
		}

		linksToSpa(this);
	}
}

const specialFeedImages = {
	"r/popular": "/img/trendUp.svg",
	"r/all": "/img/earth.svg"
}

customElements.define("ph-subreddit-link", Ph_FeedLink);
