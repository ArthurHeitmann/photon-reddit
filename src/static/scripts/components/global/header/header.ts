import { $class, $tag } from "../../../utils/htmlStuff.js";
import { SVGAnimateElement } from "../../../utils/types.js";
import Ph_DropDownArea from "../../misc/dropDown/dropDownArea/dropDownArea.js";
import Ph_UserDropDown from "../../misc/userDropDown/userDropDown.js";
import { Ph_ViewState } from "../../viewState/viewState.js";
import Ph_Search from "../search/search.js";
import Ph_PhotonSettings from "../photonSettings/photonSettings.js";

export default class Ph_Header extends HTMLElement {
	search: Ph_Search;
	userDropDown: Ph_UserDropDown;
	headerHideVisualizer = $class("headerHideVisualizer");
	headerShowVisualizer = $class("headerShowVisualizer");
	hideTimeout = null;
	settings: Ph_PhotonSettings;
	feedSpecificElements: HTMLElement;

	constructor() {
		super();

		window.addEventListener("viewChange", (e: CustomEvent) => this.setFeedElements((e.detail as Ph_ViewState).headerElements));
	}

	connectedCallback() {
		this.classList.add("header");

		this.settings = document.body.appendChild(new Ph_PhotonSettings());

		this.innerHTML = `
			<div class="actions">
				<div>
					<a href="/" class="home"><div>Photon</div></a>
					<button class="showSettingsButton transparentButtonAlt"><img src="/img/settings1.svg" alt="show settings" draggable="false"></button>
					<a href="#" id="loginButton" hidden>Login with Reddit</a>
				</div>
				<div class="feedSpecific"></div>
			</div>
			<div class="expander absolute w100">
				<svg viewBox="0 0 1400 200" preserveAspectRatio="none">
					<path d="M 0 0 v 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h500 v -100 z" class="filled" fill="var(--bg-color)" vector-effect="non-scaling-stroke">
						  <animate class="headerHideVisualizer" attributeName="d" dur="0.25s" fill="freeze" from="M 0 0 v 100 h 0 c 200 50, 600 50, 700 50 s 500 0, 700 -50 h 0 v -100 z" to="M 0 0 v 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h500 v -100 z" begin="indefinite"></animate>
						  <animate class="headerShowVisualizer" attributeName="d" dur="0.25s" fill="freeze" from="M 0 0 v 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h500 v -100 z" to="M 0 0 v 100 h 0 c 200 50, 600 50, 700 50 s 500 0, 700 -50 h 0 v -100 z" begin="indefinite"></animate>
					</path>
					<path d="M 0 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h 500" class="stroked" fill="none" stroke="#eeeeee" stroke-width="5" vector-effect="non-scaling-stroke">
				  		<animate class="headerHideVisualizer" attributeName="d" dur="0.25s" fill="freeze" from="M 0 100 h 0 c 200 50, 600 50, 700 50 s 500 0, 700 -50 h 0" to="M 0 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h 500" begin="indefinite"></animate>
						<animate class="headerShowVisualizer" attributeName="d" dur="0.25s" fill="freeze" from="M 0 100 h 500 c 100 0, 100 50, 200 50 s 100 -50, 200 -50 h 500" to="M 0 100 h 0 c 200 50, 600 50, 700 50 s 500 0, 700 -50 h 0" begin="indefinite"></animate>
					</path>
				</svg>
			</div>
			<div class="accessibilitySpacer absolute center-h-alt"></div>
		`;

		this.feedSpecificElements = this.$class("feedSpecific")[0] as HTMLElement;

		this.$class("showSettingsButton")[0]
			.insertAdjacentElement("afterend", this.search = new Ph_Search());
		this.search
			.insertAdjacentElement("afterend", this.userDropDown = new Ph_UserDropDown());

		this.addEventListener("mouseenter", this.headerMouseEnter);
		this.addEventListener("mouseleave", this.headerMouseLeave);
		this.$class("showSettingsButton")[0].addEventListener("click", () => {
			this.settings.toggle();
			this.headerMouseLeave();
		});
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

	headerMouseEnter(e: MouseEvent) {
		if (this.hideTimeout !== null) {
			this.clearHideTimeout();
			return;
		}

		for (const anim of this.headerShowVisualizer) {
			(anim as SVGAnimateElement).beginElement();
		}
		this.classList.add("hover");
		this.clearHideTimeout();
	}

	headerMouseLeave(e?: MouseEvent) {
		if (e && e.relatedTarget === null) {
			this.hideTimeout = setTimeout(() => {
				for (const anim of this.headerHideVisualizer) {
					(anim as SVGAnimateElement).beginElement();
				}
				this.classList.remove("hover");
				this.minimizeAll();
			}, 10000);
		} else {
			for (const anim of this.headerHideVisualizer) {
				(anim as SVGAnimateElement).beginElement();
			}
			this.classList.remove("hover");
			this.clearHideTimeout();
			this.minimizeAll();
		}
	}

	minimizeAll() {
		this.search.minimize();
		this.userDropDown.minimize();
		Array.from(this.$class("dropDownArea")).forEach((area: Ph_DropDownArea) => area.closeMenu(true));
	}
}

customElements.define("ph-header", Ph_Header);
