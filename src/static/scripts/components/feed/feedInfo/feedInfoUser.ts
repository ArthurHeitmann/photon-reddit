import {blockUser, getSubInfo, getUserMultis} from "../../../api/redditApi";
import {RedditMultiObj, RedditUserInfo, RedditUserObj} from "../../../types/redditTypes";
import {linksToSpa} from "../../../utils/htmlStuff";
import {getUserIconUrl, makeElement, numberToShort} from "../../../utils/utils";
import Ph_DropDown, {DirectionX, DirectionY} from "../../misc/dropDown/dropDown";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Ph_FeedInfo from "./feedInfo";
import Users from "../../../multiUser/userManagement";

interface AllUserInfo extends RedditUserInfo {
	multis: RedditMultiObj[]
}

export default class Ph_FeedInfoUser extends Ph_FeedInfo<AllUserInfo> {
	async loadInfo(): Promise<void> {
		let feedAbout: RedditUserObj;
		let multis: RedditMultiObj[];
		try {
			feedAbout = await getSubInfo(this.feedUrl);
			if (feedAbout["error"] || !(feedAbout.kind && feedAbout.data))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
			multis = await getUserMultis(this.feedUrl.match(/(?:u|user)\/([^/?#]*)/i)[1]);	// /u/username --> username
			if (multis["error"])
				throw `Invalid user multis response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.error, "Error getting user info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		this.loadedInfo.data = {
			...feedAbout.data,
			multis: multis
		}
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayInfo(): void {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton());

		const bannerUrl = this.loadedInfo.data.subreddit.banner_img;
		if (bannerUrl)
			this.makeBannerImage(bannerUrl, this, this.loadedInfo.data.subreddit.banner_background_color || undefined);

		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = getUserIconUrl(this.loadedInfo.data);
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
				{ label: makeElement("a", { href: `${this.feedUrl}` }, "Visit"), labelImgUrl: "/img/rightArrow.svg" },
				this.loadedInfo.data.name != Users.current.name
					&& { label: "Block user", labelImgUrl: "/img/block.svg", onSelectCallback: this.blockUser.bind(this) }
			],
			this.getKebabImg(),
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data.total_karma}">
				Karma: ${numberToShort(this.loadedInfo.data.total_karma)}
			</div>
			<div data-tooltip="${this.loadedInfo.data.link_karma}">
				Link Karma: ${numberToShort(this.loadedInfo.data.link_karma)}
			</div>
			<div data-tooltip="${this.loadedInfo.data.comment_karma}">
				Comment Karma: ${numberToShort(this.loadedInfo.data.comment_karma)}
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data.subreddit.title || this.loadedInfo.data.name;
		this.appendChild(title);

		const publicDescription = document.createElement("div");
		publicDescription.innerText = this.loadedInfo.data.subreddit.public_description;
		const createdDate = new Date(this.loadedInfo.data.created_utc * 1000);
		const miscText = makeElement("div", {}, [makeElement(
			"div",
			{ "data-tooltip": createdDate.toString() },
			`Created: ${createdDate.toDateString()}`
		)]);
		if (this.loadedInfo.data.multis.length > 0) {
			miscText.append(
				makeElement("div", {}, "User Multireddits:"),
				...this.loadedInfo.data.multis.map(multi => makeElement("div", {}, [
					makeElement("a", { href: multi.data.path }, multi.data.display_name)]))
			)
		}
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ title: "Description", content: publicDescription },
			{ title: "Other", content: miscText },
		]));

		linksToSpa(this);
	}

	blockUser() {
		const username = this.loadedInfo.data.name;
		new Ph_Toast(Level.warning, `Are you sure you want to block u/${username}?`, { onConfirm: async () => {
			if (await blockUser(username))
				new Ph_Toast(Level.success, "", { timeout: 3000 });
			else
				new Ph_Toast(Level.error, "")
		}});
	}
}

customElements.define("ph-feed-info-user", Ph_FeedInfoUser);
