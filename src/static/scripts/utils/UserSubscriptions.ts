import { QuickCaches } from "../components/multiUser/userData";
import Users from "../components/multiUser/userManagement";
import { StoredData } from "../types/misc";

export type OnSubscriptionChangeCallback<EventType> = (e: EventType) => void;
export abstract class UserSubscriptions<ContentType, EventData> {
	protected lastTimeDataUpdatedMs = Date.now();
	protected userContent: ContentType[] = [];
	protected changeSubscribers: OnSubscriptionChangeCallback<EventData>[] = [];

	abstract load(): void;

	get rawData(): ContentType[] {
		return this.userContent;
	}

	listenForChanges(handler: OnSubscriptionChangeCallback<EventData>) {
		this.changeSubscribers.push(handler);
	}

	disconnectListener(handler: OnSubscriptionChangeCallback<EventData>) {
		const index = this.changeSubscribers.findIndex(listener => listener === handler);
		if (index !== -1)
			this.changeSubscribers.splice(index, 1);
	}

	protected dispatchChange(event: EventData) {
		for (const handler of this.changeSubscribers) {
			try {
				handler(event);
			}
			catch {}
		}
	}

	protected cacheUserContentLs(storageKey: keyof QuickCaches, useCurrentTime: boolean) {
		Users.current.set(["caches", storageKey], {
			lastUpdatedMsUTC: useCurrentTime ? Date.now() : this.lastTimeDataUpdatedMs,
			data: this.userContent
		});
	}

	protected loadUserContentFromLs(storageKey: keyof QuickCaches): ContentType[] | null {
		try {
			const storedData = Users.current.d.caches[storageKey] as StoredData<ContentType[]>;
			this.userContent = storedData.data;
			if (Date.now() - storedData.lastUpdatedMsUTC > Users.current.d.photonSettings.userShortCacheTTLMs)
				return null;
		} catch (e) {
			return null;
		}
	}
}
