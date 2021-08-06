import { addSubToMulti, getMultiInfo, removeSubFromMulti } from "../../../api/redditApi";
import { RedditApiData, RedditApiType } from "../../../types/misc";
import { StoredData } from "../../../utils/globals";
import { emojiFlagsToImages, escADQ, escHTML } from "../../../utils/htmlStatics";
import { linksToSpa } from "../../../utils/htmlStuff";
import { numberToShort, stringSortComparer } from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown";
import Ph_SubredditSelector from "../../misc/subredditSelector/subredditSelector";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Ph_FeedInfo from "./feedInfo";

export default class Ph_FeedInfoMulti extends Ph_FeedInfo {
	async loadInfo(): Promise<void> {
		let feedAbout: RedditApiType;
		try {
			feedAbout = await getMultiInfo(this.feedUrl);
			if (feedAbout["error"] || !(feedAbout["kind"] && feedAbout["data"]))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.error, "Error getting multi info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		feedAbout.data["subreddits"] = feedAbout.data["subreddits"];
		feedAbout.data["subreddits"].sort((a, b) => stringSortComparer(a.name, b.name));
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayInfo(): void {
		this.innerText = "";

		this.appendChild(this.makeRefreshButton());

		const headerBar = document.createElement("div");
		headerBar.className = "headerBar";
		this.appendChild(headerBar);
		const iconUrl = this.loadedInfo.data["icon_url"];
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
			[],
			this.getKebabImg(),
			DirectionX.left,
			DirectionY.bottom,
			false
		))
			.$class("dropDownButton")[0].classList.add("transparentButtonAlt");

		const createdDate = new Date(this.loadedInfo.data["created_utc"] * 1000);
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data["num_subscribers"]}">
				Subscribers: ${numberToShort(this.loadedInfo.data["num_subscribers"])}
			</div>
			<div data-tooltip="${createdDate.toString()}">
				Created: ${createdDate.toDateString()}
			</div>
			<div>
				By: <a href="/user/${escADQ(this.loadedInfo.data["owner"])}">u/${escHTML(this.loadedInfo.data["owner"])}</a>
			</div>
		`);
		headerBar.appendChild(overviewBar);
		const title = document.createElement("h1");
		title.className = "title";
		title.innerText = this.loadedInfo.data["display_name"];
		this.appendChild(title);

		const description = document.createElement("div");
		description.innerHTML = this.loadedInfo.data["description_html"];
		emojiFlagsToImages(description);
		this.multiSubManager = document.createElement("div");
		this.multiSubManager.append(...this.makeMultiSubManager());
		linksToSpa(this.multiSubManager);
		this.appendChild(this.makeSwitchableBar([
			{ titleHTML: "Subreddits", content: this.multiSubManager },
			{ titleHTML: "Description", content: description },
		]));

		linksToSpa(this);
	}

	private makeMultiSubManager(): HTMLElement[] {
		const outElements: HTMLElement[] = [];

		const subCounter = document.createElement("div");
		subCounter.className = "multiSubCounter";
		subCounter.innerText = "xx/100";
		outElements.push(subCounter);

		if (this.loadedInfo.data["can_edit"]) {
			const addSubredditBar = document.createElement("div");
			addSubredditBar.className = "editableSub addSub";

			const addSubButton = document.createElement("button");
			addSubButton.className = "addSub transparentButtonAlt";
			addSubredditBar.appendChild(addSubButton);

			const addSubInput = document.createElement("input");
			addSubInput.type = "text";
			addSubInput.placeholder = "Subreddit";

			const subredditSelector = new Ph_SubredditSelector(!this.loadedInfo.data.over_18);
			subredditSelector.bind(addSubInput, true, async (subName: string) => {
				await this.addSubToMulti(subName, this.feedUrl, true, addSubredditBar.parentElement);
				this.checkMultiMaxSubCount();
			});
			addSubredditBar.appendChild(subredditSelector);

			addSubredditBar.appendChild(addSubInput);
			addSubButton.addEventListener("click", e => this.addSubToMulti(
				addSubInput.value,
				this.feedUrl,
				true,
				(e.currentTarget as HTMLElement).parentElement.parentElement)
			);

			outElements.push(addSubredditBar);
		}

		for (const sub of this.loadedInfo.data.subreddits) {
			outElements.push(this.makeRemoveSubBar(sub.data));
		}

		setTimeout(this.checkMultiMaxSubCount.bind(this), 0);

		return outElements;
	}

	private checkMultiMaxSubCount() {
		const currentSubCount = this.loadedInfo.data.subreddits.length;
		const subInput = this.multiSubManager.$css(".editableSub.addSub input");
		if (subInput.length)
			(subInput[0] as HTMLInputElement).disabled = currentSubCount >= 100;
		this.multiSubManager.$class("multiSubCounter")[0].innerHTML = `${currentSubCount}/100`;
	}

	private makeRemoveSubBar(sub: RedditApiData) {
		const removeSubredditBar = document.createElement("div");
		removeSubredditBar.className = "editableSub";
		if (this.loadedInfo.data["can_edit"]) {
			const removeSubButton = document.createElement("button");
			removeSubButton.className = "removeSub transparentButtonAlt";
			removeSubredditBar.appendChild(removeSubButton);
			removeSubButton.addEventListener("click",
				async e => {
					await this.removeSubFromMulti(
						(e.currentTarget as HTMLElement).parentElement.$tag("a")[0].innerHTML,
						this.feedUrl,
						(e.currentTarget as HTMLElement).parentElement);
					this.checkMultiMaxSubCount();
				}
			);
		}
		const subText = new Ph_FeedLink({ kind: "t5", data: sub });
		removeSubredditBar.appendChild(subText);
		linksToSpa(removeSubredditBar);
		return removeSubredditBar;
	}

	private async removeSubFromMulti(subName: string, multiPath: string, editSubBar: HTMLElement) {
		subName = subName.replace(/^\/?r\//i, "");		// remove r/ prefix
		if (!this.loadedInfo.data.subreddits.includes(subName)) {
			new Ph_Toast(Level.warning, `r/${escHTML(subName)} does not exist in ${escHTML(multiPath)}`, { timeout: 6000 });
			return;
		}
		try {
			await removeSubFromMulti(multiPath, subName);
			editSubBar.remove();
			this.loadedInfo.data.subreddits.splice(this.loadedInfo.data.subreddits.indexOf(subName), 1);
			this.saveInfo();
		} catch (e) {
			new Ph_Toast(Level.error, "Error removing sub from multi");
			console.error("Error removing sub from multi");
			console.error(subName);
		}
	}

	private async addSubToMulti(subName: string, multiPath: string, sourceIsMulti: boolean, subsList?: HTMLElement) {
		subName = subName.replace(/^\/?r\//i, "");		// remove r/ prefix
		if (subName === "")
			return;
		if (sourceIsMulti && this.loadedInfo.data.subreddits.includes(subName)) {
			new Ph_Toast(Level.warning, `r/${escHTML(subName)} already exists in ${escHTML(multiPath)}`, { timeout: 6000 });
			return;
		}
		try {
			const response = await addSubToMulti(multiPath, subName);
			if (response["explanation"]) {
				new Ph_Toast(Level.error, escHTML(response["explanation"]), { timeout: 6000 });
				return;
			}
			if (!response["name"])
				throw `Invalid add to multi response ${JSON.stringify(response)}`;
			if (sourceIsMulti) {
				this.loadedInfo.data.subreddits.push(response["name"]);
				this.loadedInfo.data.subreddits.sort(stringSortComparer);
				this.saveInfo();
			}
			else if (localStorage[multiPath.toLowerCase()]) {
				// force reload on next load
				const multiData: StoredData = JSON.parse(localStorage[multiPath.toLowerCase()]);
				multiData.lastUpdatedMsUTC = 1;
				localStorage[multiPath.toLowerCase()] = JSON.stringify(multiData);
			}
			if (subsList) {
				const newSubIndex = this.loadedInfo.data.subreddits.indexOf(response["name"]);
				subsList.children[newSubIndex + 1].insertAdjacentElement("afterend", this.makeRemoveSubBar(response["name"]));
				(subsList.$tag("input")[0] as HTMLInputElement).value = "";
			}

		} catch (e) {
			new Ph_Toast(Level.error, "Error adding sub to multi");
			console.error("Error adding sub to multi");
			console.error(subName);
		}
	}
}

customElements.define("ph-feed-info-multi", Ph_FeedInfoMulti);
