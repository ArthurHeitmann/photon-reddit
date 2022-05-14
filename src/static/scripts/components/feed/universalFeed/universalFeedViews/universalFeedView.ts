import {sleep} from "../../../../utils/utils";

export default abstract class UniversalFeedView extends HTMLElement {
	loadMoreCallback: () => void;
	onBackAreaClickCallback: () => void;

	abstract addElement(element: HTMLElement): void;
	abstract onScroll(): void;
	abstract onResize(): void;
	abstract clear(): void;
	abstract getElements(): HTMLElement[];
	abstract getElementInView(): HTMLElement;

	fromOtherView(view: UniversalFeedView): void {
		const otherElements = view.getElements();
		view.clear();
		this.clear();

		sleep(0).then(() => {
			for (const element of otherElements)
				this.addElement(element);
		});
	}
}
