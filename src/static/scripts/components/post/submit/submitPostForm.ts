import { redditApiRequest } from "../../../api/redditApi.js";
import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager.js";
import { thisUser } from "../../../utils/globals.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { replaceRedditLinks } from "../../../utils/utils.js";
import Ph_FeedInfo, { FeedType } from "../../feed/feedInfo/feedInfo.js";
import Ph_DropDown, { ButtonLabel, DirectionX, DirectionY } from "../../misc/dropDown/dropDown.js";
import { DropDownEntryParam } from "../../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_Flair from "../../misc/flair/flair.js";
import Ph_MarkdownForm from "../../misc/markdownForm/markdownForm.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

enum SubmitPostType {
	text = "Text",
	link = "Link",
}

interface SubmitTypeSection {
	type: SubmitPostType,
	element: HTMLElement
}

/**
 * Form for submitting posts
 */
export default class Ph_SubmitPostForm extends HTMLElement {
	subInput: HTMLDivElement;
	validIndicator: HTMLImageElement;
	subInfoButton: HTMLDivElement;
	subSubmitText: HTMLDivElement;
	titleInput: HTMLDivElement;
	linkUrlInput: HTMLDivElement;
	textInput: Ph_MarkdownForm;
	submitButton: HTMLButtonElement;
	isCommunityNameValid: boolean = false;
	allPossibleTypeSections: SubmitTypeSection[] = [];
	currentSection: SubmitTypeSection;
	sectionSelection: HTMLDivElement;
	allowedTypes: SubmitPostType[];
	flairSelectorWrapper: HTMLDivElement;
	textSubmitText: string = "Submit";
	linkSubmitText: string = "Submit";
	selectedFlairId: string;
	nsfwButton: HTMLButtonElement;
	spoilerButton: HTMLButtonElement;
	isNsfw: boolean = false;
	forceNsfw: boolean = false;
	isSpoiler: boolean = false;
	isSpoilerAllowed: boolean = false;
	imagesAllowed: boolean = true;
	videosAllowed: boolean = true;
	notificationButton: HTMLButtonElement;
	sendNotifications: boolean = true;
	repostCheckButton: HTMLButtonElement;
	checkForReposts: boolean = true;

