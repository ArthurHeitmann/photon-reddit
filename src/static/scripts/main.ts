import { $id } from "./utils/getElements.js";
import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { mySubreddits, sortPosts, sortPostsTime, subredditPosts } from "./api/api.js";
import Post from "./components/post/post.js";

function init(): void {
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	if (isAccessTokenValid()) {
		loadPosts();
	}
	else {
		checkTokenExpiry().then(isValid => {
			if (isValid)
				loadPosts();
			else
			loginBtn.hidden = false;
			
		})
	}
	
}

function loadPosts() {
	const target = location.pathname;
	let matches;
	let subreddit = "r/popular";
	if (matches = target.match(/^\/(r\/[a-zA-Z0-9]+)$/)) {
		subreddit = matches[1];
	}
	const feed = $id("feed");
	subredditPosts(subreddit, [["limit", "15"]]).then(posts => {
		console.log(posts);
		for (const post of posts["data"]["children"]) {
			let postElement = new Post(post["data"], true);
			feed.appendChild(postElement);
		}
		
	});
}

init();