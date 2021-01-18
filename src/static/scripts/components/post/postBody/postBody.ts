import { getImgurAlbumContents, getImgurContent, ImgurContentType } from "../../../api/imgurAPI.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiData, RedditApiType } from "../../../utils/types.js";
import { replaceRedditLinks } from "../../../utils/utils.js";
import Ph_SimpleVideo from "../../videoPlayer/simpleVideo/simpleVideo.js";
import Ph_VideoPlayer from "../../videoPlayer/videoPlayer.js";
import Ph_PostImage, { GalleryInitData } from "./postImage/postImage.js";
import Ph_PostText from "./postText/postText.js";

export default class Ph_PostBody extends HTMLElement {
	constructor(postData: RedditApiType) {
		super();
		if (postData.data["crosspost_parent_list"])		// is cross post ? use original post data
			postData.data = { ...postData.data, ...postData.data["crosspost_parent_list"][0] };

		this.classList.add("content");

		switch (this.getPostType(postData.data)) {
			case PostType.Image:
				this.classList.add("fullScale");
				this.appendChild(Ph_PostImage.fromPostData(postData));
				break;
			case PostType.Text:
				const text = new Ph_PostText(postData.data["selftext_html"] || "");
				this.appendChild(text);
				if (text.innerText)
					this.classList.add("padded");
				break;
			case PostType.EmbeddedVideo:
				this.classList.add("fullScale");
				const iframeSrc = postData.data["media_embed"]["content"].match(/src="([^"]+)"/)[1]; 
				this.innerHTML = `<div class="aspect-ratio-16-9-wrapper"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`;		// TODO escape attribute
				break;
			case PostType.Link:
				this.classList.add("padded");
				if (postData.data["preview"])
					// TODO escape attributes
					this.innerHTML = `
						<div class="linkPreviewWrapper">
							<a href="${postData.data["url"]}" target="_blank" rel="noopener">${postData.data["url"]}</a>
							<img src="${postData.data["preview"]["images"][0]["source"]["url"]}">
						</div>`;
				else
					this.innerHTML = `<a href="${postData.data["url"]}" target="_blank" rel="noopener">${postData.data["url"]}</a>`						// TODO escape attribute
				break;
			case PostType.Video:
				this.classList.add("fullScale");
				this.appendChild(Ph_VideoPlayer.fromPostData(postData));
				break;
			case PostType.Tweet:
				this.classList.add("fullScale");
				this.innerHTML = `
					<div class="aspect-ratio-16-9-wrapper">
						<iframe border=0 frameborder=0 height=250 width=550
 							src="https://twitframe.com/show?url=${encodeURIComponent(postData.data["url"])}&theme=dark&align=center">
						</iframe>
					</div>`;
				break;
			case PostType.Imgur:
				this.classList.add("fullScale");
				if (/imgur\.com\/(a|album|gallery)\/[^/]+$/.test(postData.data["url"])) {
					getImgurAlbumContents(postData.data["url"]).then(contents => {
						this.appendChild(new Ph_PostImage(
							contents.map(content => <GalleryInitData> {
								originalUrl: content.link,
								caption: content.caption
							}))
						)
					});
				}
				else {
					getImgurContent(postData.data["url"]).then(content => {
						if (content.type === ImgurContentType.Image) {
							this.appendChild(new Ph_PostImage([{
								originalUrl: content.link,
								caption: content.caption
							}]));
						}
						else {
							 this.appendChild(new Ph_VideoPlayer(new Ph_SimpleVideo([{
								 src: content.link,
								 type: "video/mp4"
							 }])))
						}
					})
				}
				break;
			default:
				this.classList.add("padded");
				this.innerText = `Unknown post type ${this.getPostType(postData.data)}`;
				break;
			
			}
		for (const a of this.$tag("a"))
			(a as HTMLAnchorElement).target = "_blank";

		replaceRedditLinks(this);
		linksToSpa(this);
	}

	private getPostType(postData: RedditApiData): PostType {
		if (postData["is_self"])
			return PostType.Text;
		else if (new RegExp(
			"^((https?://(i|m)?\.?imgur\\.com\/[\\w-]+.(gifv|mp4))|" +
			"(https?://v.redd.it\/[\\w-]+)|" +
			"(https?://w?w?w?\.?redgifs.com\/watch\/\\w+))|" +
			"(\.(gif|mp4)(\\?.*)?$)"
		).test(postData["url"])
		)
			return PostType.Video;
		else if (/https?:\/\/gfycat.com\/[\w-]+/.test(postData["url"]) && postData["media"])
			return PostType.Video;
		else if (/https?:\/\/clips.twitch.tv\/[\w-]+/.test(postData["url"]) && postData["media"])
			return PostType.Video;
		else if (postData["post_hint"] == "image" ||
			/\.(png|jpg|jpeg|svg)$/.test(postData["url"]) ||
			postData["gallery_data"])
			return PostType.Image;
		else if (postData["post_hint"] == "hosted:video")
			return PostType.Video;
		else if (/^(https?:\/\/)?imgur\.com\/\w+(\/\w+)?/.test(postData["url"]))
			return PostType.Imgur;
		else if (postData["post_hint"] == "rich:video")
			return PostType.EmbeddedVideo;
		else if (/^(https?:\/\/)?(www\.)?twitter\.com\/[^/]+\/status\/\d+/.test(postData["url"]))
			return PostType.Tweet;
		else
			return PostType.Link;
		}
}

customElements.define("ph-post-body", Ph_PostBody);

enum PostType {
	Link,
	Image,
	Video,
	EmbeddedVideo,
	Text,
	Tweet,
	Imgur
}
