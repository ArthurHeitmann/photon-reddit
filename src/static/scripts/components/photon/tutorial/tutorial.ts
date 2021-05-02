import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager.js";
import {
	$class,
	$css,
	disableMainPointerEvents,
	disableMainScroll,
	enableMainPointerEvents,
	enableMainScroll
} from "../../../utils/htmlStatics.js";
import Ph_Header from "../../global/header/header.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";

interface TutorialStep {
	highlightElementSelector: string | null,
	updateHighlightForMs?: number,
	displayText: string[]
	beginAction?: () => void,
	endAction?: () => void,
}

interface TutorialDescription {
	url: string,
	steps: TutorialStep[]
}

const tutorialDescription: TutorialDescription = {
	url: "/r/cats/top?t=all",
	steps: [
		{
			highlightElementSelector: null,
			displayText: [
				"Hello!",
				"Photon is an unofficial opensource webclient for reddit",
				"You can replace (almost) any reddit.com/... link with photon-reddit.com/...",
				"For more information visit r/photon_reddit or photon-reddit.com/about"
			]
		},
		{
			highlightElementSelector: "main .viewState:not(.hide) .universalFeed",
			displayText: [ "Here is your main content for posts, comments, messages, etc." ],
		},
		{
			highlightElementSelector: ".header .actions",
			displayText: [
				"The header is for special actions (searching, viewing your subreddits, sorting, etc.)",
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
			highlightElementSelector: ".header > .actions > .leftItems",
			displayText: [ "1. Change header behaviour" ],
		},
		{
			highlightElementSelector: ".header > .actions > .mainItems",
			displayText: [ "2. Search, Navigation, Actions, and Settings" ],
		},
		{
			highlightElementSelector: ".header > .actions > .feedSpecific",
			displayText: [
				"3. These buttons change when viewing a subreddit, user, multireddit, etc.",
				"You can use these buttons for sorting, viewing subreddit info and more"
			],
		},
		{
			highlightElementSelector: ".header .search",
			updateHighlightForMs: 300,
			displayText: [
				"The searchbar can search for subreddits and users",
				"Or you can search a subreddit for text or flairs"
			],
			beginAction: () => $css(".header .search .toggleDropdownButton")[0].click(),
			endAction: () => $css(".header .search .toggleDropdownButton")[0].click()
		},
		{
			highlightElementSelector: ".header .userDropDown",
			updateHighlightForMs: 300,
			displayText: [
				"Quick access to actions and pages (like your profile, inbox, about page, ...)",
				"Your followed subreddits und multireddits"
			],
			beginAction: () => $css(".header .userDropDown > button")[0].click(),
			endAction: () => $css(".header .userDropDown > button")[0].click()
		},
		{
			highlightElementSelector: ".header .showSettingsButton",
			updateHighlightForMs: 300,
			displayText: [
				"Open settings",
				"In the settings you can customize appearance and behaviour"
			],
		},
		{
			highlightElementSelector: ".header .showInfo",
			displayText: [
				"View Subreddit (or user or multi) info",
				"In the info you can find the description, rules, moderators and more",
				"From the info you subscribe to subreddits, change your flair and more"
			],
		},
		{
			highlightElementSelector: ".header .feedSorter",
			displayText: [ "Sort subreddits and posts" ],
		},
		{
			highlightElementSelector: "main .viewState:not(.hide) .post:not(.hide) .content",
			displayText: [
				"Double click on images or videos to view them in fullscreen",
				"In fullscreen you can zoom in (scroll wheel) and drag images and videos"
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
			highlightElementSelector: null,
			displayText: [ "That's it for now. Discover many more features yourself!" ],
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
		this.prevButton.className = "navButton prevButton remove";
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
		const newIndex = Math.min(this.currentStepIndex + 1, tutorialDescription.steps.length - 1);
		if (newIndex === this.currentStepIndex)
			return;
		this.tryEndAction();
		this.currentStepIndex = newIndex;
		this.updateStepDisplay();
	}

	previousStep(e: Event) {
		e.stopImmediatePropagation();
		const newIndex = Math.max(this.currentStepIndex - 1, 0);
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

		this.nextButton.classList.toggle("remove", this.currentStepIndex === tutorialDescription.steps.length - 1);
		this.prevButton.classList.toggle("remove", this.currentStepIndex === 0);
	}

	setUpdateInterval(currentStep: TutorialStep) {
		this.updateInterval = setInterval(() => this.updateHighlight(currentStep), 75);
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
			if (highlightTarget) {
				const bounds = highlightTarget.getBoundingClientRect();
				this.setHighlightBounds(
					Math.max(0, bounds.top - 7),
					Math.max(0, window.innerWidth - bounds.right - 7),
					Math.max(0, window.innerHeight - bounds.bottom - 7),
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
		localStorage["hasCompletedTutorial"] = "true";
		const header = $class("header")[0] as Ph_Header;
		if (header.isPinned)
			header.isPinned = false;
		header.hide();
	}

	static checkForTutorial() {
		if (localStorage["hasCompletedTutorial"] === "true")
			return;
		new Ph_Toast(Level.info, "Hello new visitor. Would you like to take a quick tour?", {
			onConfirm: () => new Ph_Tutorial(),
			onCancel: () => localStorage["hasCompletedTutorial"] = "true"
		})
	}
}

customElements.define("ph-tutorial", Ph_Tutorial);
