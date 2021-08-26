type OnSubscriptionChangeCallback<EventType> = (e: EventType) => void;
export abstract class UserSubscriptions<ContentType, EventData> {
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
}