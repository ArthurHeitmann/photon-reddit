import { getSubInfo, getUserMultis } from "../../../api/redditApi.js";
import { RedditApiType } from "../../../types/misc.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { numberToShort } from "../../../utils/utils.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_FeedInfo from "./feedInfo.js";

export default class Ph_FeedInfoUser extends Ph_FeedInfo {
	async loadInfo(): Promise<void> {
		let feedAbout: RedditApiType;
		let multis: RedditApiType[];
		try {
			feedAbout = await getSubInfo(this.feedUrl);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
			multis = await getUserMultis(this.feedUrl.match(/(?<=(u|user)\/)[^/?#]*/i)[0]);	// /u/username --> username
			if (multis["error"])
				throw `Invalid user multis response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.error, "Error getting user info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.data.multis = multis;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayInfo(): void {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton());

		const bannerUrl = this.loadedInfo.data["subreddit"]["banner_img"];
		if (bannerUrl)
			this.makeBannerImage(bannerUrl, this, this.loadedInfo.data["subreddit"]["banner_background_color"] || undefined);

		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["subreddit"]["icon_img"] || this.loadedInfo.data["icon_img"];
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.alt = "profile";
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const overviewBar = document.createElement("div");
		overviewBar.className = "overviewBar";
		const userActionsWrapper = document.createElement("div");
		userActionsWrapper.className = "subActionsWrapper";
		overviewBar.appendChild(userActionsWrapper);
		userActionsWrapper.appendChild(new Ph_DropDown(
			[
				{ label: `<a href="${this.feedUrl}">Visit</a>`, labelImgUrl: "/img/rightArrow.svg" }
			],
			this.getKebabImg(),
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["total_karma"]}">
				Karma: ${numberToShort(this.loadedInfo.data["total_karma"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["link_karma"]}">
				Link Karma: ${numberToShort(this.loadedInfo.data["link_karma"])}
			</div>
			<div data-tooltip="${this.loadedInfo.data["comment_karma"]}">
				Comment Karma: ${numberToShort(this.loadedInfo.data["comment_karma"])}
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data["subreddit"]["title"] || this.loadedInfo.data["name"];
		this.appendChild(title);

		const publicDescription = document.createElement("div");
		publicDescription.innerText = this.loadedInfo.data["subreddit"]["public_description"];
		const miscText = document.createElement("div");
		const createdDate = new Date(this.loadedInfo.data["created_utc"] * 1000);
		miscText.innerHTML = `
			<div data-tooltip="${createdDate.toString()}">Created: ${createdDate.toDateString()}</div>
		`;
		if (this.loadedInfo.data.multis.length > 0) {
			miscText.insertAdjacentHTML("beforeend", `
				<div>User Multireddits:</div>
				${this.loadedInfo.data.multis.map(multi => `<div><a href="${escADQ(multi.data.path)}">${escHTML(multi.data.display_name)}</a></div>`).join("")}
			`);
		}
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Description", content: publicDescription },
			{ titleHTML: "Other", content: miscText },
		]));

		linksToSpa(this);
	}
}

customElements.define("ph-feed-info-user", Ph_FeedInfoUser);
