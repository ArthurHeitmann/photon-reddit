import PostBody from "../postBody/postBody.js";

export default class Post extends HTMLElement {
	constructor(postData, isPreview: boolean) {
		super();
		
		this.className = "post flex shadow-diffuse"
		
		const actionBar = document.createElement("div");
		actionBar.className = "actions flex f-direction-column f-align-center";
		actionBar.innerHTML = `
			<button class="vote">+</button>
			<div class="upvotes">${postData.ups}</div>
			<button class="vote">-</button>
			<button class="additionalActions mta">^</button>
			<button class="comments"></button>
		`;
		this.appendChild(actionBar);
		
		const mainPart = document.createElement("div");
		mainPart.innerHTML = `
			<div class="header">
				<div class="top flex">
					<span>Posted in</span>
					<a href="/${postData["subreddit_name_prefixed"]}" class="${postData["subreddit_name_prefixed"]}">
						<img src="#" alt="" class="subredditIcon"></img>
						<span class="subredditTitle">${postData["subreddit_name_prefixed"]}</span>
					</a>
					<span>by</span>
					<a href="/u/${postData["author"]}" class="subredditTitle">
						<span class="subredditTitle">u/${postData["author"]}</span>
					</a>
					<div class="dropdown">${ new Date(parseInt(postData["created_utc"])).toTimeString() }</div>
					<div class="time">${postData["created_utc"]}</div>
					<span>ago</span>
				</div>
				<div class="bottom flex">
					<div class="title">${postData["title"]}</div>
					<div class="mla flex">
					</div>
				</div>
			</div>
		`;
		mainPart.appendChild(new PostBody(postData));
		this.appendChild(mainPart);
	}
}

customElements.define("ph-post", Post);
