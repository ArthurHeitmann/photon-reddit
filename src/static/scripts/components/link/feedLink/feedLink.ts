import {
	RedditMultiInfo,
	RedditMultiObj,
	RedditSubredditObj,
	RedditUserInfo,
	RedditUserObj,
	SubredditDetails,
	SubredditExpanded,
	SubredditInfoBase
} from "../../../types/redditTypes";
import {linksToSpa} from "../../../utils/htmlStuff";
import {
	getMultiIconUrl,
	getSubredditIconUrl,
	getUserIconUrl,
	hasParams,
	makeElement,
	numberToShort
} from "../../../utils/utils";

export default class Ph_FeedLink extends HTMLElement {
	private name: string;
	private url: string;

	constructor(
		feedData: RedditSubredditObj | RedditUserObj | RedditMultiObj | string,
		options: { blurNsfw?: boolean, isClickable?: boolean, showSubscribers?: boolean } = {}
	) {
		super();
		if (!hasParams(arguments)) return

		this.className = "feedLink";
		const {
			blurNsfw = false,
			isClickable = true,
			showSubscribers = false
		} = options;

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
				this.name = feedData.data.display_name;
				this.url = feedData.data.url;
				if (showSubscribers && feedData.data.subscribers !== null) {
					linkText.append(
						makeElement("div", { class: "subName" }, `r/${feedData.data.display_name}`),
						makeElement("div", { class: "subCount" },
							`${numberToShort(feedData.data.subscribers)} Subscribers`)
					);
				}
				else {
					linkText.innerText = `r/${feedData.data.display_name}`;
				}
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = `/r/${feedData.data.display_name}`;
				const subIconImg = getSubredditIconUrl(feedData.data as SubredditInfoBase);
				if (subIconImg)
					imageWrapper.innerHTML = `<img src="${subIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && Boolean((feedData.data as SubredditDetails).over18 ?? (feedData.data as SubredditExpanded).over_18));
				this.classList.add("subreddit");
				break;
			case "t2":	// user
				this.name = feedData.data.name;
				linkText.innerText = `u/${feedData.data.name}`;
				if (feedData.data.is_suspended === true)
					linkText.innerText += " (suspended)";
				else
					this.url = feedData.data.subreddit.url;
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = `/user/${feedData.data.name}`;
				const userIconImg = getUserIconUrl(feedData.data as RedditUserInfo);
				if (userIconImg)
					imageWrapper.innerHTML = `<img src="${userIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data.subreddit?.over_18);
				this.classList.add("user");
				break;
			case "LabeledMulti":	// multireddit
				this.name = feedData.data.display_name;
				this.url = feedData.data.path;
				linkText.innerText = feedData.data.display_name;
				if (linkWrapper instanceof HTMLAnchorElement)
					linkWrapper.href = feedData.data.path;
				const multiIconImg = getMultiIconUrl(feedData.data as RedditMultiInfo);
				if (multiIconImg)
					imageWrapper.innerHTML = `<img src="${multiIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data.over_18);
				this.classList.add("multireddit");
				break;
			default:
				this.name = "ERROR";
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

	getName() {
		return this.name;
	}

	getUrl(): string {
		return this.url;
	}
}

const specialFeedImages = {
	"r/popular": "/img/trendUp.svg",
	"r/all": "/img/earth.svg"
}

customElements.define("ph-feed-link", Ph_FeedLink);
