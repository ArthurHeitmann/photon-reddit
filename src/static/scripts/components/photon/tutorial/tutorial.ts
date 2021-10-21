import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager";
import {
	$class,
	$css,
	disableMainPointerEvents,
	disableMainScroll,
	enableMainPointerEvents,
	enableMainScroll
} from "../../../utils/htmlStatics";
import { hasHTML } from "../../../utils/utils";
import Ph_Header from "../../global/header/header";
import Ph_UserDropDown from "../../global/userDropDown/userDropDown";
import Ph_Toast, { Level } from "../../misc/toast/toast";
import Users from "../../multiUser/userManagement";

interface TutorialStep {
	highlightElementSelector: string | null,
	getAdditionalHeight?: () => number,
	updateHighlightForMs?: number,
	displayText: string[],
	showIf?: () => boolean,
	beginAction?: () => void,
	endAction?: () => void,
}

interface TutorialDescription {
	url: string,
	steps: TutorialStep[]
}

const tutorialDescription: TutorialDescription = {
	url: "/r/Eyebleach/top?t=day",
	steps: [
		{
			highlightElementSelector: null,
			displayText: [
				"Hello there!",
			]
		},
		{
			highlightElementSelector: "main .viewState:not(.hide) .universalFeed",
			displayText: [ "Here is your main area for posts, comments, messages, etc." ],
		},
		{
			highlightElementSelector: "main .viewState:not(.hide) .post:not(.hide) .content",
			displayText: [
				"Double click on images/videos to view them in fullscreen",
				"In fullscreen you can zoom in and drag images/videos"
			],
			updateHighlightForMs: 300,
		},
		{
			highlightElementSelector: "ph-header .actions",
			displayText: [
				"The navigation bar is for special actions (searching, viewing your subreddits, sorting, etc.)",
				"There are 3 sections...",
			],
			updateHighlightForMs: 300,
			beginAction: () => {
				const header = $class("header")[0] as Ph_Header;
				if (!header.isPinned)
					header.isPinned = true;
				header.expand();
			}
		},
		{
			highlightElementSelector: "ph-header > .actions > .leftItems",
			displayText: [
				"1. Change navigation bar behaviour",
				"(pin it, minimize it)"
			],
		},
		{
			highlightElementSelector: "ph-header > .actions > .mainItems",
			displayText: [
				"2. General Navigation + Some Actions"
			],
		},
		{
			highlightElementSelector: "ph-header ph-search",
			getAdditionalHeight: () => $css("ph-header ph-search .searchDropdown")[0].offsetHeight + 7,
			updateHighlightForMs: 300,
			displayText: [
				"The searchbar can search for subreddits and users",
				"Or you can search in a subreddit for text or flairs"
			],
			beginAction: () => $css("ph-header ph-search .toggleDropdownButton")[0].click(),
			endAction: () => $css("ph-header ph-search .toggleDropdownButton")[0].click()
		},
		{
			highlightElementSelector: "ph-header ph-user-dropdown",
			getAdditionalHeight: () => $css("ph-header ph-user-dropdown > div")[0].offsetHeight + 7,
			updateHighlightForMs: 300,
			displayText: [
				"Quick access to some pages and actions (like your profile, inbox, ...)",
				"Your followed subreddits und multireddits"
			],
			beginAction: () => ($css("ph-header ph-user-dropdown")[0] as Ph_UserDropDown).show(),
			endAction: () => ($css("ph-header ph-user-dropdown")[0] as Ph_UserDropDown).hide(),
		},
		{
			highlightElementSelector: "ph-header ph-user-dropdown .userSelector ",
			updateHighlightForMs: 300,
			displayText: [
				"Log in with multiple accounts",
			],
			beginAction: () => {
				($css("ph-header ph-user-dropdown")[0] as Ph_UserDropDown).show();
				$css("ph-header ph-user-dropdown .allUsersList")[0].classList.add("expand");
			},
			endAction: () => {
				($css("ph-header ph-user-dropdown")[0] as Ph_UserDropDown).hide();
				$css("ph-header ph-user-dropdown .allUsersList")[0].classList.remove("expand");
			},
		},
		{
			highlightElementSelector: "ph-header .showSettingsButton",
			updateHighlightForMs: 300,
			displayText: [
				"Open settings",
				"In the settings you can customize appearance and behaviour"
			],
		},
		{
			highlightElementSelector: "ph-photon-settings > div",
			displayText: [ "You can explore the settings later in detail" ],
			beginAction() {
				const header = $class("header")[0] as Ph_Header;
				header.isPinned = false;
				header.hide();
				$css("ph-header .showSettingsButton")[0].click();
			},
			endAction: () => {
				$css("ph-photon-settings .closeButton")[0].click();
				const header = $class("header")[0] as Ph_Header;
				header.isPinned = true;
				header.expand();
			},
			updateHighlightForMs: 300,
		},
		{
			highlightElementSelector: ".loginButton",
			updateHighlightForMs: 300,
			displayText: [
				"Login through reddit.com",
			],
			showIf: () => !$css(".loginButton")[0].hidden
		},
		{
			highlightElementSelector: "ph-header > .actions > .feedSpecific",
			updateHighlightForMs: 300,
			displayText: [
				"3. These buttons change when viewing a subreddit, user, multireddit, etc.",
			],
		},
		{
			highlightElementSelector: "ph-header .showInfo",
			updateHighlightForMs: 300,
			displayText: [
				"View Subreddit (or user or multi) info",
			],
		},
		{
			highlightElementSelector: "ph-feed-info-subreddit:last-child",
			updateHighlightForMs: 300,
			displayText: [
				"Here you can find the description, rules, moderators and more",
				"Subscribe to the subreddit, change your flair and more"
			],
			beginAction: () => {
				const header = $class("header")[0] as Ph_Header;
				header.isPinned = false;
				header.hide();
				$css("ph-header .showInfo button")[0].click();
			},
			endAction: () => {
				$css("ph-header .showInfo button")[0].click();
				const header = $class("header")[0] as Ph_Header;
				header.isPinned = true;
				header.expand();
			},
		},
		{
			highlightElementSelector: "ph-header .feedSorter",
			updateHighlightForMs: 300,
			displayText: [ "Sort subreddits and posts" ],
			beginAction: () => $css("ph-header .feedSpecific .feedSorter .dropDownButton")[0].click(),
			endAction: () => $css("ph-header .feedSpecific .feedSorter .dropDownButton")[0].click(),
		},
		{
			highlightElementSelector: null,
			displayText: [
				"That's it for now. Discover many more features yourself!",
				"---",
				"Photon is an unofficial opensource webclient for reddit",
				"For more information visit r/photon_reddit or photon-reddit.com/about"
			],
		}
	]
}

