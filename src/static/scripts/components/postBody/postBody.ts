import { RedditApiData, RedditApiType } from "../../utils/types.js";

export default class Ph_PostBody extends HTMLElement {
	constructor(postData: RedditApiType) {
		super();

		this.className = "content";

		switch (this.getPostType(postData.data)) {
			case PostType.Image:
				this.innerHTML = `<img alt="${postData.data["title"]}" src="${postData.data["url"]}" class="postImage">`;
				break;
			case PostType.Text:
				this.innerHTML = `<div class="postText">${postData.data["selftext_html"]}</div>`;
				break;
			case PostType.YtVideo:
				this.innerHTML = postData.data["media_embed"]["content"];
				break;
			case PostType.Link:
				this.innerHTML = `<a href="${postData.data["url"]}" target="_blank">${postData.data["url"]}</a>`
				break;
			case PostType.Video:
				this.innerHTML = `
					<video>
						<source src="${postData.data["secure_media"]["reddit_video"]["hls_url"]}" type="application/vnd.apple.mpegURL">
					</video>
				`;
				break;
			default:
				this.innerText = "Unknown post type";
				break;
			
			}
		for (const a of this.getElementsByTagName("a"))
			a.target = "_blank";
	}

	private getPostType(postData: RedditApiData): PostType {
		if (postData["is_self"])
			return PostType.Text;
		else if (postData["post_hint"] == "link")
			return PostType.Link;
		else if (postData["post_hint"] == "image")
			return PostType.Image;
		else if (postData["post_hint"] == "hosted:video")
			return PostType.Video;
		else if (postData["post_hint"] == "rich:video")
			return PostType.YtVideo;
		else
			return PostType.Link;
		}
}

customElements.define("ph-post-body", Ph_PostBody);

enum PostType {
	Link,
	Image,
	Video,
	YtVideo,
	Text,
}
