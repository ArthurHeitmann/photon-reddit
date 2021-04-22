import { getImgurAlbumContents, getImgurContent, ImgurContent, ImgurContentType } from "../../../api/imgurApi.js";
import { escADQ, escHTML } from "../../../utils/htmlStatics.js";
import { linksToSpa } from "../../../utils/htmlStuff.js";
import { RedditApiData, RedditApiType } from "../../../types/misc.js";
import Ph_MediaViewer from "../../mediaViewer/mediaViewer.js";
import Ph_PostText from "./postText/postText.js";

/**
 * Determines the post type and generates the type specific content
 */
export default class Ph_PostBody extends HTMLElement {
	isInitialized = false;

	constructor(postData?: RedditApiType) {
		super();

		this.classList.add("content");
		this.classList.add("aspect-ratio-16-9-wrapper");

		if (postData)
			this.init(postData);
	}

	init(postData: RedditApiType) {
		if (this.isInitialized)
			return;
		this.isInitialized = true;
		this.classList.remove("aspect-ratio-16-9-wrapper");

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
			case PostType.redditGallery:
				this.makeRedditGalleryBody(postData);
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
		else if (Ph_MediaViewer.isPostVideo(postData))
			return PostType.video
		else if (Ph_MediaViewer.isPostImage(postData))
			return PostType.image;
		else if (Ph_MediaViewer.isUrlImgur(postData["url"]))
			return PostType.imgur;
		else if (postData["gallery_data"])
			return PostType.redditGallery;
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

	private makeImageBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_Image(postData));
	}

	private makeVideoBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_Video(postData));
	}

	private makeRedditGalleryBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_RedditGallery(postData));
	}

	private makeEmbeddedVideoBody(postData: RedditApiType) {
		this.classList.add("fullScale");
		const iframeSrc = postData.data["media_embed"]["content"].match(/src="([^"]+)"/)[1];
		this.innerHTML = `<div class="aspect-ratio-16-9-wrapper"><iframe src="${escADQ(iframeSrc)}" allowfullscreen></iframe></div>`;
	}

	private makeTextBody(postData: RedditApiType) {
		const text = new Ph_PostText(postData.data);
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
		this.appendChild(Ph_MediaViewer.fromImgurUrl(postData.data["url"]));
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
	redditGallery,
	embeddedVideo,
	text,
	tweet,
	imgur
}
