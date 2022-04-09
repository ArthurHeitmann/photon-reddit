import {
	addSubToMulti,
	deleteUserFlair,
	getSubInfo,
	getSubModerators,
	getSubRules,
	getSubUserFlairs,
	redditInfo,
	setUserFlair
} from "../../../api/redditApi";
import {
	FlairApiData,
	RedditSubredditObj,
	SubredditDetails,
	SubredditModerator,
	SubredditRule
} from "../../../types/redditTypes";
import {emojiFlagsToImages} from "../../../utils/htmlStatics";
import {linksToSpa} from "../../../utils/htmlStuff";
import {getSubredditIconUrl, makeElement, numberToShort, stringSortComparer} from "../../../utils/utils";
import Ph_DropDown, {DirectionX, DirectionY} from "../../misc/dropDown/dropDown";
import {DropDownActionData, DropDownEntryParam} from "../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_Flair from "../../misc/flair/flair";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import Users from "../../../multiUser/userManagement";
import Ph_FeedInfo from "./feedInfo";

interface AllSubData extends SubredditDetails {
	rules: SubredditRule[],
	mods: SubredditModerator[],
	flairs: FlairApiData[],
	errorReason?: string
	errorFallbackText?: string
}

export default class Ph_FeedInfoSubreddit extends Ph_FeedInfo<AllSubData> {
	 async loadInfo() {
		let feedAbout: RedditSubredditObj;
		let rules: SubredditRule[] = [];
		let mods: SubredditModerator[] = [];
		let flairs: FlairApiData[] = [];
		let errorReason: string;
		let errorFallbackText: string;
		try {
			feedAbout = await getSubInfo(this.feedUrl);
			if (feedAbout["error"] || !(feedAbout.kind && feedAbout.data)) {
				errorReason = feedAbout["reason"];
				throw Error(`Invalid about response ${JSON.stringify(feedAbout)}`);
			}
			const tmpRules = await getSubRules(this.feedUrl);
			if (tmpRules["error"] || !tmpRules.rules)
				throw Error(`Invalid rules response ${JSON.stringify(tmpRules)}`);
			rules = tmpRules.rules;
			let tmpMods = await getSubModerators(this.feedUrl);
			if (tmpMods["error"] || !(tmpMods.kind === "UserList" && tmpMods.data))
				tmpMods = { data: { children: [] } };
			mods = tmpMods.data.children;
			if (Users.current.d.auth.isLoggedIn)
				flairs = await getSubUserFlairs(this.feedUrl);
		} catch (e) {
			const subFallbackInfo = (await redditInfo({ subreddit: this.feedUrl.match(/r\/(.+)/)[1] })) as RedditSubredditObj;
			errorFallbackText = subFallbackInfo?.data?.public_description;
			feedAbout.data = subFallbackInfo.data;
			new Ph_Toast(Level.error, "Error getting subreddit info");
			console.error(`Error getting subreddit info for ${this.feedUrl}`);
			console.error(e);
		}
		this.loadedInfo.data = {
			...feedAbout.data as SubredditDetails,
			rules,
			mods,
			flairs,
			errorReason,
			errorFallbackText
		};
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayInfo() {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton());

		const bannerUrl = this.loadedInfo.data.banner_img || this.loadedInfo.data.banner_background_image;
		const bannerBgColor = this.loadedInfo.data.banner_background_color || this.loadedInfo.data.key_color || this.loadedInfo.data.primary_color || "#35b5e7";
		this.makeBannerImage(bannerUrl, this, bannerBgColor);
		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = getSubredditIconUrl(this.loadedInfo.data);
		if (iconUrl) {
			const profileImg = document.createElement("img");
			profileImg.src = iconUrl;
			profileImg.alt = "profile";
			profileImg.className = "profileImg";
			headerBar.appendChild(profileImg);
		}
		const overviewBar = document.createElement("div");
		overviewBar.className = "overviewBar";
		const subActionsWrapper = document.createElement("div");
		subActionsWrapper.className = "subActionsWrapper";
		overviewBar.appendChild(subActionsWrapper);
		const subscribeButton = document.createElement("button");
		subscribeButton.className = "subscribeButton button";
		subscribeButton.innerText = Users.current.subreddits.isSubscribedTo(this.loadedInfo.data.display_name) ? "Unsubscribe" : "Subscribe";
		subscribeButton.addEventListener("click", async () => {
			const isCurrentlySubscribed = Users.current.subreddits.isSubscribedTo(this.loadedInfo.data.display_name);
			subscribeButton.innerText = !isCurrentlySubscribed ? "Unsubscribe" : "Subscribe";
			if (await Users.current.subreddits.setIsSubscribed(this.loadedInfo.data.name, !isCurrentlySubscribed)) {
				this.loadedInfo.data.user_is_subscriber = !isCurrentlySubscribed;
				new Ph_Toast(Level.success, "", { timeout: 2000 });
			}
			else {
				subscribeButton.innerText = Users.current.subreddits.isSubscribedTo(this.loadedInfo.data.display_name) ? "Unsubscribe" : "Subscribe";
				this.loadedInfo.data.user_is_subscriber = isCurrentlySubscribed;
				new Ph_Toast(Level.error, `Error subscribing to subreddit`, { timeout: 2000 });
			}
		});
		subActionsWrapper.appendChild(subscribeButton);
		const dropDownEntries: DropDownEntryParam[] = [];
		dropDownEntries.push({label:makeElement("a", { href: this.feedUrl }, "Visit"), labelImgUrl: "/img/rightArrow.svg"});
		dropDownEntries.push({label: makeElement("a", { href: `${this.feedUrl}/submit` }, "Submit Post"), labelImgUrl: "/img/edit.svg"});
		if (Users.current.multireddits.rawData.length > 0) {
			dropDownEntries.push({
				label: "Add to Multireddit",
				labelImgUrl: "/img/add.svg",
				nestedEntries:
					Users.current.multireddits.rawData.map(multi => ({
						label: multi.data.display_name,
						value: multi.data.path,
						onSelectCallback: async (data: DropDownActionData) => {
							const multiPath = data.valueChain[1].replace(/\/?$/g, "")		// remove potential trailing /
							const response = await addSubToMulti(
								multiPath,
								this.feedUrl.replace(/^\/r\//, ""),	// remove leading /r/
							);
							if (response["explanation"]) {
								new Ph_Toast(Level.error, response["explanation"], { timeout: 6000 });
								return;
							}
							else if (!response.name || response["error"]) {
								new Ph_Toast(Level.error, "Error Adding Sub to Multi", { timeout: 6000 });
								return;
							}
							if (Users.current.d.caches.feedInfos[multiPath.toLowerCase()]) {
								// force reload on next load
								await Users.current.set(["caches", "feedInfos", multiPath.toLowerCase(), "lastUpdatedMsUTC"], 1);
							}
							new Ph_Toast(Level.success, "", { timeout: 3000 });
						}
					}))
			});
		}
		if (this.loadedInfo.data.flairs.length > 0) {
			dropDownEntries.push({
				label: this.loadedInfo.data.user_flair_template_id ? Ph_Flair.fromThingData(this.loadedInfo.data, "user") : "Select User Flair",
				labelImgUrl: "/img/tag.svg",
				nestedEntries:
					[<DropDownEntryParam> { label: "No FLair", value: null, onSelectCallback: this.setSubFlair.bind(this) }].concat(
						this.loadedInfo.data.flairs.map((flair: FlairApiData) => {
							const flairElem = Ph_Flair.fromFlairApi(flair);
							return <DropDownEntryParam> {
								label: flairElem,
								value: flairElem,
								onSelectCallback: this.setSubFlair.bind(this)
							}
						}))
			});
		}
		subActionsWrapper.appendChild(new Ph_DropDown(
			dropDownEntries,
			this.getKebabImg(),
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data.subscribers ?? ""}">
				Subscribers: ${numberToShort(this.loadedInfo.data.subscribers)}
			</div>
			<div data-tooltip="${this.loadedInfo.data.active_user_count ?? ""}">
				Online: ${numberToShort(this.loadedInfo.data.active_user_count)} 
				${this.loadedInfo.data.subscribers > 0
					? `&nbsp; — &nbsp;${(this.loadedInfo.data.active_user_count / this.loadedInfo.data.subscribers * 100).toFixed(1)} %`
					: ""}
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data.title || this.loadedInfo.data.display_name || this.feedUrl;
		this.appendChild(title);

		const description = document.createElement("div");
		description.innerHTML = this.loadedInfo.data.description_html ?? "";
		if (this.loadedInfo.data.errorReason) {
			description.append(
				makeElement("h3", {}, `Error Reason: ${this.loadedInfo.data.errorReason}`),
				makeElement("p", {}, this.loadedInfo.data.errorFallbackText),
			);
		}
		emojiFlagsToImages(description);
		const publicDescription = document.createElement("div");
		publicDescription.innerHTML = this.loadedInfo.data.public_description_html ?? "";
		emojiFlagsToImages(publicDescription);
		linksToSpa(publicDescription);
		const rules = document.createElement("div");
		rules.append(...this.makeRules());
		linksToSpa(rules);
		const createdDate = new Date(this.loadedInfo.data.created_utc * 1000);
		const miscText = makeElement("div", {}, [
			makeElement("div", { "data-tooltip": createdDate.toString() }, `Created: ${createdDate.toDateString()}`),
			makeElement("div", {}, "Moderators:"),
			...this.loadedInfo.data.mods
				.sort((m1, m2) => stringSortComparer(m1.name, m2.name))
				.map(mod => makeElement("div", {},[
					makeElement("a", { href: `/user/${mod.name}` }, mod.name)]))]
		);
		linksToSpa(miscText);
		this.appendChild(this.makeSwitchableBar([
			{ title: "Description", content: description },
			{ title: "Public Description", content: publicDescription },
			{ title: "Rules", content: rules },
			{ title: "Other", content: miscText },
		]));

		linksToSpa(this);
	}

	private makeRules(): HTMLElement[] {
		return this.loadedInfo.data.rules.map((rule: SubredditRule) => {
			const ruleWrapper = document.createElement("div");
			ruleWrapper.className = "ruleWrapper";
			const title = document.createElement("button");
			title.innerText = rule.short_name;
			ruleWrapper.appendChild(title);
			if (rule.description_html) {
				title.classList.add("expandable")
				title.addEventListener("click", () => title.classList.toggle("expanded"));
				const description = document.createElement("div");
				description.innerHTML = rule.description_html;
				emojiFlagsToImages(description);
				ruleWrapper.appendChild(description);
			}
			return ruleWrapper;
		});
	}

	private async setSubFlair(data: DropDownActionData) {
		const flair = data.valueChain[1];
		if (flair instanceof Ph_Flair) {
			const success = await setUserFlair(this.feedUrl, flair);
			if (success)
				data.source.parentEntry.setLabel(flair.clone(false));
			else
				new Ph_Toast(Level.error, "Couldn't change flair");
		}
		else {
			const success = await deleteUserFlair(this.feedUrl);
			if (success)
				data.source.parentEntry.setLabel("Select Subreddit Flair");
			else
				new Ph_Toast(Level.error, "Couldn't change flair");
		}
	}

}

customElements.define("ph-feed-info-subreddit", Ph_FeedInfoSubreddit);
