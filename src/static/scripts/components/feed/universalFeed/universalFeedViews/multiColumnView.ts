import UniversalFeedView from "./universalFeedView";
import Ph_InfiniteScroller from "../infinteScroller";
import {remToPx} from "../../../../utils/htmlStatics";
import {sleep} from "../../../../utils/utils";

export default class Ph_MultiColumnView extends UniversalFeedView {
	private isSingleColumn: boolean;
	private columns: Ph_InfiniteScroller[] = [];

	constructor(isSingleColumn: boolean) {
		super();

		this.classList.add("multiColumnView");

		this.setIsSingleColumn(isSingleColumn);

		this.addEventListener("click", e => {
			if (!(e.target === e.currentTarget || this.columns.includes(e.target as Ph_InfiniteScroller)))
				return;
			if (!this.isSingleColumn)
				return;
			const style = getComputedStyle(this);
			const paddingLeft = parseInt(style.paddingLeft);
			const paddingRight = parseInt(style.paddingRight);
			if (e.clientX + 25 > paddingLeft && e.clientX - 25 < window.innerWidth - paddingRight)
				return;
			this.onBackAreaClickCallback?.();
		});
	}

	setIsSingleColumn(isSingleColumn: boolean): void {
		this.isSingleColumn = isSingleColumn;
		this.setColumnCount(isSingleColumn ? 1 : this.calcColumnCount());
	}

	private setColumnCount(count: number): void {
		count = Math.max(1, count);
		if (count === this.columnCount)
			return;

		const elementInView = this.getElementInView();

		if (count === 1) {
			this.classList.add("singleColumn");
			this.classList.remove("multiColumn");
		}
		else {
			this.classList.add("multiColumn");
			this.classList.remove("singleColumn");
		}

		const allElements = this.getElements();
		this.clear();

		for (const col of this.columns)
			col.clearElements();
		const oldColumns = this.columns.splice(count, this.columns.length - count);
		for (const col of oldColumns)
			col.remove();
		for (let i = this.columns.length; i < count; i++) {
			const column = new Ph_InfiniteScroller();
			this.columns.push(column);
			this.append(column);
		}

		for (const element of allElements)
			this.addElement(element);

		sleep(1).then(() => elementInView?.scrollIntoView({ behavior: "smooth" }));
	}

	addElement(element: HTMLElement) {
		this.getSmallestColumn().addElement(element);
	}

	private getSmallestColumn(): Ph_InfiniteScroller {
		let smallest = this.columns[0];
		let smallestHeight = smallest.offsetHeight;
		for (let i = 1; i < this.columnCount; i++) {
			const column = this.columns[i];
			const colHeight = column.offsetHeight;
			if (colHeight >= smallestHeight)
				continue;
			smallest = column;
			smallestHeight = colHeight;
		}

		return smallest;
	}

	private calcColumnCount(): number {
		const postMinWidthRem = getComputedStyle(document.body).getPropertyValue("--v-widthM");
		const postMinWidth = remToPx(parseInt(postMinWidthRem)) * 0.75;
		return Math.ceil(window.innerWidth / postMinWidth);
	}

	onScroll() {
		let distanceToBottom: number;
		let windowHeightMultiplier: number;
		if (this.isSingleColumn) {
			if (!this.columns[0].areAllBottomItemsVisible())
				return;
			distanceToBottom = document.scrollingElement.scrollHeight - document.scrollingElement.scrollTop - window.innerHeight;
			windowHeightMultiplier = 1.5;
		}
		else {
			if (!this.columns.some(col => col.areAllBottomItemsVisible()))
				return;
			let minBotDist = Infinity;
			for (const column of this.columns) {
				const distanceToBottom = column.getBoundingClientRect().bottom - window.innerHeight;
				if (distanceToBottom < minBotDist)
					minBotDist = distanceToBottom;
			}
			distanceToBottom = minBotDist;
			windowHeightMultiplier = 2;
		}

		if (distanceToBottom < window.innerHeight * windowHeightMultiplier)
			this.loadMoreCallback?.();
	}

	onResize() {
		for (const column of this.columns)
			column.onResize();
		this.setIsSingleColumn(this.isSingleColumn);
	}

	clear() {
		for (const column of this.columns) {
			column.clearElements();
		}
	}

	getElements(): HTMLElement[] {
		return this.columns
			.map(c => c.allItems)
			.flat()
			.map(e => e.element);
	}

	getElementInView(): HTMLElement {
		return this.columns[0]?.lastInView;
	}

	get columnCount(): number {
		return this.columns.length;
	}
}

customElements.define("ph-multi-column-view", Ph_MultiColumnView);
