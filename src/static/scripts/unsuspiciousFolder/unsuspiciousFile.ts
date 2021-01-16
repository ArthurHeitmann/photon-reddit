import { ViewChangeData } from "../historyState/viewsStack.js";

window.addEventListener("viewChange", (e: CustomEvent) => {
	const viewChangeData: ViewChangeData = e.detail;

})


export function hasAnalyticsFileLoaded() {
	return true;
}