	constructor() {
		super();

		this.className = "submitPost";

		// community name
		this.subInput = this.makeTextInput("sub", "Subreddit or User Name");
		this.subInput.addEventListener("input", this.setCommunityIsNeutral.bind(this));
		this.subInput.addEventListener("change", this.onSubChange.bind(this));
		this.validIndicator = document.createElement("img");
		this.validIndicator.className = "validStatus";
		this.subInput.appendChild(this.validIndicator);
		this.subInfoButton = document.createElement("div");
		this.subInfoButton.className = "subInfoButtonWrapper";
		this.subInput.appendChild(this.subInfoButton);
		this.appendChild(this.subInput);

		// subreddit specific text
		this.subSubmitText = document.createElement("div");
		this.subSubmitText.className = "el2 roundedM hide subSubmitText";
		this.appendChild(this.subSubmitText);

		// post title
		this.titleInput = this.makeTextInput("", "Title");
		this.appendChild(this.titleInput);

		// post text (self post)
		this.textInput = new Ph_MarkdownForm("", false);
		this.textInput.classList.add("hide");
		this.allPossibleTypeSections.push({ type: SubmitPostType.text, element: this.textInput });

		// post link
		this.linkUrlInput = this.makeTextInput("", "Url");
		this.linkUrlInput.classList.add("hide");
		this.repostCheckButton = this.makeImageButton("/img/refresh.svg", "check if repost", "Check if repost", () => {
			this.repostCheckButton.classList.toggle("selected");
			this.checkForReposts = this.repostCheckButton.classList.contains("selected");
		})
		this.repostCheckButton.classList.add("selected");
		this.linkUrlInput.appendChild(this.repostCheckButton);
		this.allPossibleTypeSections.push({ type: SubmitPostType.link, element: this.linkUrlInput });

		// selection for what type of post this is (text or link(
		this.sectionSelection = document.createElement("div");
		this.sectionSelection.className = "sectionSelection el2";
		this.appendChild(this.sectionSelection);
		for (const section of this.allPossibleTypeSections) {
			const sectionButton = document.createElement("button");
			sectionButton.innerText = section.type;
			sectionButton.addEventListener("click", this.onSectionClick.bind(this));
			this.sectionSelection.appendChild(sectionButton);
			this.appendChild(section.element);
		}
		this.setAllowedTypes([]);

		// bottom bar
		const bottomBar = document.createElement("div");
		bottomBar.className = "bottomBar";
		this.appendChild(bottomBar)

		// left items
		const leftItems = document.createElement("div");
		leftItems.className = "group";
		bottomBar.appendChild(leftItems);

		// nsfw & spoiler
		this.nsfwButton = this.makeSpecialButton("NSFW", "nsfw", leftItems, () => {
			this.isNsfw = !this.isNsfw || this.forceNsfw;
			if (this.isNsfw)
				this.nsfwButton.classList.add("selected");
			else
				this.nsfwButton.classList.remove("selected");
		});
		this.spoilerButton = this.makeSpecialButton("Spoiler", "spoiler", leftItems, () => {
			this.isSpoiler = !this.isSpoiler && this.isSpoilerAllowed;
			if (this.isSpoiler)
				this.spoilerButton.classList.add("selected");
			else
				this.spoilerButton.classList.remove("selected");
		});

		// flair
		this.flairSelectorWrapper = document.createElement("div");
		this.flairSelectorWrapper.className = "flairSelectorWrapper";
		leftItems.appendChild(this.flairSelectorWrapper);

		// right items
		const rightItems = document.createElement("div");
		rightItems.className = "group";
		bottomBar.appendChild(rightItems);

		// notifications
		this.notificationButton = this.makeImageButton("/img/notification.svg", "send notifications", "Send Notifications", () => {
			this.notificationButton.classList.toggle("selected");
			this.sendNotifications = this.notificationButton.classList.contains("selected");
		});
		this.notificationButton.classList.add("notificationButton");
		this.notificationButton.classList.add("selected");
		rightItems.appendChild(this.notificationButton);

		// submit button
		this.submitButton = document.createElement("button");
		this.submitButton.innerText = this.textSubmitText;
		this.submitButton.className = "button submit";
		this.submitButton.disabled = true;
		rightItems.appendChild(this.submitButton);
		this.submitButton.addEventListener("click", this.onSubmitPost.bind(this));

		// if the current url is like /r/AskReddit/submit then fill out the subreddit input field
		if (/^\/r\/\w+\/submit/.test(history.state.url)) {
			const subMatches = history.state.url.match(/(?<=^\/r\/)\w+/);
			(this.subInput.$tag("input")[0] as HTMLInputElement).value = `r/${subMatches[0]}`;
			this.subInput.dispatchEvent(new Event("change"));
		}
		else if (/^\/(u|user)\/\w+\/submit/.test(history.state.url)) {
			const userMatches = history.state.url.match(/(?<=^\/(u|user)\/)\w+/);
			(this.subInput.$tag("input")[0] as HTMLInputElement).value = `user/${userMatches[0]}`;
			this.subInput.dispatchEvent(new Event("change"));
		}
	}

	private makeTextInput(className: string, placeHolderText: string, isTextArea: boolean = false): HTMLDivElement {
		const wrapper = document.createElement("div");
		wrapper.className = `phInput el2 roundedL ${className}`;
		if (isTextArea)
			wrapper.classList.add("textarea");
		const input = document.createElement(!isTextArea ? "input" : "textarea");
		if (input instanceof HTMLInputElement)
			input.type = "text";
		input.placeholder = placeHolderText;
		wrapper.appendChild(input)
		return wrapper;
	}

	private makeSpecialButton(text: string, className: string, appendTo: HTMLElement, onClick: () => void): HTMLButtonElement {
		const btn = document.createElement("button");
		btn.className = `specialButton ${className}`;
		btn.innerText = text;
		btn.addEventListener("click", onClick);
		appendTo.appendChild(btn);
		return btn;
	}

	private makeImageButton(imgUrl: string, alt: string, tooltip: string, onClick: (e: MouseEvent) => void): HTMLButtonElement {
		const button = document.createElement("button");
		button.className = "linkTypeButton transparentButtonAlt";
		button.innerHTML = `<img src="${imgUrl}" alt="${alt}">`;
		button.setAttribute("data-tooltip", tooltip);
		button.addEventListener("click", onClick);
		return button;
	}

	private onSectionClick(e: Event) {
		this.select(e.currentTarget as HTMLButtonElement);
	}

