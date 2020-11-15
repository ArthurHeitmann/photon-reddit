import { $class } from "../../../utils/htmlStuff.js";
import { SVGAnimateElement } from "../../../utils/types.js";
import Ph_Search from "../search/search.js";

export default class Ph_Header extends HTMLElement {
	search: Ph_Search;
	headerHideVisualizer = $class("headerHideVisualizer");
	headerShowVisualizer = $class("headerShowVisualizer");
	hideTimeout = null;

	constructor() {
		super();
	}

	connectedCallback() {
		this.classList.add("header");

		this.innerHTML = `
			<div class="actions flex f-justify-center f-align-center">
				<a href="/" class="home"><div>Photon</div></a>
				<div class="subredditList dropdown">
					<a href="/r/JavaScript" class="listItem">
						<img src="#" alt="" class="subredditIcon">
						<div class="title">JavaScript</div>
					</a>	
					<a href="/r/ProgrammingHorror" class="listItem">
						<img src="#" alt="" class="subredditIcon">
						<div class="title">ProgrammingHorror</div>
					</a>	
				</div>
				<button class="showSubredditListButton">Subs</button>
				<button class="showUserListButton">u/user</button>
				<div class="textFieldWithButton dropdown">
					<input type="text">
					<button></button>
				</div>
				<a href="#" id="loginButton" hidden>Login with Reddit</a>
				<button class="miscActions">...</button>
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

		this.$class("home")[0]
			.insertAdjacentElement("afterend", this.search = new Ph_Search());

		this.addEventListener("mouseenter", this.headerMouseEnter);
		this.addEventListener("mouseleave", this.headerMouseLeave);

	}

	clearHideTimeout() {
		if (this.hideTimeout === null)
			return;

		clearTimeout(this.hideTimeout);
		this.hideTimeout = null;
	}

	headerMouseEnter(e: MouseEvent) {
		if (this.hideTimeout !== null) {
			this.clearHideTimeout();
			return;
		}

		for (const anim of this.headerShowVisualizer)
			(anim as SVGAnimateElement).beginElement();
		this.classList.add("hover");
		this.clearHideTimeout();
	}

	headerMouseLeave(e: MouseEvent) {
		if (e.relatedTarget === null) {
			this.hideTimeout = setTimeout(() => {
				for (const anim of this.headerHideVisualizer)
					(anim as SVGAnimateElement).beginElement();
				this.classList.remove("hover");
				this.search.minimize();
			}, 10000);
		} else {
			for (const anim of this.headerHideVisualizer)
				(anim as SVGAnimateElement).beginElement();
			this.classList.remove("hover");
			this.clearHideTimeout();
			this.search.minimize();
		}
	}
}

customElements.define("ph-header", Ph_Header);
