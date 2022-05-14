import UniversalFeedView from "./universalFeedView";
import Ph_PostAndComments, {PostCommentsListings} from "../../../postAndComments/postAndComments";
import Ph_Post from "../../../post/post";
import {makeElement, sleep} from "../../../../utils/utils";
import {redditApiRequest} from "../../../../api/redditApi";
import {nonDraggableElement} from "../../../../utils/htmlStatics";
import ViewsStack from "../../../../historyState/viewsStack";
import Ph_PhotonBaseElement from "../../../photon/photonBaseElement/photonBaseElement";

interface IndividualElementData {
	element: HTMLElement;
	expandedElement?: HTMLElement;
	scrollPosition?: number;
}

export default class Ph_IndividualPostScroller extends UniversalFeedView {
	private allElements: IndividualElementData[] = [];
	private currentIndex: number = -1;
	private initialUrlHint: string;

	private mainWrapper: HTMLElement;
	private prevBtn: HTMLButtonElement;
	private nextBtn: HTMLButtonElement;

	constructor() {
		super();

		this.classList.add("individualPostScroller");

		this.mainWrapper = makeElement("div", { class: "mainWrapper" },[
			makeElement("h1", { class: "center-h-alt absolute" }, "Nothing here ¯\\_(ツ)_/¯")]);
		this.prevBtn = makeElement("button", { class: "prev transparentButtonAlt", onclick: this.onPrevClick.bind(this), disabled: "true" }, [
			nonDraggableElement(makeElement("img", { src: "/img/rightArrow.svg", alt: "<" }))
			]) as HTMLButtonElement;
		this.nextBtn = makeElement("button", { class: "next transparentButtonAlt", onclick: this.onNextClick.bind(this), disabled: "true" }, [
			nonDraggableElement(makeElement("img", { src: "/img/rightArrow.svg", alt: ">" }))
			]) as HTMLButtonElement;

		this.append(this.mainWrapper, this.prevBtn, this.nextBtn);

		this.initialUrlHint = decodeURIComponent(ViewsStack.getCurrentState().state.url.split("#")[1]);
	}

	fromOtherView(view: UniversalFeedView): void {
		const elementInView = view.getElementInView();
		super.fromOtherView(view);
		sleep(0).then(() => {
			if (!elementInView)
				return;
			const elementIndex = this.allElements.findIndex(e => e.element === elementInView);
			if (elementIndex !== -1)
				this.switchToElement(elementIndex);
		});
	}

	addElement(element: HTMLElement): void {
		this.allElements.push({ element });
		if (this.currentIndex === -1)
			this.switchToElement(0);
		else if (this.testElementForUrlHint(element)) {
			this.switchToElement(this.allElements.length - 1);
			this.initialUrlHint = undefined;
		}

		this.updateButtons();
	}

	private onPrevClick() {
		const newIndex = Math.max(this.currentIndex - 1, 0);
		this.switchToElement(newIndex);
	}

	private onNextClick() {
		const newIndex = Math.min(this.currentIndex + 1, this.allElements.length - 1);
		this.switchToElement(newIndex);
	}

	private switchToElement(index: number) {
		if (index === this.currentIndex)
			return;
		if (index < 0 || index >= this.allElements.length)
			return;

		if (this.allElements[this.currentIndex])
			this.allElements[this.currentIndex].scrollPosition = document.scrollingElement.scrollTop;
		this.mainWrapper.children[0]?.remove();

		this.currentIndex = index;
		this.mainWrapper.appendChild(this.getOrMakeElement(index));
		if ("scrollPosition" in this.allElements[this.currentIndex])
			document.scrollingElement.scrollTop = this.allElements[this.currentIndex].scrollPosition;

		this.updateButtons();

		if (this.currentIndex + 3 >= this.allElements.length)
			this.loadMoreCallback?.();
	}

	private updateButtons() {
		this.prevBtn.disabled = this.currentIndex === 0;
		this.nextBtn.disabled = this.currentIndex === this.allElements.length - 1;
	}

	clear(): void {
		for (const element of this.allElements) {
			element.element.classList.add("isInFeed");
			if (element.expandedElement instanceof Ph_PhotonBaseElement) {
				element.expandedElement.cleanup();
				const cleanupElements = element.expandedElement.$css("[requiresCleanup]") as HTMLCollectionOf<Ph_PhotonBaseElement>;
				for (const elem of cleanupElements)
					elem.cleanup();
			}
		}
		this.getElement(this.currentIndex)?.remove();
		this.allElements = [];
		this.currentIndex = -1;
		const urlParts = ViewsStack.getCurrentState().state.url.split("#");
		ViewsStack.changeCurrentUrl(urlParts[0]);
	}

	private getElement(index: number): HTMLElement {
		return this.allElements[index]?.expandedElement || this.allElements[index]?.element;
	}

	private getOrMakeElement(index: number): HTMLElement {
		const elementData = this.allElements[index];
		if (elementData.expandedElement)
			return elementData.expandedElement;
		if (elementData.element instanceof Ph_Post) {
			const post = elementData.element as Ph_Post;
			post.classList.remove("isInFeed");
			const postAndComments = new Ph_PostAndComments(null, {
				post: post,
				subredditPrefixed: post.data.subreddit_name_prefixed,
				userPrefixed: `u/${post.data.author}`,
			});
			elementData.expandedElement = postAndComments;
			redditApiRequest(post.data.permalink, [], false).then((data: PostCommentsListings) => {
				post.updateWithData(data[0].data.children[0].data);
				postAndComments.initWithData(data);
			});

			this.updateUrlHint(post.data.permalink);
			return postAndComments;
		}
		return elementData.element;
	}

	private updateUrlHint(url: string) {
		if (!url)
			return;
		const urlParts = ViewsStack.getCurrentState().state.url.split("#");
		ViewsStack.changeCurrentUrl(`${urlParts[0]}#${encodeURIComponent(url)}`);
	}

	private testElementForUrlHint(element: HTMLElement): boolean {
		if (!(element instanceof Ph_Post))
			return false;
		const post = element as Ph_Post;
		const url = post.data.permalink;

		return url === this.initialUrlHint;
	}

	getElements(): HTMLElement[] {
		return this.allElements.map(element => element.element);
	}

	getElementInView(): HTMLElement {
		return this.allElements[this.currentIndex]?.element;
	}

	onResize(): void {
	}

	onScroll(): void {
	}
}

customElements.define("ph-individual-post-scroller", Ph_IndividualPostScroller);
