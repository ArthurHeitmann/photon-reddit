import ViewsStack from "../../../historyState/viewsStack";
import {HistoryState} from "../../../types/misc";
import {hasParams, makeElement} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import {Ph_ViewState} from "../viewState";
import {pushLinkToHistoryComb, PushType} from "../../../historyState/historyStateManager";
import {getLoadingIcon} from "../../../utils/htmlStatics";

/**
 * A Ph_ViewState with a loading screen
 */
export default class Ph_ViewStateLoader extends Ph_ViewState {
	private errorElement: HTMLElement;
	private loadingIcon: HTMLElement;

	constructor(state: HistoryState) {
		super(state);
		if (!hasParams(arguments)) return;

		this.append(this.loadingIcon = getLoadingIcon("1"));
	}

	finishWith(elem: HTMLElement) {
		this.innerHTML = "";
		this.addEventListener("click", this.onBackAreaClick);
		this.appendChild(elem);
	}

	error(errorInfo?: HTMLElement) {
		this.loadingIcon.remove();

		this.append(this.errorElement = makeElement("div", { class: "center-h-alt flex f-direction-column" }, [
			makeElement("h2", {}, "Oh no an error occurred!"),
			makeElement("div", {}, "What could have happened?"),
			makeElement("ul", {}, [
				makeElement("li", {}, "The page you tried to visit was deleted or isn't publicly visible."),
				makeElement("li", {}, "You entered an invalid Url."),
				makeElement("li", {}, `Reddit is having problems. Check <a href="https://www.redditstatus.com" target="_blank">redditstatus.com</a>`, true),
				makeElement("li", {}, `If you are using Firefox in Private Mode, you have to disable "Enhanced Tracking Protection" for this site <br>(a Firefox bug).`, true),
				makeElement("li", {}, "Some internal error occurred. Check the browser console logs."),
			]),
			makeElement("button", { class: "button retryButton", onclick: this.retryLoadingUrl.bind(this) }, "Reload"),
		]));

		if (errorInfo)
			this.children[0].append(errorInfo);
	}

	async retryLoadingUrl() {
		this.errorElement?.remove();
		this.errorElement = null;
		this.innerHTML = "";
		this.append(this.loadingIcon);
		pushLinkToHistoryComb(this.state.url, PushType.reload);
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
