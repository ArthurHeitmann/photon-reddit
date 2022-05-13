export default abstract class UniversalFeedView extends HTMLElement {
	loadMoreCallback: () => void;
	onBackAreaClickCallback: () => void;
	abstract fromElements(elements: HTMLElement[]): UniversalFeedView;
	abstract fromOtherView(view: UniversalFeedView): UniversalFeedView;
	abstract addElement(element: HTMLElement): void;
	abstract onScroll(): void;
	abstract onResize(): void;
	abstract clear(): void;
	abstract getElements(): HTMLElement[];
}