	select(button: HTMLButtonElement) {
		const clickedSection = this.allPossibleTypeSections
			.find(section => section.type === button.innerText);
		this.currentSection?.element.classList.add("hide");
		clickedSection.element.classList.remove("hide");
		this.currentSection = clickedSection;
		this.sectionSelection.$class("selected")[0]?.classList.remove("selected");
		button.classList.add("selected");
		if (this.currentSection.type === SubmitPostType.text)
			this.submitButton.innerText = this.textSubmitText;
		else if (this.currentSection.type === SubmitPostType.link)
			this.submitButton.innerText = this.linkSubmitText;
		else
			this.submitButton.innerText = "Submit";
	}

	private async onSubmitPost() {
		const params = [];
		params.push(["sr", this.subInput.$tag("input")[0]["value"]]);
		params.push(["title", this.titleInput.$tag("input")[0]["value"]]);
		if (this.selectedFlairId !== null)
			params.push(["flair_id", this.selectedFlairId]);
		params.push(["nsfw", this.isNsfw]);
		if (this.isSpoilerAllowed)
			params.push(["spoiler", this.isSpoiler]);
		params.push(["resubmit", !this.checkForReposts]);
		params.push(["sendreplies", this.sendNotifications]);

		switch (this.currentSection.type) {
			case SubmitPostType.text:
				params.push(["kind", "self"]);
				params.push(["text", this.textInput.textField.value])
				break;
			case SubmitPostType.link:
				params.push(["kind", "link"]);
				params.push(["url", this.linkUrlInput.$tag("input")[0]["value"]])
				break;
			default:
				throw "Not implemented"
		}

		const r = await redditApiRequest("/api/submit", params, true, { method: "POST" });
		if (r["error"]) {
			new Ph_Toast(Level.Error, "Error posting");
			console.error(r);
			throw "error posting";
		}
		const jqueryArr: any[][] = r["jquery"];
		const redirectIndex = jqueryArr.findIndex(value => value[3] === "redirect");
		const errorMessageIndex = jqueryArr.findIndex(value => value[3] === "text");
		if (errorMessageIndex !== -1) {
			const msg = jqueryArr[errorMessageIndex + 1][3][0];
			new Ph_Toast(Level.Error, msg);
			return;
		}
		const path = jqueryArr[redirectIndex + 1][3][0].match(/(?<=reddit\.com).*/)[0];
		pushLinkToHistoryComb(path);
	}

