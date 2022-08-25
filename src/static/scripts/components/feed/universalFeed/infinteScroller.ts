import {makeElement} from "../../../utils/utils";
import {isElementInViewport} from "../../../utils/htmlStatics";
import {Ph_ViewState} from "../../viewState/viewState";


/** Visibility of an item in an infinite scroller (IS) */
enum ItemISVisibility {
	visible, hidden, removed
}

enum RemovedItemPlaceholderPosition {
	top, bottom
}
/** State of an item in an infinite scroller (IS) */
interface ItemISState {
	element: HTMLElement,
	visibility: ItemISVisibility,
	removedPlaceholderPosition?: RemovedItemPlaceholderPosition,
	removedPlaceholderHeight?: number,
}

export default class Ph_InfiniteScroller extends HTMLElement {
	allItems: ItemISState[] = [];
	private visToHidIntObs: IntersectionObserver;
	private hidToVisIntObs: IntersectionObserver;
	private hidToRemIntObs: IntersectionObserver;
	private remToHidIntObs: IntersectionObserver;

	private topPlaceholder: HTMLElement;
	private bottomPlaceholder: HTMLElement;
	private topPlaceholderHeight = 0;
	private bottomPlaceholderHeight = 0;

	constructor() {
		super();

		this.classList.add("infiniteScroller");

		this.topPlaceholder = makeElement("div", { class: "itemPlaceholder" });
		this.bottomPlaceholder = makeElement("div", { class: "itemPlaceholder" });
		this.topPlaceholder.addEventListener("mousemove", this.forceOnRemToHid.bind(this));
		this.topPlaceholder.addEventListener("mouseenter", this.forceOnRemToHid.bind(this));
		this.bottomPlaceholder.addEventListener("mousemove", this.forceOnRemToHid.bind(this));
		this.bottomPlaceholder.addEventListener("mouseenter", this.forceOnRemToHid.bind(this));
		this.append(this.topPlaceholder)
		this.append(this.bottomPlaceholder);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.top);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);

		this.initializeIntersectionObservers();
	}

	addElement(element: HTMLElement) {
		const itemIsState: ItemISState = {
			element: element,
			visibility: ItemISVisibility.visible
		};
		this.allItems.push(itemIsState);
		if (Math.round(Math.abs(this.bottomPlaceholderHeight)) < 10) {
			this.bottomPlaceholder.previousSibling.after(element);
			this.observeItem(itemIsState);
		}
		else {
			this.bottomPlaceholder.after(element);
			const elementHeight = this.getItemHeight(element);
			this.bottomPlaceholderHeight += elementHeight;
			this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);
			element.remove();
			itemIsState.visibility = ItemISVisibility.removed;
			itemIsState.removedPlaceholderPosition = RemovedItemPlaceholderPosition.bottom;
			itemIsState.removedPlaceholderHeight = elementHeight;
		}
	}

	clearElements() {
		for (const item of this.allItems) {
			this.visToHidIntObs.unobserve(item.element);
			this.hidToVisIntObs.unobserve(item.element);
			this.hidToRemIntObs.unobserve(item.element);
			this.remToHidIntObs.unobserve(item.element);
			item.element.remove();
			item.element.classList.remove("isHidden");
		}
		this.allItems = [];
		this.topPlaceholderHeight = 0;
		this.bottomPlaceholderHeight = 0;
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.top);
		this.updatePlaceholderHeight(RemovedItemPlaceholderPosition.bottom);
	}

	areAllBottomItemsVisible() {
		return this.allItems
			.filter(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.bottom)
			.length === 0;
	}

	private isVisible() {
		return this.isConnected && !Ph_ViewState.getViewOf(this).classList.contains("hide");
	}

	/** Reinitialize IntersectionObservers on resize, because they should be relative to the screen height, but are
	 * constructed with pixels. */
	onResize() {
		if (!this.isVisible())
			return;
		this.initializeIntersectionObservers();
	}

	/** Construct IS related IntersectionObservers relative to screen height and observe feed items. */
	private initializeIntersectionObservers() {
		const screenHeight = window.innerHeight;

		this.visToHidIntObs?.disconnect();
		this.visToHidIntObs = new IntersectionObserver(
			this.onVisToHid.bind(this),
			{
				threshold: [0],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.hidToVisIntObs?.disconnect();
		this.hidToVisIntObs = new IntersectionObserver(
			this.onHidToVis.bind(this),
			{
				threshold: [0, 0.8],
				rootMargin: `${screenHeight}px 0px ${screenHeight}px 0px`
			}
		);
		this.hidToRemIntObs?.disconnect();
		this.hidToRemIntObs = new IntersectionObserver(
			this.onHidToRem.bind(this),
			{
				threshold: [0],
				rootMargin: `${screenHeight * 2 + 50}px 0px ${screenHeight * 2 + 50}px 0px`
			}
		);
		this.remToHidIntObs?.disconnect();
		this.remToHidIntObs = new IntersectionObserver(
			this.onRemToHid.bind(this),
			{
				threshold: Array(5).fill(0).map((_, i) => i * 0.1),
				rootMargin: `${screenHeight * 2}px 0px ${screenHeight * 2}px 0px`
			}
		);

		for (const item of this.allItems)
			this.observeItem(item);
		this.remToHidIntObs.observe(this.topPlaceholder);
		this.remToHidIntObs.observe(this.bottomPlaceholder);
	}

	private observeItem(item: ItemISState) {
		switch (item.visibility) {
			case ItemISVisibility.visible:
				this.visToHidIntObs.observe(item.element);
				break;
			case ItemISVisibility.hidden:
				this.hidToRemIntObs.observe(item.element);
				this.hidToVisIntObs.observe(item.element);
				break;
		}
	}

	private updatePlaceholderHeight(position: RemovedItemPlaceholderPosition) {
		if (position === RemovedItemPlaceholderPosition.top)
			this.topPlaceholder.style.setProperty("--height", `${this.topPlaceholderHeight.toFixed(2)}px`)
		else if (position === RemovedItemPlaceholderPosition.bottom)
			this.bottomPlaceholder.style.setProperty("--height", `${this.bottomPlaceholderHeight.toFixed(2)}px`)
		else
			throw "impossible!"
	}

	/** If an items is more than 1 screen height away from the viewport, it is hidden and hid --> X observers are applied */
	private onVisToHid(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't outside of bounds
			if (
				!(entry.intersectionRatio === 0 && !entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width && isElementInViewport(entry.target)
			) {
				continue;
			}

			// update state (hide the element)
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.hidden;
					element.classList.add("isHidden");

					// update observers for new bounds
					this.visToHidIntObs.unobserve(element);
					this.hidToVisIntObs.observe(element);
					this.hidToRemIntObs.observe(element);

				}
			);
		}
	}

	/** If an items is less than 1 screen height away from the viewport, it is visible and vis --> X observers are applied */
	private onHidToVis(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't inside of bounds
			if (
				!(entry.intersectionRatio > 0 && entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width
			) {
				continue;
			}

			// update state (show the element)
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.visible;
					element.classList.remove("isHidden");

					// update observers for new bounds
					this.hidToVisIntObs.unobserve(element);
					this.hidToRemIntObs.unobserve(element);
					this.visToHidIntObs.observe(element);
				}
			)
		}
	}

	/** If an items is more than 2 screen height away from the viewport, it is removed from the DOM,
	 * and it's height is added to a placeholder element. No observers are applied. Observers are already applied to placeholders. */
	private onHidToRem(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		for (const entry of entries) {
			// continue if item isn't inside of bounds
			if (
				!(entry.intersectionRatio === 0 && !entry.isIntersecting) ||
				!entry.boundingClientRect.height && !entry.boundingClientRect.width
			) {
				continue;
			}

			// determine placeholder position to which the items' height will be added
			const placeholderPosition = entry.boundingClientRect.top > 0
				? RemovedItemPlaceholderPosition.bottom
				: RemovedItemPlaceholderPosition.top;
			const itemIndex = this.allItems.findIndex(item => item.element === entry.target);
			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					const itemHeight = this.getItemHeight(element);
					itemState.removedPlaceholderHeight = itemHeight;
					itemState.removedPlaceholderPosition = placeholderPosition;
					if (placeholderPosition === RemovedItemPlaceholderPosition.top)
						this.topPlaceholderHeight += itemHeight;
					else
						this.bottomPlaceholderHeight += itemHeight;
					this.updatePlaceholderHeight(placeholderPosition)

					itemState.visibility = ItemISVisibility.removed;
					element.remove();
					element.classList.remove("isHidden");

					this.hidToVisIntObs.unobserve(element);
					this.hidToRemIntObs.unobserve(element);
				}
			)
		}
	}

	/** If a placeholder is less than 2 screen height away from the viewport, items are added back to the DOM and their
	 * old height is removed from the placeholder. And hid --> X observers are applied */
	private onRemToHid(entries: IntersectionObserverEntry[]) {
		if (!this.isVisible())
			return;

		const entry = entries[0];
		// continue if item isn't inside of bounds
		if (
			!(entry.intersectionRatio > 0 && entry.isIntersecting) ||
			entry.boundingClientRect.height === 0
		) {
			return;
		}

		const placeholderPosition = entry.target === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	/** IntersectionObservers are sometimes unreliable, therefore force transition on certain events */
	private forceOnRemToHid(e: InputEvent) {
		const placeholderPosition = e.currentTarget === this.topPlaceholder
			? RemovedItemPlaceholderPosition.top
			: RemovedItemPlaceholderPosition.bottom;
		this.popPlaceholderItems(placeholderPosition);
	}

	/** Items are added back to the DOM and its old height is removed from the placeholder, until the placeholder is
	 * more than 2 screen heights away. And hid --> X observers are applied */
	private popPlaceholderItems(postion: RemovedItemPlaceholderPosition) {
		const placeholder = postion === RemovedItemPlaceholderPosition.top
			? this.topPlaceholder
			: this.bottomPlaceholder;

		let shouldDoNextRun = true;
		// do while placeholder is less than 2 screen heights away
		do {
			const itemIndex = postion === RemovedItemPlaceholderPosition.top
				// last item in top placeholder
				? this.allItems.length - 1 - this.allItems.slice().reverse().findIndex(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
				// first item in bottom placeholder
				: this.allItems.findIndex(item => item.removedPlaceholderPosition === RemovedItemPlaceholderPosition.bottom);
			if (itemIndex === -1)
				return;

			this.changeStateForItemAndHiddenNeighbours(
				itemIndex,
				(itemState, element) => {
					itemState.visibility = ItemISVisibility.hidden;
					// If items height is 0 when removing and > 0 when adding back, and it's in the top placeholder
					// the scroll position will jump around in firefox, so it needs to be compensated
					const shouldTryFixScroll = postion === RemovedItemPlaceholderPosition.top && itemState.removedPlaceholderHeight === 0;
					const beforeTopScroll = document.scrollingElement.scrollTop;

					if (itemState.removedPlaceholderPosition === RemovedItemPlaceholderPosition.top)
						this.topPlaceholderHeight -= itemState.removedPlaceholderHeight;
					else
						this.bottomPlaceholderHeight -= itemState.removedPlaceholderHeight;
					this.updatePlaceholderHeight(itemState.removedPlaceholderPosition)
					delete itemState.removedPlaceholderPosition;
					delete itemState.removedPlaceholderHeight;
					element.classList.add("isHidden");
					if (postion === RemovedItemPlaceholderPosition.top)
						placeholder.after(element);
					else
						placeholder.before(element);

					if (shouldTryFixScroll) {
						// if needed, scroll by height/scroll difference
						const newHeight = this.getItemHeight(element);
						const scrollDiff = document.scrollingElement.scrollTop - beforeTopScroll;
						if (newHeight > 0 && Math.abs(newHeight - scrollDiff) > 10)
							document.scrollingElement.scrollBy(0, newHeight - scrollDiff);
					}

					this.hidToVisIntObs.observe(element);
					this.hidToRemIntObs.observe(element);
				},
				true
			)
			// re-trigger observer and see if it's still intersecting
			this.remToHidIntObs.unobserve(placeholder);
			this.remToHidIntObs.observe(placeholder);
			const newEntries = this.remToHidIntObs.takeRecords();
			shouldDoNextRun = newEntries.length > 0;
		} while (shouldDoNextRun);
	}

	private getItemHeight(element: HTMLElement): number {
		let itemHeight = element.offsetHeight;
		if (itemHeight > 0) {
			const itemStyle = getComputedStyle(element);
			itemHeight += parseFloat(itemStyle.marginTop) + parseFloat(itemStyle.marginBottom);
		}
		return itemHeight;
	}

	/** Apply state transition function to item and its hidden (display: none, because of settings like hide nsfw, hide seen, filters)
	 * neighbours. Transition is applied to hidden items, because they otherwise don't interact with the intersection observers. */
	private changeStateForItemAndHiddenNeighbours(
		itemIndex: number,
		changeState: (itemState: ItemISState, element: HTMLElement) => void,
		isReversed = false
	) {
		if (this.allItems.length <= itemIndex) {
			console.warn(`Trying to change state for item that doesn't exist (${itemIndex}/${this.allItems.length})`);
			return;
		}
		const sameVisibility = this.allItems[itemIndex].visibility;
		let firstI = itemIndex;
		while (this.isItemHiddenNeighbour(firstI - 1, sameVisibility))
			firstI--;
		let lastI = itemIndex;
		while (this.isItemHiddenNeighbour(lastI + 1, sameVisibility))
			lastI++;

		if (isReversed) {
			for (let i = lastI; i >= firstI; i--)
				changeState(this.allItems[i], this.allItems[i].element);
		}
		else {
			for (let i = firstI; i < lastI + 1; i++)
				changeState(this.allItems[i], this.allItems[i].element);
		}
	}

	private isItemHiddenNeighbour(index: number, targetVisibility: ItemISVisibility): boolean {
		return this.allItems[index]?.visibility === targetVisibility && (
			this.allItems[index]?.element.classList.contains("remove") ||
			this.allItems[index]?.removedPlaceholderHeight < 1
		);
	}

	get lastInView(): HTMLElement {
		const bounds = this.getBoundingClientRect();
		const viewportHeight = Math.max(0,
			bounds.top > 0
				? Math.min(bounds.height, window.innerHeight - bounds.top)
				: Math.min(bounds.bottom, window.innerHeight)
		);
		const centerX = bounds.left + bounds.width / 2;
		const centerY = Math.max(0, bounds.top) + viewportHeight / 2;
		const offsetY = viewportHeight / 8;
		for (const y of [0, -1, 1, -2, 2, -3, 3]) {
			let elements = document.elementsFromPoint(centerX, centerY + y * offsetY) as HTMLElement[];
			elements = elements.filter(element => Array.from(this.children).includes(element));
			if (elements.length > 0) {
				return elements[0];
			}
		}
		return null;
	}
}

customElements.define("ph-infinite-scroller", Ph_InfiniteScroller);
