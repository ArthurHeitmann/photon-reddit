import { initiateLogin } from "../../../auth/loginHandler";
import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager";
import ViewsStack from "../../../historyState/viewsStack";
import { RedditApiObj, RedditSubredditObj } from "../../../types/redditTypes";
import { elementWithClassInTree, isElementIn } from "../../../utils/htmlStuff";
import { MultiChangeType, MultisChangeEvent } from "../../../utils/MultiManager";
import { SubsChangeEvent } from "../../../utils/subredditManager";
import {
	ensurePageLoaded,
	getUserIconUrl,
	hasHTML,
	isFakeSubreddit,
	makeElement,
	numberToShort
} from "../../../utils/utils";
import Ph_FeedLink from "../../link/feedLink/feedLink";
import Ph_MultiCreateOrEdit, { MultiBasicInfo } from "../../misc/multiCreateOrEdit/multiCreateOrEdit";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import UserData, { guestUserName } from "../../multiUser/userData";
import Users from "../../multiUser/userManagement";
import Ph_Header from "../header/header";

/**
 * A Dropdown in the header with
 *  - quick actions
 *  - multireddits
 *  - subscribed subreddits
 */
export default class Ph_UserDropDown extends HTMLElement {
	unreadBadge: HTMLElement;
	searchFilterInput: HTMLInputElement;
	subredditsList: HTMLElement;
	multisList: HTMLElement;

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.className = "userDropDown";

		const dropDownButton = makeElement("button", { onclick: this.toggle.bind(this) }, "Actions");
		this.append(dropDownButton);
		const dropDownArea = makeElement("div", null, [
			this.searchFilterInput = makeElement("input",
				{ class: "filterSearch", placeholder: "Quick search", oninput: this.filterSearch.bind(this) }
				) as HTMLInputElement,
			this.makeActionBar(),
			this.makeUserSelector(),
			this.makeSubredditGroup([ "r/all", "r/popular" ], "Reddit Feeds")
		]);
		this.append(dropDownArea);

