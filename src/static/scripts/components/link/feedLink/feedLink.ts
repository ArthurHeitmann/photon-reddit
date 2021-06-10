import { RedditApiType } from "../../../types/misc.js";
import { hasParams } from "../../../utils/utils.js";

export default class Ph_FeedLink extends HTMLElement {
	constructor(feedData: RedditApiType | string) {
		super();
		if (!hasParams(arguments)) return

		this.className = "feedLink";

		const linkWrapper = document.createElement("a");
		this.append(linkWrapper);
		const imageWrapper = document.createElement("div");
		imageWrapper.className = "imageWrapper";
		const linkText = document.createElement("div");
		linkWrapper.className = "linkText";
		linkWrapper.append(imageWrapper, linkText);

		if (typeof feedData !== "string") {
			switch (feedData.kind) {
			case "t5":	// subreddit
				linkText.innerText = `r/${feedData.data["display_name"]}`;
				linkWrapper.href = `/r/${feedData.data["display_name"]}`;
				const subIconImg = feedData.data["community_icon"] || feedData.data["icon_img"];
				if (subIconImg)
					imageWrapper.innerHTML = `<img src="${subIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				break;
			case "LabeledMulti":
				linkText.innerText = feedData.data["display_name"];
				linkWrapper.href = feedData.data["path"];
				const multiIconImg = feedData.data["icon_url"];
				if (multiIconImg)
					imageWrapper.innerHTML = `<img src="${multiIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				break;
			default:
				throw "Invalid feed type!";
			}
		}
		else {
			linkText.innerText = feedData;
			linkWrapper.href = `/${feedData}`;
			if (feedData in specialFeedImages) {
				imageWrapper.innerHTML = `<img src="${specialFeedImages[feedData]}" alt="sub">`;
				imageWrapper.classList.add("noBorderRadius");
			}
			else
				imageWrapper.classList.add("default");
		}

	}
}

const specialFeedImages = {
	"r/popular": "/img/trendUp.svg",
	"r/all": "/img/earth.svg"
}

customElements.define("ph-subreddit-link", Ph_FeedLink);
