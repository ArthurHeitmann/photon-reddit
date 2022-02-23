import ViewsStack from "../../../historyState/viewsStack";
import {HistoryState} from "../../../types/misc";
import {hasParams} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import {Ph_ViewState} from "../viewState";

/**
 * A Ph_ViewState with a loading screen
 */
export default class Ph_ViewStateLoader extends Ph_ViewState {
	constructor(state: HistoryState) {
		super(state);
		if (!hasParams(arguments)) return;
		this.innerHTML = `<img src="/img/loading1.svg" alt="loading" class="loadingIcon">`;
	}

	finishWith(elem: HTMLElement) {
		this.innerHTML = "";
		this.addEventListener("click", this.onBackAreaClick);
		this.appendChild(elem);
	}

	error(errorInfo?: HTMLElement) {
		this.innerHTML = `
			<div>
				<h2>Oh no an error occurred!</h2>
				<div>What could have happened?</div>
				<ul>
					<li>The page you tried to visit was deleted or isn't publicly visible.</li>
					<li>You entered an invalid Url.</li>
					<li>Reddit is having problems. Check <a href="https://www.redditstatus.com" target="_blank">redditstatus.com</a></li>
					<li>If you are using Firefox in Private Mode, you have to disable "Enhanced Tracking Protection" for this site <br>(a Firefox bug).</li>
					<li>Some internal error occurred. Check the browser console logs.</li>
				</ul>
			</div>
		`;
		if (errorInfo)
			this.children[0].append(errorInfo);
	}

	onBackAreaClick(e: MouseEvent) {
		if (!Users.global.d.photonSettings.emptyAreaClickGoesBack)
			return;
		if (e.currentTarget !== e.target || !ViewsStack.hasPreviousLoaded())
			return;
		
		history.back();
	}
}

customElements.define("ph-view-state-loader", Ph_ViewStateLoader);