export default class Ph_Tutorial extends HTMLElement {
	topBlocker: HTMLDivElement;
	rightBlocker: HTMLDivElement;
	bottomBlocker: HTMLDivElement;
	leftBlocker: HTMLDivElement;
	nextButton: HTMLButtonElement;
	prevButton: HTMLButtonElement;
	finishButton: HTMLButtonElement;
	stepText: HTMLDivElement;
	updateInterval = null;
	currentStepIndex = 0;

	constructor() {
		super();
		if (hasHTML(this)) return;

		this.className = "tutorial";

		this.topBlocker = document.createElement("div");
		this.topBlocker.className = "blocker top";
		this.appendChild(this.topBlocker);
		this.rightBlocker = document.createElement("div");
		this.rightBlocker.className = "blocker right";
		this.appendChild(this.rightBlocker);
		this.bottomBlocker = document.createElement("div");
		this.bottomBlocker.className = "blocker bottom";
		this.appendChild(this.bottomBlocker);
		this.leftBlocker = document.createElement("div");
		this.leftBlocker.className = "blocker left";
		this.appendChild(this.leftBlocker);
		const highlightWindow = document.createElement("div");
		highlightWindow.className = "highlightWindow";
		this.appendChild(highlightWindow);

		this.stepText = document.createElement("div");
		this.stepText.className = "stepText";
		this.appendChild(this.stepText);

		const buttonBar = document.createElement("div");
		buttonBar.className = "buttonBar";
		this.appendChild(buttonBar);
		this.finishButton = document.createElement("button");
		this.finishButton.className = "navButton finishButton";
		this.finishButton.innerText = "Exit Tutorial";
		this.finishButton.addEventListener("click", this.exitTutorial.bind(this));
		buttonBar.appendChild(this.finishButton);
		this.prevButton = document.createElement("button");
		this.prevButton.className = "navButton prevButton";
		this.prevButton.innerText = "Back";
		this.prevButton.addEventListener("click", this.previousStep.bind(this));
		buttonBar.appendChild(this.prevButton);
		this.nextButton = document.createElement("button");
		this.nextButton.className = "navButton nextButton";
		this.nextButton.innerText = "Next";
		this.nextButton.addEventListener("click", this.nextStep.bind(this));
		buttonBar.appendChild(this.nextButton);

		pushLinkToHistoryComb(tutorialDescription.url).then(() => {
			this.updateStepDisplay();
		});

		document.body.appendChild(this);

		disableMainPointerEvents();
		disableMainScroll();
	}

