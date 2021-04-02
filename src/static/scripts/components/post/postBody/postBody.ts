import { getImgurAlbumContents, getImgurContent, ImgurContent, ImgurContentType } from "../../../api/imgurApi.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiData, RedditApiType } from "../../../types/misc.js";
import Ph_MediaViewer from "../../mediaViewer/mediaViewer.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_SimpleVideo from "../../videoPlayer/simpleVideo/simpleVideo.js";
import Ph_VideoPlayer from "../../videoPlayer/videoPlayer.js";
import Ph_ImageViewer, { GalleryInitData } from "../../mediaViewer/imageView/imageView.js";
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
			case PostType.image:
				this.makeImageBody(postData);
				break;
			case PostType.text:
				this.makeTextBody(postData);
				break;
			case PostType.embeddedVideo:
				this.makeEmbeddedVideoBody(postData);
				break;
			case PostType.link:
				this.makeLinkBody(postData);
				break;
			case PostType.video:
				this.makeVideoBody(postData);
				break;
			case PostType.tweet:
				this.makeTweetBody(postData);
				break;
			case PostType.imgur:
				this.makeImgurBody(postData);
				break;
			default:
				this.makeDefaultBody(postData);
				break;
			}

		linksToSpa(this, postType === PostType.text);
	}

	private getPostType(postData: RedditApiData): PostType {
		if (postData["is_self"])
			return PostType.text;
		else if (new RegExp(
			"^((https?://(i|m)?\.?imgur\\.com\/[\\w-]+.(gifv|mp4))|" +
			"(https?://v.redd.it\\/[\\w-]+)|" +
			"(https?://w?w?w?\\.?redgifs.com/watch/\\w+))|" +
			"(https?://gfycat.com/[\\w-]+)|" +
			"(\\.(gif|mp4)(\\?.*)?$)"
		).test(postData["url"])
		)
			return PostType.video;
		else if (/https?:\/\/clips.twitch.tv\/[\w-]+/.test(postData["url"]) && postData["media"])
			return PostType.video;
		else if (postData["post_hint"] == "image" ||
			/(?<!#.*)\.(png|jpg|jpeg|svg)$/.test(postData["url"]) ||
			postData["gallery_data"])
			return PostType.image;
		else if (postData["post_hint"] == "hosted:video")
			return PostType.video;
		else if (/^(https?:\/\/)?imgur\.com\/\w+(\/\w+)?/.test(postData["url"]))
			return PostType.imgur;
		else if (postData["post_hint"] == "rich:video")
			return PostType.embeddedVideo;
		else if (/^(https?:\/\/)?(www\.)?twitter\.com\/[^/]+\/status\/\d+/.test(postData["url"]))
			return PostType.tweet;
		else
			return PostType.link;
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

	private makeMediaViewerBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData(postData));
	}

	private makeImageBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData(postData));
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
		const text = new Ph_PostText(
			postData.data["selftext_html"] || "",
			postData.data["selftext"] || "",
			postData.data["name"]
		);
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
		// this.classList.add("fullScale");
		// if (/imgur\.com\/(a|album|gallery)\/[^/]+\/?$/.test(postData.data["url"])) {
		// 	getImgurAlbumContents(postData.data["url"]).then((contents: ImgurContent[]) => {
		// 		if (contents[0].type === ImgurContentType.video) {
		// 			this.appendChild(new Ph_VideoPlayer(
		// 				new Ph_SimpleVideo([{ src: contents[0].link, type: "video/mp4" }])
		// 			));
		// 			if (contents.length > 1)
		// 				new Ph_Toast(Level.warning, "Imgur album with video and more than 1 items --> only displaying video");
		// 		}
		// 		else {
		// 			this.appendChild(new Ph_ImageViewer(
		// 				contents.map(content => <GalleryInitData> {
		// 					originalUrl: content.link,
		// 					caption: content.caption
		// 				}))
		// 			);
		// 		}
		// 	});
		// }
		// else {
		// 	getImgurContent(postData.data["url"]).then(content => {
		// 		if (content.type === ImgurContentType.image) {
		// 			this.appendChild(new Ph_ImageViewer([{
		// 				originalUrl: content.link,
		// 				caption: content.caption
		// 			}]));
		// 		}
		// 		else {
		// 			this.appendChild(new Ph_VideoPlayer(new Ph_SimpleVideo([{
		// 				src: content.link,
		// 				type: "video/mp4"
		// 			}])))
		// 		}
		// 	})
		// }
	}

	private makeDefaultBody(postData: RedditApiType) {
		this.classList.add("padded");
		this.innerText = `Unknown post type ${this.getPostType(postData.data)}`;
	}
}

customElements.define("ph-post-body", Ph_PostBody);

enum PostType {
	link,
	media,
	image,
	video,
	embeddedVideo,
	text,
	tweet,
	imgur
}
