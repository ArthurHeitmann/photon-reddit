import { CreateOrUpdateModel, createOrUpdateMulti, deleteMulti, getMyMultis } from "../api/redditApi";
import Ph_Toast, { Level } from "../components/misc/toast/toast";
import { RedditMultiObj } from "../types/redditTypes";
import { UserSubscriptions } from "./UserSubscriptions";

export enum MultiChangeType {
	created, edited, deleted
}

export interface MultisChangeEvent {
	multi: RedditMultiObj,
	changeType: MultiChangeType,
}

export class MultiManager extends UserSubscriptions<RedditMultiObj, MultisChangeEvent> {

	async load(): Promise<void> {
		let cached = this.loadUserContentFromLs("multis");
		if (cached && "error" in cached)
			cached = null
		if (cached === null)
			await this.fetchMultis();
	}

	private async fetchMultis() {
		const multis = await getMyMultis();
		if ("error" in multis) {
			new Ph_Toast(Level.error, "Error getting multireddits");
			return;
		}
		this.userContent = multis;
		this.cacheUserContentLs("multis", true);
	}

	/** @return success */
	async createOrUpdateMulti(multiPath: string, isSubscribed: boolean, createOrUpdateModel?: CreateOrUpdateModel): Promise<boolean> {
		if (isSubscribed) {
			const newMulti: RedditMultiObj = await createOrUpdateMulti(multiPath, createOrUpdateModel);
			if ("error" in newMulti) {
				new Ph_Toast(Level.error, "Error editing multi", { timeout: 2500 });
				return false;
			}
			if (newMulti["reason"]) {
				new Ph_Toast(Level.error, `${newMulti["fields"][0]}: ${newMulti["explanation"]}`, { timeout: 3500 });
				return false;
			}
			const existingIndex = this.userContent.findIndex(multi => multi.data.path === newMulti.data.path);
			if (existingIndex !== -1)
				this.userContent[existingIndex] = newMulti;
			else
				this.userContent.push(newMulti);
			this.dispatchChange({ multi: newMulti, changeType: existingIndex === -1 ? MultiChangeType.created : MultiChangeType.edited });
		}
		else {
			const deleteSuccess = await deleteMulti(multiPath);
			if (!deleteSuccess) {
				new Ph_Toast(Level.error, "Error deleting multi", { timeout: 3000 });
				return false;
			}
			const existingIndex = this.userContent.findIndex(multi => multi.data.path.toLowerCase() === multiPath.toLowerCase());
			if (existingIndex === -1)
				return true;
			const multiInfo = this.userContent[existingIndex];
			this.userContent.splice(existingIndex, 1);
			this.dispatchChange({ multi: multiInfo, changeType: MultiChangeType.deleted });
		}
		this.cacheUserContentLs("multis", false);
		return true;
	}
}
