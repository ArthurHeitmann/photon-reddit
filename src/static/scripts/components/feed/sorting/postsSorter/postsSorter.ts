import { PostSorting, SortPostsOrder, SortPostsTimeFrame } from "../../../../utils/types.js";
import Ph_DropDownEntry from "../../../misc/dropDownEntry/dropDownEntry.js";
import { Ph_Feed } from "../../feed.js";
import Ph_PostsFeed from "../../postsFeed/postsFeed.js";

export default class Ph_PostsSorter extends HTMLElement {
	cancelMenuFuncRef: (e) => void;
	feed: Ph_Feed;

	constructor(feed: Ph_PostsFeed) {
		super();

		this.cancelMenuFuncRef = this.cancelMenu.bind(this);
		this.feed = feed;
		this.className = "dropDown";

		const dropDownButton = document.createElement("button");
		this.appendChild(dropDownButton);
		dropDownButton.className = "dropDownButton";
		dropDownButton.innerText = "Sorting by; [...]";

		const dropDownArea = document.createElement("div");
		this.appendChild(dropDownArea);
		dropDownArea.className = "dropDownArea";

		const sortHot = new Ph_DropDownEntry("Hot", [SortPostsOrder.hot], this.handleOnSelect.bind(this));
		dropDownArea.appendChild(sortHot);
		const sortTop = new Ph_DropDownEntry("Top", [SortPostsOrder.top], this.handleOnSelect.bind(this), [SortPostsTimeFrame.hour]);
		dropDownArea.appendChild(sortTop);
		const sortRising = new Ph_DropDownEntry("Rising", [SortPostsOrder.rising], this.handleOnSelect.bind(this));
		dropDownArea.appendChild(sortRising);
		const sortNew = new Ph_DropDownEntry("New", [SortPostsOrder.new], this.handleOnSelect.bind(this));
		dropDownArea.appendChild(sortNew);
		const sortControversial = new Ph_DropDownEntry("Controversial", [SortPostsOrder.controversial], this.handleOnSelect.bind(this), [SortPostsTimeFrame.hour]);
		dropDownArea.appendChild(sortControversial);
		const sortGilded = new Ph_DropDownEntry("Gilded", [SortPostsOrder.gilded], this.handleOnSelect.bind(this));
		dropDownArea.appendChild(sortGilded);

		dropDownButton.addEventListener("click", this.showMenu.bind(this));
	}

	handleOnSelect(e) {
		this.closeMenu();

		const data: any[] = e.currentTarget.data;

		const selection: PostSorting = {
			order: data[0],
			timeFrame: data[1]
		};

		this.feed.setSorting(selection);
	}

	showMenu() {
		this.classList.add("expanded");
		window.addEventListener("click", this.cancelMenuFuncRef);
	}
	
	closeMenu() {
		this.classList.remove("expanded");
		window.removeEventListener("click", this.cancelMenuFuncRef);
	}
	
	cancelMenu(e) {
		if (!this.contains(e.target))
			this.closeMenu();
	}
}

customElements.define("ph-posts-sorter", Ph_PostsSorter);
