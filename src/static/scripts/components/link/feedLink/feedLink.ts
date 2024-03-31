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
	private linkWrapper: HTMLAnchorElement | HTMLButtonElement;
	private mainText: HTMLElement;
	private subtext: HTMLElement;
	private img: HTMLImageElement|undefined;

	constructor(
		feedData: RedditSubredditObj | RedditUserObj | RedditMultiObj | FeedLinkCustomOptions | string,
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

		this.linkWrapper = document.createElement(isClickable ? "a" : "button");
		this.linkWrapper.classList.add("linkWrapper");
		this.append(this.linkWrapper);
		const imageWrapper = document.createElement("div");
		imageWrapper.className = "imageWrapper";
		this.mainText = makeElement("div", { class: "mainText" });
		this.subtext = makeElement("div", { class: "subtext" });
		const linkText = makeElement("div", { class: "linkText" }, [
			this.mainText,
			this.subtext,
		]);
		this.linkWrapper.append(imageWrapper, linkText);

		if (typeof feedData !== "string") {
			switch (feedData.kind) {
			case "t5":	// subreddit
				this.name = feedData.data.display_name;
				this.url = feedData.data.url;
				if (showSubscribers && feedData.data.subscribers !== null) {
					this.mainText.innerText = `r/${feedData.data.display_name}`;
					this.subtext.innerText = `${numberToShort(feedData.data.subscribers)} Subscribers`;
				}
				else {
					this.mainText.innerText = `r/${feedData.data.display_name}`;
				}
				if (this.linkWrapper instanceof HTMLAnchorElement)
					this.linkWrapper.href = `/r/${feedData.data.display_name}`;
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
				this.mainText.innerText = `u/${feedData.data.name}`;
				if (feedData.data.is_suspended === true)
					this.mainText.innerText += " (suspended)";
				else
					this.url = feedData.data.subreddit.url;
				if (this.linkWrapper instanceof HTMLAnchorElement)
					this.linkWrapper.href = `/user/${feedData.data.name}`;
				const userIconImg = getUserIconUrl(feedData.data as RedditUserInfo);
				if (userIconImg)
					imageWrapper.innerHTML = `<img src="${userIconImg}" alt="user">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data.subreddit?.over_18);
				this.classList.add("user");
				break;
			case "LabeledMulti":	// multireddit
				this.name = feedData.data.display_name;
				this.url = feedData.data.path;
				this.mainText.innerText = feedData.data.display_name;
				if (this.linkWrapper instanceof HTMLAnchorElement)
					this.linkWrapper.href = feedData.data.path;
				const multiIconImg = getMultiIconUrl(feedData.data as RedditMultiInfo);
				if (multiIconImg)
					imageWrapper.innerHTML = `<img src="${multiIconImg}" alt="sub">`
				else
					imageWrapper.classList.add("default");
				imageWrapper.classList.toggle("nsfw", blurNsfw && feedData.data.over_18);
				this.classList.add("multireddit");
				break;
			case "custom":
				this.name = feedData.label;
				this.url = feedData.url;
				this.mainText.innerText = feedData.label;
				if (feedData.subtext)
					this.subtext.innerText = feedData.subtext;
				if (this.linkWrapper instanceof HTMLAnchorElement)
					this.linkWrapper.href = feedData.url;
				if (feedData.onclick)
					this.linkWrapper.addEventListener("click", feedData.onclick);
				imageWrapper.innerHTML = `<img src="${feedData.iconUrl}" alt="sub">`;
				break;
			default:
				this.name = "ERROR";
				throw "Invalid feed type!";
			}
		}
		else {
			linkText.innerText = feedData;
			if (this.linkWrapper instanceof HTMLAnchorElement)
				this.linkWrapper.href = `/${feedData}`;
			if (feedData in specialFeedImages) {
				imageWrapper.innerHTML = `<img src="${specialFeedImages[feedData]}" alt="sub">`;
				imageWrapper.classList.add("noBorderRadius");
			}
			else
				imageWrapper.classList.add("default");
		}
		this.img = imageWrapper.querySelector("img");

		linksToSpa(this);
	}

	getName() {
		return this.name;
	}

	getUrl(): string {
		return this.url;
	}

	setUrl(url: string) {
		if (!(this.linkWrapper instanceof HTMLAnchorElement))
			return;
		this.url = url;
			this.linkWrapper.href = url;
	}

	setLabel(label: string) {
		this.mainText.innerText = label;
	}

	setSubtext(subtext: string) {
		this.subtext.innerText = subtext;
	}

	setImgUrl(url: string) {
		if (!this.img)
			return;
		this.img.src = url;
	}
}

export interface FeedLinkCustomOptions {
	kind: "custom";
	label: string;
	subtext?: string;
	iconUrl: string;
	url: string;
	onclick?: () => void;
}

const specialFeedImages = {
	"r/popular": "/img/trendUp.svg",
	"r/all": "/img/earth.svg"
}

customElements.define("ph-feed-link", Ph_FeedLink);
