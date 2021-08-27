import {
	addSubToMulti,
	createOrUpdateMulti,
	deleteMulti,
	getMultiInfo,
	removeSubFromMulti
} from "../../../api/redditApi";
import {
	RedditMultiInfo,
	RedditMultiObj,
	RedditSubredditObj,
	SubredditExpanded,
	SubredditInfoBase
} from "../../../types/redditTypes";
import { StoredData, thisUser } from "../../../utils/globals";
import { emojiFlagsToImages, escADQ, escHTML } from "../../../utils/htmlStatics";
import { linksToSpa } from "../../../utils/htmlStuff";
import { isObjectEmpty, makeElement, numberToShort, stringSortComparer } from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_DropDown, { DirectionX, DirectionY } from "../../misc/dropDown/dropDown";
import Ph_MultiCreateOrEdit from "../../misc/multiCreateOrEdit/multiCreateOrEdit";
import Ph_SubredditSelector from "../../misc/subredditSelector/subredditSelector";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Ph_FeedInfo from "./feedInfo";

export default class Ph_FeedInfoMulti extends Ph_FeedInfo<RedditMultiInfo> {
	private editPane: Ph_MultiCreateOrEdit;

	async loadInfo(): Promise<void> {
		let feedAbout: RedditMultiObj
		try {
			feedAbout = await getMultiInfo(this.feedUrl);
			if (feedAbout["error"] || !(feedAbout.kind && feedAbout.data))
				throw `Invalid about response ${JSON.stringify(feedAbout)}`;
		} catch (e) {
			new Ph_Toast(Level.error, "Error getting multi info");
			console.error(`Error getting user info for ${this.feedUrl}`);
			console.error(e);
		}
		feedAbout.data.subreddits.sort((a, b) => stringSortComparer(a.name, b.name));
		this.loadedInfo.data = feedAbout.data;
		this.loadedInfo.lastUpdatedMsUTC = Date.now();
		this.saveInfo();
	}

	displayInfo(): void {
		this.innerText = "";

		this.append(this.makeRefreshButton());

		const headerBar = makeElement("div", { class: "headerBar" });
		this.append(headerBar);
		const iconUrl = this.loadedInfo.data.icon_url;
		if (iconUrl) {
			headerBar.append(makeElement(
				"img",
				{ src: iconUrl, alt: "profile", class: "profileImg" })
			);
		}
		const overviewBar = makeElement("div", { class: "overviewBar" });
		this.editPane?.remove();
		const isUserOwner = this.loadedInfo.data.owner === thisUser.name;
		if (isUserOwner) {
			this.editPane = new Ph_MultiCreateOrEdit(`Edit ${this.loadedInfo.data.display_name}`, "Edit",
				this.editMulti.bind(this),
				{
					name: this.loadedInfo.data.display_name,
					descriptionMd: this.loadedInfo.data.description_md,
					visibility: this.loadedInfo.data.visibility
				}
			);
		}
		const dropDown = new Ph_DropDown(
			[
				isUserOwner && { label: "Edit", labelImgUrl: "/img/edit.svg", onSelectCallback: () => this.editPane.show() },
				isUserOwner && { label: "Delete", labelImgUrl: "/img/delete.svg", onSelectCallback: this.deleteMulti.bind(this) }
			],
			this.getKebabImg(),
			DirectionX.left,
			DirectionY.bottom,
			false
		);
		dropDown.$class("dropDownButton")[0].classList.add("transparentButtonAlt");
		overviewBar.appendChild(makeElement(
			"div",
			{ class: "subActionsWrapper" },
			[dropDown]));

		const createdDate = new Date(this.loadedInfo.data.created_utc * 1000);
		overviewBar.insertAdjacentHTML("beforeend", `
			<div data-tooltip="${this.loadedInfo.data.num_subscribers}">
				Subscribers: ${numberToShort(this.loadedInfo.data.num_subscribers)}
			</div>
			<div data-tooltip="${createdDate.toString()}">
				Created: ${createdDate.toDateString()}
			</div>
			<div>
				By: <a href="/user/${escADQ(this.loadedInfo.data.owner)}">u/${escHTML(this.loadedInfo.data.owner)}</a>
			</div>
		`);
		headerBar.appendChild(overviewBar);
		this.appendChild(makeElement("h1", { class: "title" }, this.loadedInfo.data.display_name));

		const description = makeElement("div", null,
			this.loadedInfo.data.description_html, true);
		emojiFlagsToImages(description);
		this.multiSubManager = document.createElement("div");
		this.multiSubManager.append(...this.makeMultiSubManager());
		linksToSpa(this.multiSubManager);
		this.appendChild(this.makeSwitchableBar([
			{ title: "Subreddits", content: this.multiSubManager },
			{ title: "Description", content: description },
		]));

		linksToSpa(this);
	}

