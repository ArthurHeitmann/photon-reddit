
export default class PostBody extends HTMLElement {
	constructor(postData) {
		super();

		this.className = "content";

		switch (this.getPostType(postData)) {
			case PostType.Image:
				this.innerHTML = `<img alt="${postData.title}" src="${postData.url}" class="postImage">`;
				break;
			case PostType.Text:
				this.innerHTML = `<div class="postText">${postData.selftext}</div>`;
				break;
			case PostType.YtVideo:
				this.innerHTML = postData["media_embed"]["content"];
				break;
			default:
				this.innerText = "Unknown post type";
				break;
		}
	}

	private getPostType(postData: Object): PostType {
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
			throw new Error("What is this post type?");
	}
}

customElements.define("ph-post-body", PostBody);

enum PostType {
	Link,
	Image,
	Video,
	YtVideo,
	Text,
}
