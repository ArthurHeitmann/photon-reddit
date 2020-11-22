import Ph_Toast, { Level } from "./components/misc/toast/toast.js";
import Ph_PostBody from "./components/post/postBody/postBody.js";
import { RedditApiType } from "./utils/types.js";
import { splitPathQuery } from "./utils/utils.js";

window.addEventListener("load", async () => {
	const params = new URLSearchParams(location.search);
	if (!params.has("url"))
		return

	let fetchUrl = params.get("url");
	let [path, query] = splitPathQuery(fetchUrl);
	path = path.replace(/\/?.?j?s?o?n?$/, "/.json");
	fetchUrl = "https://www.reddit.com" + path + query;
	try {
		const resp = await fetch(fetchUrl);
		const data: RedditApiType[] = await resp.json();
		document.body.appendChild(new Ph_PostBody(data[0].data.children[0]));
	}
	catch (e) {
		new Ph_Toast(Level.Error, `Error making request to reddit (${fetchUrl})`);
	}
});
