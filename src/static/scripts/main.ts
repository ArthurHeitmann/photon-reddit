import { fetchThisUserName } from "./api/api.js";
import Ph_Header from "./components/global/header/header.js";
import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { pushLinkToHistorySep } from "./state/stateManager.js";
import { $class, $id, $tag, linksToSpa } from "./utils/htmlStuff.js";
import { SVGAnimateElement } from "./utils/types.js";

async function init(): Promise<void> {
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());

	linksToSpa(document.body);
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	if (isAccessTokenValid()) {
		await fetchThisUserName()
		loadPosts();
	}
	else {
		const isValid = await checkTokenExpiry()
		if (!isValid)
			loginBtn.hidden = false;
		else
			await fetchThisUserName();
		loadPosts();
	}
}

function loadPosts() {
	pushLinkToHistorySep(location.pathname, location.search || "");
}



window.addEventListener("load", init);
