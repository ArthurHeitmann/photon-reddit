import {enterFullscreen, makeElement, sleep, waitForFullScreenExit} from "../../../utils/utils";
import {$cssAr} from "../../../utils/htmlStatics";
import Users from "../../../multiUser/userManagement";


export default class Ph_AnimatedFullscreen extends HTMLElement {
	private fsElement: HTMLElement;
	private placeholderElement: HTMLElement;
	private onFsEnterCallback: () => void;
	private onFsExitCallback: () => void;

	constructor(element: HTMLElement, onFsEnterCallback?: () => void, onFsExitCallback?: () => void) {
		super();

		this.classList.add("animatedFullscreen");
		this.classList.add("initial");

		this.fsElement = element;
		this.onFsEnterCallback = onFsEnterCallback;
		this.onFsExitCallback = onFsExitCallback;
	}

	connectedCallback() {
		this.cancelAllOtherAnimations();

		const fsElementBounds = this.fsElement.getBoundingClientRect();

		this.placeholderElement = makeElement("div", {
			class: "fullscreenPlaceholder",
			style: `--width: ${fsElementBounds.width}px; --height: ${fsElementBounds.height}px`
		});

		this.style.setProperty("--init-width", `${fsElementBounds.width}px`);
		this.style.setProperty("--init-height", `${fsElementBounds.height}px`);
		this.style.setProperty("--init-top", `${fsElementBounds.top}px`);
		this.style.setProperty("--init-left", `${fsElementBounds.left}px`);

		this.fsElement.after(this.placeholderElement);
		this.append(this.fsElement);
		this.fsElement.focus();

		sleep(0)
			.then(() => this.classList.remove("initial"))
			.then(() => this.classList.add("animateIn"))
			.then(() => void this.onFsEnterCallback?.())
			.then(() => sleep(200))
			.then(() => this.classList.remove("animateIn"))
			.then(() => this.classList.add("fullscreen"))
			.then(() => enterFullscreen(this))
			.then(() => waitForFullScreenExit())
			.then(() => this.classList.add("animateOut"))
			.then(() => sleep(200))
			.then(() => void this.onFsExitCallback?.())
			.then(() => this.resetToInitialState())
			.catch(() => this.resetToInitialState());
	}

	static from(element: HTMLElement, onFsEnterCallback?: () => void, onFsExitCallback?: () => void): void {
		if (Users.global.d.photonSettings.animateFullscreenTransition) {
			const fsElem = new Ph_AnimatedFullscreen(element, onFsEnterCallback, onFsExitCallback);
			document.body.append(fsElem);
		}
		else
			element.requestFullscreen();
	}

	private resetToInitialState() {
		if (this.placeholderElement.isConnected) {
			this.placeholderElement.after(this.fsElement);
			this.placeholderElement.remove();
		}
		this.fsElement.focus({ preventScroll: true });
		this.remove();
	}

	private cancelAllOtherAnimations() {
		$cssAr(".animatedFullscreen")
			.filter(e => e !== this)
			.forEach((e: Ph_AnimatedFullscreen) => e.resetToInitialState());
	}
}

customElements.define("ph-animated-fullscreen", Ph_AnimatedFullscreen);