	private makeMultiSubManager(): HTMLElement[] {
		const outElements: HTMLElement[] = [];

		const subCounter = makeElement("div", { class: "multiSubCounter" }, "xx/100");
		outElements.push(subCounter);

		if (this.loadedInfo.data.can_edit) {
			const addSubredditBar = makeElement("div", { class: "editableSub addSub" });

			const addSubButton = makeElement("button", { class: "addSub transparentButtonAlt" });
			addSubredditBar.appendChild(addSubButton);

			const addSubInput = makeElement("input", { type: "text", placeholder: "Subreddit" }) as HTMLInputElement;

			const subredditSelector = new Ph_SubredditSelector(!this.loadedInfo.data.over_18);
			subredditSelector.bind(addSubInput, true, async (subName: string, subData: RedditSubredditObj) => {
				await this.addSubToMulti(subData, this.feedUrl, true, addSubredditBar.parentElement);
				this.checkMultiMaxSubCount();
			});
			addSubredditBar.appendChild(subredditSelector);

			addSubredditBar.appendChild(addSubInput);
			addSubButton.addEventListener("click", () => subredditSelector.selectCurrent());

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

	private makeRemoveSubBar(sub: SubredditInfoBase) {
		const removeSubredditBar = makeElement("div", { class: "editableSub" });
		if (this.loadedInfo.data.can_edit) {
			const removeSubButton = makeElement("button", { class: "removeSub transparentButtonAlt" });
			removeSubredditBar.appendChild(removeSubButton);
			removeSubButton.addEventListener("click",
				async e => {
					await this.removeSubFromMulti(
						((e.currentTarget as HTMLElement).parentElement.$tag("ph-feed-link")[0] as Ph_FeedLink).getName(),
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
		if (!this.loadedInfo.data.subreddits.find(sub => sub.name === subName)) {
			new Ph_Toast(Level.warning, `r/${escHTML(subName)} does not exist in ${escHTML(multiPath)}`, { timeout: 6000 });
			return;
		}
		try {
			await removeSubFromMulti(multiPath, subName);
			editSubBar.remove();
			this.loadedInfo.data.subreddits.splice(this.loadedInfo.data.subreddits.findIndex(sub => sub.name === subName), 1);
			this.saveInfo();
		} catch (e) {
			new Ph_Toast(Level.error, "Error removing sub from multi");
			console.error("Error removing sub from multi");
			console.error(subName);
		}
	}

	private async addSubToMulti(subData: RedditSubredditObj, multiPath: string, sourceIsMulti: boolean, subsList?: HTMLElement) {
		const subName = subData.data.display_name;
		if (sourceIsMulti && this.loadedInfo.data.subreddits.find(sub => sub.name === subName)) {
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
				this.loadedInfo.data.subreddits.push({ data: subData.data as SubredditExpanded, name: response["name"] });
				this.loadedInfo.data.subreddits.sort((a, b) => stringSortComparer(a.name, b.name));
				this.saveInfo();
			}
			else if (localStorage[multiPath.toLowerCase()]) {
				// force reload on next load
				const multiData: StoredData<RedditMultiInfo> = JSON.parse(localStorage[multiPath.toLowerCase()]);
				multiData.lastUpdatedMsUTC = 1;
				localStorage[multiPath.toLowerCase()] = JSON.stringify(multiData);
			}
			if (subsList) {
				const newSubIndex = this.loadedInfo.data.subreddits.findIndex(sub => sub.name === response["name"]);
				subsList.children[newSubIndex + 1].insertAdjacentElement("afterend", this.makeRemoveSubBar(subData.data));
				(subsList.$tag("input")[0] as HTMLInputElement).value = "";
			}

		} catch (e) {
			new Ph_Toast(Level.error, "Error adding sub to multi");
			console.error("Error adding sub to multi");
			console.error(subName);
		}
	}

	private async editMulti(info) {
		const response = await createOrUpdateMulti(this.feedUrl, {
			display_name: info.name,
			description_md: info.descriptionMd,
			visibility: info.visibility
		});
		if ("error" in response) {
			new Ph_Toast(Level.error, "Error editing multi", { timeout: 2500 });
			return false;
		}
		if (response["reason"]) {
			new Ph_Toast(Level.error, `${response["fields"][0]}: ${response["explanation"]}`, { timeout: 3500 });
			return false;
		}
		this.loadInfo().then(this.displayInfo.bind(this));
		return true;
	}

	private deleteMulti() {
		new Ph_Toast(Level.warning, "Are you sure you want to delete this multireddit?", { onConfirm: async () => {
			const response = await deleteMulti(this.feedUrl);
			if (!isObjectEmpty(response)) {
				new Ph_Toast(Level.error, "Something went wrong", { timeout: 2500 });
				return;
			}
			new Ph_Toast(Level.success, "", { timeout: 3000 });
		} });
	}
}

customElements.define("ph-feed-info-multi", Ph_FeedInfoMulti);