	/** the community name has changed --> verify if it's valid and if so load it's data */
	private async onSubChange() {
		this.submitButton.disabled = true;
		let community = (this.subInput.$tag("input")[0] as HTMLInputElement).value;
		// basic schema
		if (!/^(r|u|user)\//.test(community)) {
			new Ph_Toast(Level.Error, `Community must start with "r/" or "u/" or "user/"`, {timeout: 3500});
			return;
		} else if (!/^(r|u|user)\/[a-zA-z0-9_-]{3,21}$/.test(community)) {
			new Ph_Toast(Level.Error, `Invalid community name`, {timeout: 3500});
			return;
		}
		else if (/^(u|user)\//.test(community) && community.match(/(?<=^(u|user)\/)\w+/)[0] !== thisUser.name) {
			new Ph_Toast(Level.Error, `You can only submit posts on your profile`, {timeout: 3500});
			return;
		}
		community = community.replace(/^\/?/, "/");

		// make reddit request to verify existence of that sub and get it's data
		// for subreddit
		if (community.startsWith("/r/")) {
			// check if valid
			const r = await redditApiRequest(`${community}/api/submit_text`, [], false);
			if (r["kind"] === "listing" || r["error"]) {
				new Ph_Toast(Level.Error, "Subreddit not found", {timeout: 2500});
				this.setCommunityIsInvalid();
				return;
			}
			this.setCommunityIsValid();
			// set submit text
			if (r["submit_text"]) {
				this.subSubmitText.innerHTML = r["submit_text_html"];
				replaceRedditLinks(this.subSubmitText);
				linksToSpa(this.subSubmitText);
			}
			else
				this.subSubmitText.classList.add("hide");
			// load detailed sub info
			this.subInfoButton.innerText = "";
			this.subInfoButton.appendChild(Ph_FeedInfo.getInfoButton(FeedType.subreddit, community));
			await Ph_FeedInfo.loadedInfos[community].feedInfo.forceLoad();
			const subData = Ph_FeedInfo.loadedInfos[community].feedInfo.loadedInfo.data;
			// submit button text
			this.textSubmitText = subData["submit_text_label"] || "Submit";
			this.linkSubmitText = subData["submit_link_label"] || "Submit";
			// allowed submission types
			if (subData["submission_type"] === "any")
				this.setAllowedTypes([ SubmitPostType.text, SubmitPostType.link ]);
			else if (subData["submission_type"] === "self")
				this.setAllowedTypes([ SubmitPostType.text ]);
			else if (subData["submission_type"] === "link")
				this.setAllowedTypes([ SubmitPostType.link ]);
			else {
				console.error("Invalid submission type for ");
				console.error(subData);
				new Ph_Toast(Level.Error, "Couldn't get submission type");
				throw "Invalid submission type";
			}
			this.imagesAllowed = subData["allow_images"];
			this.videosAllowed = subData["allow_videos"];
			// flair selection
			const flairs: {}[] = await redditApiRequest(`${community}/api/link_flair_v2`, [], true);
			this.flairSelectorWrapper.innerText = "";
			this.selectedFlairId = null;
			if (!flairs["error"]) {
				const flairDropdownEntries: DropDownEntryParam[] = flairs.map(flair => <DropDownEntryParam> {
					displayElement: new Ph_Flair({
						type: flair["type"],
						richText: flair["richtext"],
						text: flair["text"],
						backgroundColor: flair["background_color"],
						textColor: flair["text_color"]
					}),
					value: flair["id"],
					onSelectCallback: this.selectFlair.bind(this)
				});
				if (flairDropdownEntries.length) {
					this.flairSelectorWrapper.appendChild(new Ph_DropDown(
						flairDropdownEntries,
						"Select Flair",
						DirectionX.left,
						DirectionY.bottom,
						false
					));
				}
			}
			// nsfw & spoiler
			this.forceNsfw = subData["over18"];
			if (this.forceNsfw && !this.isNsfw)
				this.nsfwButton.click();
			this.isSpoilerAllowed = subData["spoilers_enabled"];
			if (!this.isSpoilerAllowed && this.isSpoiler)
				this.spoilerButton.click();

			this.submitButton.disabled = false;
		}
		// TODO for user
		else {
			const r = await redditApiRequest(`${community}/about`, [], false);
			if (r["kind"] === "listing" || r["error"]) {
				new Ph_Toast(Level.Error, "User not found", {timeout: 2500});
				this.setCommunityIsInvalid();
				return;
			}
			this.setCommunityIsValid();
			this.subInfoButton.innerText = "";
			this.subInfoButton.appendChild(Ph_FeedInfo.getInfoButton(FeedType.user, community));
			new Ph_Toast(Level.Warning, "Post to users aren't supported yet");
		}
	}

	selectFlair([flairId], setLabel: (newLabel: ButtonLabel) => void, _, source: HTMLElement) {
		if (this.selectedFlairId === flairId) {
			this.selectedFlairId = null;
			setLabel("Select Flair")
		}
		else {
			this.selectedFlairId = flairId;
			setLabel(source.$class("flair")[0].cloneNode(true) as HTMLElement);
		}
	}

	setAllowedTypes(sections: SubmitPostType[]) {
		this.allowedTypes = sections;
		for (const button of this.sectionSelection.children) {
			if (sections.includes(<SubmitPostType> (button as HTMLElement).innerText))
				button.classList.remove("hide");
			else
				button.classList.add("hide");
		}
		if (sections.length === 0)
			return;
		this.sectionSelection.$class("selected")[0]?.classList.remove("selected");
		const firstAllowedButton = Array.from(this.sectionSelection.children)
			.find(btn => sections.includes(<SubmitPostType> (btn as HTMLElement).innerText));
		this.select(firstAllowedButton as HTMLButtonElement);
	}

	setCommunityIsValid() {
		this.validIndicator.classList.remove("hide");
		this.validIndicator.src = "/img/check.svg";
		this.validIndicator.alt = "Valid Name";
		this.subSubmitText.classList.remove("hide");
	}

	setCommunityIsInvalid() {
		this.validIndicator.classList.remove("hide");
		this.validIndicator.src = "/img/close.svg";
		this.validIndicator.alt = "Wrong Name";
		this.subSubmitText.classList.add("hide");
		this.subInfoButton.innerText = "";
		this.flairSelectorWrapper.innerText = "";
		this.setAllowedTypes([]);
	}

	setCommunityIsNeutral() {
		this.validIndicator.classList.add("hide");
		this.validIndicator.alt = "waiting";
		this.subSubmitText.classList.add("hide");
		this.subInfoButton.innerText = "";
	}
}

customElements.define("ph-submit-post-form", Ph_SubmitPostForm);
