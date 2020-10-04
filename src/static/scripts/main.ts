import { $class, $id, $tag } from "./utils/getElements.js";
import { checkTokenExpiry, initiateLogin, isAccessTokenValid } from "./login/login.js";
import { mySubreddits, sortPosts, sortPostsTime, subredditPosts } from "./api/api.js";
import Post from "./components/post/post.js";

const header: HTMLElement = $tag("header")[0]; 
function init(): void {
	const loginBtn = $id("loginButton");
	loginBtn.addEventListener("click", initiateLogin);

	header.addEventListener("mouseenter", headerMouseEnter);
	header.addEventListener("mouseleave", headerMouseLeave);

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

	for (const anim of headerShowVisualizer) anim.beginElement();
	header.classList.add("hover");
	clearHideTimeout()
}

function headerMouseLeave(e: MouseEvent) {
	if (e.y < 1) {
		hideTimeout = setTimeout(() => {
			for (const anim of headerHideVisualizer) anim.beginElement()
			header.classList.remove("hover");
		}, 10000);
	}
	else {
		for (const anim of headerHideVisualizer) anim.beginElement();
		header.classList.remove("hover");
		clearHideTimeout()
	}
}

init();