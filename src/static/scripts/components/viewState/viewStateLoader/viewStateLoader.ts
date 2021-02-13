import ViewsStack from "../../../historyState/viewsStack.js";
import { HistoryState } from "../../../types/misc.js";
import { Ph_ViewState } from "../viewState.js";

export default class Ph_ViewStateLoader extends Ph_ViewState {
	constructor(state: HistoryState) {
		super(state);
		this.innerHTML = `<img src="/img/loading.svg" alt="loading class="loadingIcon">`;
	}

	finishWith(elem: HTMLElement) {
		this.innerHTML = "";
		this.addEventListener("click", this.onBackAreaClick);
		this.appendChild(elem);
	}

	error() {
		this.innerHTML = `
			<div>
				<h2>Oh no an error occurred!</h2>
				<div>What could have happened?</div>
				<ul>
					<li>You entered an invalid Url.</li>
					<li>Some internal error occurred. Check the browser console logs.</li>
					<li>Reddit is having problems. Check <a href="https://www.redditstatus.com" target="_blank">redditstatus.com</a></li>
				</ul>
			</div>
		`;
	}

	onBackAreaClick(e: MouseEvent) {
		if (e.currentTarget !== e.target || !ViewsStack.hasPreviousLoaded())
			return;
		
		history.back();
	}
}

customElements.define("ph-view-state-loader", Ph_ViewStateLoader);