		window.addEventListener("click", e => {
			if (!isElementIn(this, e.target as HTMLElement))
	-			this.minimize();
		});
		const createMultiPane = new Ph_MultiCreateOrEdit("Create new multireddit", "Create", this.createNewMultireddit.bind(this));
		const newMultiBtn = makeElement("button", { class: "newMulti", onclick: () => {
				this.toggle();
				createMultiPane.show();
			}
		}, [
			makeElement("img", { src: "/img/add.svg", alt: "add" }),
			makeElement("div", null, "New Multireddit")
		]);
		ensurePageLoaded().then(() => {
			dropDownArea.append(this.multisList = this.makeSubredditGroup(
				Users.current.multireddits.rawData,
				"Multireddits",
				newMultiBtn
			));
			dropDownArea.append(this.subredditsList = this.makeSubredditGroup(
				Users.current.subreddits.rawData,
				"Subscribed"
			));
		});
		Users.current.subreddits.listenForChanges(this.onSubscriptionChanged.bind(this));
		Users.current.multireddits.listenForChanges(this.onMultisChanged.bind(this));
	}

	private makeSubredditGroup(feedsData: (RedditApiObj | string)[], groupName: string, ...additionChildren: Element[]): HTMLElement {
		return makeElement("div", { class: "subGroup separated" }, [
			makeElement("div", { class: "name" }, groupName),
			...feedsData.map(feedData => new Ph_FeedLink(feedData as RedditSubredditObj)),
			...additionChildren
		]);
	}

	private makeActionBar(): HTMLElement {
		const actions = makeElement("div", { class: "actionBar" });
		function makeAction(imgSrc: string, tooltip: string, onClick: string | (() => void)): HTMLElement {
			let item: HTMLElement;
			if (typeof onClick === "string")
				item = makeElement("a", { href: onClick });
			else if (typeof onClick === "function")
				item = makeElement("button", { onclick: onClick });
			else
				throw "Wut?";
			item.classList.add("item");
			item.classList.add("transparentButtonAlt");
			item.setAttribute("data-tooltip", tooltip);
			item.append(makeElement("img", { src: imgSrc, alt: tooltip }))
			return item;
		}
		// current user page
		const userPage = makeAction(
			"/img/user.svg",
			"My Profile",
			"/"
		) as HTMLAnchorElement;
		ensurePageLoaded().then(() => userPage.href = `/user/${Users.current.name}`);
		actions.append(userPage);
		// create post
		const postAction = makeAction(
			"/img/edit.svg",
			"Submit Post",
			"/submit"
		) as HTMLAnchorElement;
		window.addEventListener("ph-view-change", (e: CustomEvent) => {
				let submitUrl: string;
				const currentSubMatch: RegExpMatchArray = history.state.url.match(/\/r\/\w+/i);		// /r/sub
				if (currentSubMatch && !isFakeSubreddit(currentSubMatch[0].substr(3)))
					submitUrl = `${currentSubMatch}/submit`;
				else
					submitUrl = "/submit";
				postAction.href = submitUrl;
		});
		actions.append(postAction);
		// messages
		const inboxAction = makeAction(
			"/img/envelope.svg",
			"Inbox",
			"/message/inbox"
		);
		this.unreadBadge = makeElement("div", { class: "unreadBadge hide" });
		inboxAction.append(this.unreadBadge);
		actions.append(inboxAction);
		// clear previous states
		const clearAction = makeAction(
			"/img/close.svg",
			"Unload Pages",
			() => ViewsStack.clear()
		);
		actions.append(clearAction);
		// about
		const aboutAction = makeAction(
			"/img/info.svg",
			"About",
			"/about"
		);
		actions.append(aboutAction);

		return actions
	}

	private makeUserSelector(): HTMLElement {
		const userSelector = makeElement("div", { class: "userSelector separated" });
		ensurePageLoaded().then(() => {
			const userActionImages = {
				"remove": "/img/close.svg",
				"expand": "/img/downArrow.svg",
				"none": "/img/transparent.svg"
			}
			function makeUser(params: { user: UserData, rightImg: keyof typeof userActionImages, additionalClasses?: string, onMainClick?: () => void, onSubBtnClick?: () => void}): HTMLElement {
				return makeElement("div", { class: `userOption ${params.additionalClasses ?? ""}` }, [
					makeElement("button", { class: "mainArea", onclick: params.onMainClick }, [
						makeElement("img", { src: params.user.name !== guestUserName ? getUserIconUrl(params.user.d.userData) : "/img/user.svg" }),
						makeElement("div", {}, params.user.displayName),
					]),
					params.rightImg !== "none" && makeElement(
						"button",
						{ class: "subBtn transparentButtonAlt", style: `--img: url("${userActionImages[params.rightImg]}")`, onclick: params.onSubBtnClick }
					),
				]);
			}
			const current = makeElement("div", { class: "currentUserWrapper" },[
				makeUser({
					user: Users.current,
					rightImg: "expand",
					onMainClick: () => others.classList.toggle("expand"),
					onSubBtnClick: () => others.classList.toggle("expand")
				})
			]);
			const others = makeElement("div", { class: "allUsersList" }, [
				...Users.all.map(user => {
					const userBtn = makeUser({
						user: user,
						rightImg: "remove",
						additionalClasses: user === Users.current ? "selected" : "",
						onMainClick: async () => {
							Users.switchUser(user).catch(e => {
								new Ph_Toast(Level.error, "Couldn't switch user");
								console.error(e);
							});
							others.$css(".userOption.selected")[0]?.classList.remove("selected");
							userBtn.classList.add("selected");
							current.innerText = "";
							current.append(makeUser({
								user: Users.current,
								rightImg: "expand",
								onMainClick: () => others.classList.toggle("expand"),
								onSubBtnClick: () => others.classList.toggle("expand")
							}));
						}
					});
					return userBtn;
				}),
				makeElement("div", { class: "userOption" }, [
					makeElement("button", { class: "mainArea", onclick: () => {
							this.minimize();
							initiateLogin();
						}
					}, [
						makeElement("img", { src: "/img/add.svg" }),
						makeElement("div", {}, "Add User"),
					])
				])
			]);
			userSelector.append(current, others);
		})
		return userSelector;
	}

	filterSearch() {
		const filterable = this.$classAr("feedLink");
		const filterText = this.searchFilterInput.value;
		if (/^\s*$/.test(filterText)) {
			for (const link of filterable)
				link.classList.remove("hide");
			return;
		}

		const filterRegex = (new RegExp(filterText.replace(/\s+/g, "\\s*"), "i"));	// case insensitive, ignore whitespace
		for (const link of filterable)
			link.classList.toggle("hide", !filterRegex.test(link.innerText));
	}

	private async createNewMultireddit(info: MultiBasicInfo): Promise<boolean> {
		const multiUrlName = info.name.toLowerCase()
			.replace(/[^ _a-z0-9]/g, "")
			.replace(/ /g, "_")
			.replace(/_+/g, "_");
		if (multiUrlName.length < 2) {
			new Ph_Toast(Level.error, "Name must include at least 2 alphanumeric characters");
			return false;
		}
		const multiPath = `/user/${Users.current.name}/m/${multiUrlName}`;
		const response = await Users.current.multireddits.createOrUpdateMulti(multiPath, true, {
			display_name: info.name,
			description_md: info.descriptionMd,
			visibility: info.visibility
		});
		if (!response)
			return false;
		pushLinkToHistoryComb(multiPath);
		return true;
	}

	private onSubscriptionChanged(e: SubsChangeEvent) {
		if (e.isUserSubscribed) {
			this.subredditsList.children[e.index].after(new Ph_FeedLink(e.subreddit as RedditSubredditObj));
		}
		else {
			this.subredditsList.children[e.index + 1].remove();
		}
	}

	private onMultisChanged(e: MultisChangeEvent) {
		switch (e.changeType) {
			case MultiChangeType.created:
				this.multisList.lastElementChild.before(new Ph_FeedLink(e.multi));
				break;
			case MultiChangeType.edited: {
				const currentMultis = this.multisList.$classAr("feedLink") as Ph_FeedLink[];
				const multiIndex = currentMultis.findIndex(link => link.getUrl() === e.multi.data.path);
				currentMultis[multiIndex].after(new Ph_FeedLink(e.multi));
				currentMultis[multiIndex].remove();
				break;
			}
			case MultiChangeType.deleted: {
				const currentMultis = this.multisList.$classAr("feedLink") as Ph_FeedLink[];
				const multiIndex = currentMultis.findIndex(link => link.getUrl() === e.multi.data.path);
				currentMultis[multiIndex].remove();
				break;
			}
		}
	}

	setUnreadCount(unreadCount: number) {
		this.unreadBadge.innerText = numberToShort(unreadCount);
		this.unreadBadge.classList.toggle("hide", unreadCount === 0)
	}

	minimize() {
		this.classList.remove("expanded");
	}

	toggle() {
		this.classList.toggle("expanded");
		if (this.classList.contains("expanded")) {
			(elementWithClassInTree(this.parentElement, "header") as Ph_Header)?.minimizeAll([this]);
			setTimeout(() => this.searchFilterInput.focus({ preventScroll: true }), 200);
		}
	}
}

customElements.define("ph-user-dropdown", Ph_UserDropDown);
