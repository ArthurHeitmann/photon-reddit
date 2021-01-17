import { hasAnalyticsFileLoaded } from "./unsuspiciousFolder/unsuspiciousFile.js";
import Ph_Header from "./components/global/header/header.js";
import Ph_Toast, { Level } from "./components/misc/toast/toast.js";
import { pushLinkToHistorySep } from "./historyState/historyStateManager.js";
import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { thisUser } from "./utils/globals.js";
import { $id, linksToSpa } from "./utils/htmlStuff.js";

async function init(): Promise<void> {
	$id("mainWrapper").insertAdjacentElement("afterbegin", new Ph_Header());

	linksToSpa(document.body);

	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	checkIfAnalyticsFileLoaded()

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

	if (!localStorage["firstTimeFlag"])
		localStorage["firstTimeFlag"] = "set";
}

function loadPosts() {
	window.dispatchEvent(new Event("ph-ready"));
	pushLinkToHistorySep(location.pathname + location.hash, location.search || "");
}

function checkIfAnalyticsFileLoaded() {
	if (hasAnalyticsFileLoaded())
		return;

	console.error("couldn't load unsuspiciousFolder file");
	new Ph_Toast(Level.Error, "Couldn't load all script files");
	throw "couldn't load unsuspiciousFolder file";
}

window.addEventListener("load", init);
