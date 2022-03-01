import {initiateLogin} from "../../../auth/loginHandler";
import {ViewChangeData} from "../../../historyState/viewsStack";
import {PhEvents} from "../../../types/Events";
import {SVGAnimateElement} from "../../../types/misc";
import {$class} from "../../../utils/htmlStatics";
import {hasHTML} from "../../../utils/utils";
import Ph_DropDownArea from "../../misc/dropDown/dropDownArea/dropDownArea";
import Users from "../../../multiUser/userManagement";
import Ph_PhotonSettings from "../photonSettings/photonSettings";
import Ph_Search from "../search/search";
import Ph_UserDropDown from "../userDropDown/userDropDown";

/**
 * The always present, expandable header at the top. Provides navigation options and a place for feeds to
 * place control elements.
 */
export default class Ph_Header extends HTMLElement {
	isExpanded: boolean = false;
	isPinned: boolean = false;
	search: Ph_Search;
	userDropDown: Ph_UserDropDown;
	headerHideVisualizer = $class("headerHideVisualizer");
	headerShowVisualizer = $class("headerShowVisualizer");
	headerPinnedBeginAnimations = $class("headerPinnedBeginAnimation");
	headerPinnedEndAnimations = $class("headerPinnedEndAnimation");
	hideTimeout = null;
	settings: Ph_PhotonSettings;
	feedSpecificElements: HTMLElement;

	constructor() {
		super();
		if (hasHTML(this)) return;

		window.addEventListener(PhEvents.viewChange, (e: CustomEvent) =>
			this.setFeedElements((e.detail as ViewChangeData).viewState.headerElements));
	}

	connectedCallback() {
		if (hasHTML(this)) return;

		this.classList.add("header");

		this.settings = document.body.appendChild(new Ph_PhotonSettings());

		this.innerHTML = `
			<div class="actions">
				<div class="leftItems">
					<button class="transparentButtonAlt collapser" data-tooltip="Collapse">
						<img src="/img/rightArrow.svg" alt="collapse">
					</button>
					<button class="transparentButtonAlt pinToggleButton" data-tooltip="Pin top bar">
						<img src="/img/pin.svg" alt="pin">
					</button>
				</div>
				<div class="mainItems">
					<a href="/" class="home" draggable="false"><img src="/img/logo.png" alt="home" draggable="false"></a>
					<button class="showSettingsButton transparentButtonAlt"><img src="/img/settings1.svg" alt="show settings" draggable="false"></button>
					<button class="loginButton" ${Users.current.d.auth.isLoggedIn ? "hidden" : ""}>Login</button>
				</div>
				<div class="feedSpecific"></div>
			</div>
			<div class="expander absolute w100">
				<svg viewBox="0 0 1400 200" preserveAspectRatio="none">
					<path d="M 0 0 v 100 h 500 c 100 0, 100 40, 200 40 s 100 -40, 200 -40 h500 v -100 z" class="filled" fill="var(--bg-color)" vector-effect="non-scaling-stroke">
						<animate class="headerHideVisualizer" attributeName="d" dur="0.2s" fill="freeze" from="M 0 0 v 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0 v -100 z" to="M 0 0 v 100 h 500 c 100 0, 100 40, 200 40 s 100-40, 200 -40 h 500 v -100 z" begin="indefinite"></animate>
						<animate class="headerShowVisualizer" attributeName="d" dur="0.2s" fill="freeze" from="M 0 0 v 100 h 500 c 100 0, 100 40, 200 40 s 100-40, 200 -40 h500 v -100 z" to="M 0 0 v 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0 v -100 z" begin="indefinite"></animate>
						<animate class="headerPinnedBeginAnimation" attributeName="d" dur="0.2s" fill="freeze" from="M 0 0 v 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0 v -100 z" to="M 0 0 v 100 h 500 c 100 0, 100 0, 200 0 s 100 0, 200 0 h 500 v -100 z" begin="indefinite"></animate>
						<animate class="headerPinnedEndAnimation" attributeName="d" dur="0.2s" fill="freeze" from="M 0 0 v 100 h 500 c 100 0, 100 0, 200 0 s 100 0, 200 0 h 500 v -100 z" to="M 0 0 v 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0 v -100 z" begin="indefinite"></animate>
					</path>
					<path d="M 0 100 h 500 c 100 0, 100 40, 200 40 s 100-40, 200 -40 h 500" class="stroked" fill="none" stroke="#eeeeee" stroke-width="5" vector-effect="non-scaling-stroke">
						<animate class="headerHideVisualizer" attributeName="d" dur="0.2s" fill="freeze" from="M 0 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0" to="M 0 100 h 500 c 100 0, 100 40, 200 40 s 100-40, 200 -40 h 500" begin="indefinite"></animate>
						<animate class="headerShowVisualizer" attributeName="d" dur="0.2s" fill="freeze" from="M 0 100 h 500 c 100 0, 100 40, 200 40 s 100-40, 200 -40 h 500" to="M 0 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0" begin="indefinite"></animate>
						<animate class="headerPinnedBeginAnimation" attributeName="d" dur="0.2s" fill="freeze" from="M 0 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0" to="M 0 100 h 500 c 100 0, 100 0, 200 0 s 100 0, 200 0 h 500" begin="indefinite"></animate>
						<animate class="headerPinnedEndAnimation" attributeName="d" dur="0.2s" fill="freeze" from="M 0 100 h 500 c 100 0, 100 0, 200 0 s 100 0, 200 0 h 500" to="M 0 100 h 0 c 200 40, 600 40, 700 40 s 500 0, 700 -40 h 0" begin="indefinite"></animate>
					</path>
				</svg>
			</div>
			<div class="accessibilitySpacer absolute center-h-alt"></div>
		`;

		this.feedSpecificElements = this.$class("feedSpecific")[0] as HTMLElement;

		this.$class("showSettingsButton")[0]
			.insertAdjacentElement("beforebegin", this.search = new Ph_Search());
		this.search
			.insertAdjacentElement("afterend", this.userDropDown = new Ph_UserDropDown());

		this.addEventListener("mouseenter", this.headerMouseEnter);
		this.addEventListener("touchstart", this.headerMouseEnter, { passive: true });
		this.addEventListener("mouseleave", this.headerMouseLeave);
		this.$class("showSettingsButton")[0].addEventListener("click", () => {
			this.settings.toggle();
			this.hide();
		});
		this.$class("loginButton")[0].addEventListener("click", () => initiateLogin());
		window.addEventListener(PhEvents.viewChange, () => {
			if (!this.isPinned)
				this.hide();
			else
				this.minimizeAll();
		});
		window.addEventListener(PhEvents.userChanged,
			() => (this.$class("loginButton")[0] as HTMLElement).hidden = Users.current.d.auth.isLoggedIn);
		this.onWindowResize();
		window.addEventListener("resize", this.onWindowResize.bind(this));

		this.$class("collapser")[0].addEventListener("click", () =>
			this.$class("actions")[0].classList.toggle("collapsed"));
		const pinToggleButton = this.$class("pinToggleButton")[0] as HTMLButtonElement;
		pinToggleButton.addEventListener("click", this.onPinnedToggle.bind(this));

		if (Users.global.d.isHeaderPinned === true) {
			this.headerMouseEnter();
			pinToggleButton.click();
		}
		// if the user visits the page for the first time, expand the header for a brief amount of time.
		// Should help new users understand this feature
		else if (Users.global.d.isFirstTimeVisit) {
			setTimeout(this.headerMouseEnter.bind(this), 4000);
		}
	}

