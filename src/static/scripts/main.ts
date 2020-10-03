import { $id } from "./utils/getElements.js";
import { initiateLogin } from "./login/login.js";
import { mySubreddits, sortPosts, sortPostsTime, subredditPosts } from "./api/api.js";

function init(): void {
	const loginBtn = $id("loginButton");

	
	if (localStorage["accessToken"]) {
		loginBtn.hidden = true;
	}
	else {
		loginBtn.addEventListener("click", initiateLogin);
		loginBtn.hidden = false;
	}
}

init();