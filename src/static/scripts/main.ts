import Ph_Header from "./components/global/header/header.js";
import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { pushLinkToHistorySep } from "./state/stateManager.js";
import { thisUser } from "./utils/globals.js";
import { $id, linksToSpa } from "./utils/htmlStuff.js";

async function init(): Promise<void> {
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());

	linksToSpa(document.body);
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	if (isAccessTokenValid()) {
		await thisUser.fetch();
		loadPosts();
	}
	else {
		const isValid = await checkTokenExpiry()
		if (!isValid)
			loginBtn.hidden = false;
		else
			await thisUser.fetch();
		loadPosts();
	}
}

function loadPosts() {
	window.dispatchEvent(new Event("ph-ready"));
	pushLinkToHistorySep(location.pathname + location.hash, location.search || "");
}


window.addEventListener("load", init);