	setFeedElements(elements: HTMLElement[]) {
		this.feedSpecificElements.innerText = "";
		this.feedSpecificElements.append(...elements)
	}

	clearHideTimeout() {
		if (this.hideTimeout === null) {
			return;
		}

		clearTimeout(this.hideTimeout);
		this.hideTimeout = null;
	}

	headerMouseEnter() {
		if (this.hideTimeout !== null) {
			this.clearHideTimeout();
		}
		this.expand();
	}

	expand() {
		if (this.isExpanded)
			return;

		for (const anim of this.headerShowVisualizer) {
			(anim as SVGAnimateElement).beginElement();
		}
		this.classList.add("hover");
		this.clearHideTimeout();

		this.isExpanded = true;
	}

	headerMouseLeave(e?: MouseEvent) {
		if (this.isPinned)
			return;

		this.hideTimeout = setTimeout(this.hide.bind(this), e && e.relatedTarget === null ? 10000 : 700);
	}

	hide() {
		if (!this.isExpanded || this.isPinned)
			return;

		for (const anim of this.headerHideVisualizer) {
			(anim as SVGAnimateElement).beginElement();
		}
		this.classList.remove("hover");
		this.minimizeAll();

		this.isExpanded = false;
		this.clearHideTimeout();
	}

	minimizeAll(exclude: HTMLElement[] = []) {
		if (!exclude.includes(this.search))
			this.search.minimize();
		if (!exclude.includes(this.userDropDown))
			this.userDropDown.minimize();
		this.$classAr("dropDownArea").forEach((area: Ph_DropDownArea) => area.closeMenu(true));
	}

	private onWindowResize() {
		this.style.setProperty("--window-aspect-ratio", `${window.innerWidth / window.innerHeight}`)
	}

	private onPinnedToggle(e: MouseEvent) {
		this.isPinned = !this.isPinned;
		this.classList.toggle("pinned", this.isPinned);
		document.body.classList.toggle("pinnedHeader", this.isPinned);
		(e.currentTarget as HTMLElement).classList.toggle("pinned", this.isPinned);
		Users.global.set(["isHeaderPinned"], this.isPinned);
		if (this.isPinned) {
			for (const anim of this.headerPinnedBeginAnimations)
				(anim as SVGAnimateElement).beginElement();
		}
		else {
			for (const anim of this.headerPinnedEndAnimations)
				(anim as SVGAnimateElement).beginElement();
		}
	}
}

customElements.define("ph-header", Ph_Header);
