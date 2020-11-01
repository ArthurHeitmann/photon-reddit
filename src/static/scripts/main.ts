import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { pushLinkToHistorySep } from "./state/stateManager.js";
import { $class, $id, $tag, linksToSpa } from "./utils/htmlStuff.js";
import { SVGAnimateElement } from "./utils/types.js";

const header: HTMLElement = $tag("header")[0]; 
function init(): void {
	linksToSpa(document.body);
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	header.addEventListener("mouseenter", headerMouseEnter);
	header.addEventListener("mouseleave", headerMouseLeave);

	if (isAccessTokenValid()) {
		loadPosts();
	}
	else {
		checkTokenExpiry().then(isValid => {
			if (!isValid)
				loginBtn.hidden = false;
			loadPosts();
		})
	}
}

function loadPosts() {
	pushLinkToHistorySep(location.pathname, location.search || "");
}

const headerHideVisualizer = $class("headerHideVisualizer");
const headerShowVisualizer = $class("headerShowVisualizer");
let hideTimeout = null;
function clearHideTimeout() {
	if (hideTimeout === null) 
		return;
	
	clearTimeout(hideTimeout);
	hideTimeout = null;
}

function headerMouseEnter(e: MouseEvent) {
	if (hideTimeout !== null) {
		clearHideTimeout();
		return;
	}

	for (const anim of headerShowVisualizer) (anim as SVGAnimateElement).beginElement();
	header.classList.add("hover");
	clearHideTimeout()
}

function headerMouseLeave(e: MouseEvent) {
	if (e.relatedTarget === null) {
		hideTimeout = setTimeout(() => {
			for (const anim of headerHideVisualizer) (anim as SVGAnimateElement).beginElement()
			header.classList.remove("hover");
		}, 10000);
	}
	else {
		for (const anim of headerHideVisualizer) (anim as SVGAnimateElement).beginElement();
		header.classList.remove("hover");
		clearHideTimeout()
	}
}



window.addEventListener("load", init);
