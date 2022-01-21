import {RedditApiObj, RedditListingObj} from "../../../types/redditTypes";
import {redditApiRequest} from "../../../api/redditApi";
import Ph_Toast, {Level} from "../../misc/toast/toast";

/** Loads reddit thing from a listing url */
export default class RedditListingStream<T = RedditApiObj> {
	onNewItems: (items: T[]) => void;
	onItemsCleared: () => void;
	onLoadingChange: (isLoading: boolean) => void;
	onUrlChange: (url: string) => void;

	url: string;
	private afterId: string;
	private isLoading = false;

	init(url: string, initialData: RedditListingObj<T>) {
		this.url = url;
		this.afterId = initialData.data.after;
		if (initialData.data.children.length > 0)
			this.onNewItems?.(initialData.data.children);
	}

	async loadMore(): Promise<void> {
		if (!this.afterId || this.isLoading)
			return;
		this.isLoading = true;
		this.onLoadingChange?.(this.isLoading);
		try {
			const newItems: RedditListingObj<T> = await redditApiRequest(this.url, [["after", this.afterId]], false);
			this.afterId = newItems.data.after;
			this.onNewItems?.(newItems.data.children);
			return;
		}
		finally {
			this.isLoading = false;
			this.onLoadingChange?.(this.isLoading);
		}
	}

	hasReachedEnd(): boolean {
		return !Boolean(this.afterId);
	}

	async setNewUrl(url: string, _isSecondsAttempt = false) {
		this.url = url;
		try {
			const initialData = await redditApiRequest(url, [], false);
			this.onItemsCleared?.();
			this.onNewItems?.(initialData.data.children);
		} catch (err) {
			console.error(err);
			new Ph_Toast(
				Level.error,
				`Error changing url!${_isSecondsAttempt ? "" : ` Try again?`}`,
				{ onConfirm: _isSecondsAttempt ? null : () => this.setNewUrl(url, true) });
			throw err;
		}
	}
}
