import { StoredData, User } from "./globals";

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
		for (const handler of this.changeSubscribers)
			handler(event);
	}

	protected cacheUserContentLs(localstorageKey: string, useCurrentTime: boolean) {
		localStorage[localstorageKey] = JSON.stringify(<StoredData<ContentType[]>> {
			lastUpdatedMsUTC: useCurrentTime ? Date.now() : this.lastTimeDataUpdatedMs,
			data: this.userContent
		});
	}

	protected loadUserContentFromLs(localstorageKey: string): ContentType[] | null {
		try {
			const storedData: StoredData<ContentType[]> = JSON.parse(localStorage[localstorageKey]);
			this.userContent = storedData.data;
			if (Date.now() - storedData.lastUpdatedMsUTC > User.refreshEveryNMs)
				return null;
		} catch (e) {
			return null;
		}
	}
}