	nextStep(e: Event) {
		e.stopImmediatePropagation();
		let newIndex: number = Math.min(this.currentStepIndex + 1, tutorialDescription.steps.length - 1);
		while (tutorialDescription.steps[newIndex].showIf && !tutorialDescription.steps[newIndex].showIf()) {
			newIndex = Math.min(newIndex + 1, tutorialDescription.steps.length - 1);
		}
		if (newIndex === this.currentStepIndex)
			return;
		this.tryEndAction();
		this.currentStepIndex = newIndex;
		this.updateStepDisplay();
	}

	previousStep(e: Event) {
		e.stopImmediatePropagation();
		let newIndex: number = Math.max(this.currentStepIndex - 1, 0);
		while (tutorialDescription.steps[newIndex].showIf && !tutorialDescription.steps[newIndex].showIf()) {
			newIndex = Math.max(newIndex - 1, 0);
		}
		if (newIndex === this.currentStepIndex)
			return;
		this.tryEndAction();
		this.currentStepIndex = newIndex;
		this.updateStepDisplay();
	}

	updateStepDisplay() {
		if (this.updateInterval)
			clearInterval(this.updateInterval);
		const currentStep = tutorialDescription.steps[this.currentStepIndex];
		this.updateHighlight(currentStep);
		this.stepText.innerText = "";
		this.stepText.append(...currentStep.displayText.map(text => {
			const line = document.createElement("div");
			line.innerText = text;
			return line;
		}));

		if (currentStep.beginAction)
			currentStep.beginAction();
		if (currentStep.updateHighlightForMs)
			this.setUpdateInterval(currentStep);

		this.classList.toggle("isLast", this.currentStepIndex === tutorialDescription.steps.length - 1);
		this.classList.toggle("isFirst", this.currentStepIndex === 0);
	}

	setUpdateInterval(currentStep: TutorialStep) {
		this.updateInterval = setInterval(() => this.updateHighlight(currentStep), 25);
		setTimeout(() => {
			if (currentStep === tutorialDescription.steps[this.currentStepIndex])
			this.updateHighlight(currentStep);
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}, currentStep.updateHighlightForMs + 15)
	}

	updateHighlight(currentStep: TutorialStep) {
		if (currentStep.highlightElementSelector) {
			const highlightTarget = $css(currentStep.highlightElementSelector)[0] as HTMLElement;
			const additionHeight = currentStep.getAdditionalHeight?.() ?? 0;
			if (highlightTarget) {
				const bounds = highlightTarget.getBoundingClientRect();
				this.setHighlightBounds(
					Math.max(0, bounds.top - 7),
					Math.max(0, window.innerWidth - bounds.right - 11),
					Math.max(0, window.innerHeight - bounds.bottom - 7) - additionHeight,
					Math.max(0, bounds.left - 7),
				);
			}
			else {
				this.setNoHighlight();
			}
		}
		else {
			this.setNoHighlight();
		}
	}

	setNoHighlight() {
		this.setHighlightBounds(window.innerHeight * 2, window.innerWidth * 2,window.innerHeight * 2, window.innerWidth * 2)
	}

	setHighlightBounds(top: number, right: number, bottom: number, left: number) {
		this.style.setProperty("--top-space", `${top}px`);
		this.style.setProperty("--right-space", `${right}px`);
		this.style.setProperty("--bottom-space", `${bottom}px`);
		this.style.setProperty("--left-space", `${left}px`);
	}

	tryEndAction() {
		const currentStep = tutorialDescription.steps[this.currentStepIndex];
		if (currentStep.endAction)
			currentStep.endAction();
	}

	exitTutorial() {
		this.remove();
		this.tryEndAction();
		enableMainScroll();
		enableMainPointerEvents();
		Users.global.set(["hasAcknowledgedTutorial"], true);
		const header = $class("header")[0] as Ph_Header;
		if (header.isPinned)
			header.isPinned = false;
		header.hide();
	}

	static checkForTutorial() {
		if (Users.global.d.hasAcknowledgedTutorial)
			return;
		new Ph_Toast(Level.info, "Hello! Would you like to take a quick tour?", {
			onConfirm: () => new Ph_Tutorial(),
			onCancel: () => Users.global.set(["hasAcknowledgedTutorial"], true)
		})
	}
}

customElements.define("ph-tutorial", Ph_Tutorial);
