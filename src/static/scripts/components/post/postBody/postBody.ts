import { replaceRedditLinks } from "../../../utils/conv.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiData, RedditApiType } from "../../../utils/types.js";
import Ph_MediaPlayer from "../../videoPlayer/mediaPlayer.js";
import Ph_PostImage from "./postImage/postImage.js";

export default class Ph_PostBody extends HTMLElement {
	constructor(postData: RedditApiType) {
		super();
		if (postData.data["crosspost_parent_list"])		// is cross post ? use original post data
			postData.data = postData.data["crosspost_parent_list"][0];

		this.classList.add("content");

		switch (this.getPostType(postData.data)) {
			case PostType.Image:
				this.classList.add("fullScale");
				this.appendChild(new Ph_PostImage(postData));
				break;
			case PostType.Text:
				this.classList.add("padded");
				this.innerHTML = `<div class="postText">${postData.data["selftext_html"] || ""}</div>`;
				break;
			case PostType.YtVideo:
				this.classList.add("padded");
				this.innerHTML = postData.data["media_embed"]["content"];
				break;
			case PostType.Link:
				this.classList.add("padded");
				this.innerHTML = `<a href="${postData.data["url"]}" target="_blank">${postData.data["url"]}</a>`
				break;
			case PostType.Video:
				this.classList.add("fullScale");
				this.appendChild(new Ph_MediaPlayer(postData));
				break;
			default:
				this.classList.add("padded");
				this.innerText = `Unknown post type ${this.getPostType(postData.data)}`;
				break;
			
			}
		for (const a of this.getElementsByTagName("a"))
			a.target = "_blank";

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	private getPostType(postData: RedditApiData): PostType {
		if (postData["is_self"])
			return PostType.Text;
		else if (postData["url"].match(/(https:\/\/i.imgur.com\/[\w-]+.gifv)|(https:\/\/gfycat.com\/[\w-]+)/))
			return PostType.Video;
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
