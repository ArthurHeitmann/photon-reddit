import { getImgurAlbumContents, getImgurContent, ImgurContent, ImgurContentType } from "../../../api/imgurApi.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiData, RedditApiType } from "../../../types/misc.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_SimpleVideo from "../../videoPlayer/simpleVideo/simpleVideo.js";
import Ph_VideoPlayer from "../../videoPlayer/videoPlayer.js";
import Ph_PostImage, { GalleryInitData } from "./postImage/postImage.js";
import Ph_PostText from "./postText/postText.js";

/**
 * Determines the post type and generates the type specific content
 */
export default class Ph_PostBody extends HTMLElement {
	constructor(postData: RedditApiType) {
		super();

		this.classList.add("content");

		const postType = this.getPostType(postData.data);
		switch (postType) {
			case PostType.Image:
				this.makeImageBody(postData);
				break;
			case PostType.Text:
				this.makeTextBody(postData);
				break;
			case PostType.EmbeddedVideo:
				this.makeEmbeddedVideoBody(postData);
				break;
			case PostType.Link:
				this.makeLinkBody(postData);
				break;
			case PostType.Video:
				this.makeVideoBody(postData);
				break;
			case PostType.Tweet:
				this.makeTweetBody(postData);
				break;
			case PostType.Imgur:
				this.makeImgurBody(postData);
				break;
			default:
				this.makeDefaultBody(postData);
				break;
			}

		linksToSpa(this, postType === PostType.Text);
	}

	private getPostType(postData: RedditApiData): PostType {
		if (postData["is_self"])
			return PostType.Text;
		else if (new RegExp(
			"^((https?://(i|m)?\.?imgur\\.com\/[\\w-]+.(gifv|mp4))|" +
			"(https?://v.redd.it\\/[\\w-]+)|" +
			"(https?://w?w?w?\\.?redgifs.com/watch/\\w+))|" +
			"(https?://gfycat.com/[\\w-]+)|" +
			"(\\.(gif|mp4)(\\?.*)?$)"
		).test(postData["url"])
		)
			return PostType.Video;
		else if (/https?:\/\/clips.twitch.tv\/[\w-]+/.test(postData["url"]) && postData["media"])
			return PostType.Video;
		else if (postData["post_hint"] == "image" ||
			/(?<!#.*)\.(png|jpg|jpeg|svg)$/.test(postData["url"]) ||
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

	private makeLinkBody(postData: RedditApiType) {
		this.classList.add("padded");
		if (postData.data["preview"])
			this.innerHTML = `
				<div class="linkPreviewWrapper">
					<a href="${escADQ(postData.data["url"])}" rel="noopener">${escHTML(postData.data["url"])}</a>
					<img src="${escADQ(postData.data["preview"]["images"][0]["source"]["url"])}" alt="preview">
				</div>`;
		else
			this.innerHTML = `<a href="${escADQ(postData.data["url"])}" rel="noopener">${escHTML(postData.data["url"])}</a>`;
	}

	private makeImageBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_PostImage.fromPostData(postData));
	}

	private makeVideoBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_VideoPlayer.fromPostData(postData));
	}

	private makeEmbeddedVideoBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		const iframeSrc = postData.data["media_embed"]["content"].match(/src="([^"]+)"/)[1];
		this.innerHTML = `<div class="aspect-ratio-16-9-wrapper"><iframe src="${escADQ(iframeSrc)}" allowfullscreen></iframe></div>`;
	}

	private makeTextBody(postData: RedditApiType) {
		const text = new Ph_PostText(postData.data["selftext_html"] || "");
		this.appendChild(text);
		if (text.innerText)
			this.classList.add("padded");
	}

	private makeTweetBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.innerHTML = `
			<div class="aspect-ratio-16-9-wrapper">
				<iframe border=0 frameborder=0 height=250 width=550
					src="https://twitframe.com/show?url=${encodeURIComponent(postData.data["url"])}&theme=dark&align=center">
				</iframe>
			</div>`;
	}

	private makeImgurBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		if (/imgur\.com\/(a|album|gallery)\/[^/]+\/?$/.test(postData.data["url"])) {
			getImgurAlbumContents(postData.data["url"]).then((contents: ImgurContent[]) => {
				if (contents[0].type === ImgurContentType.Video) {
					this.appendChild(new Ph_VideoPlayer(
						new Ph_SimpleVideo([{ src: contents[0].link, type: "video/mp4" }])
					));
					if (contents.length > 1)
						new Ph_Toast(Level.Warning, "Imgur album with video and more than 1 items --> only displaying video");
				}
				else {
					this.appendChild(new Ph_PostImage(
						contents.map(content => <GalleryInitData> {
							originalUrl: content.link,
							caption: content.caption
						}))
					);
				}
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
	}

	private makeDefaultBody(postData: RedditApiType) {
		this.classList.add("padded");
		this.innerText = `Unknown post type ${this.getPostType(postData.data)}`;
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
