import {RedditPostData} from "../../../types/redditTypes";
import {escADQ, escHTML} from "../../../utils/htmlStatics";
import {linksToSpa} from "../../../utils/htmlStuff";
import {hasParams} from "../../../utils/utils";
import Ph_MediaViewer from "../../mediaViewer/mediaViewer";
import Ph_PostText from "./postText/postText";

/**
 * Determines the post type and generates the type specific content
 */
export default class Ph_PostBody extends HTMLElement {
	isInitialized = false;

	constructor(postData: RedditPostData | undefined) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("content");
		this.classList.add("aspect-ratio-16-9-wrapper");

		if (postData)
			this.init(postData);
	}

	init(postData: RedditPostData) {
		if (!hasParams(arguments)) return;
		if (this.isInitialized)
			return;
		this.isInitialized = true;
		this.classList.remove("aspect-ratio-16-9-wrapper");

		const postType = this.getPostType(postData);
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

	private getPostType(postData: RedditPostData): PostType {
		if (postData.is_self)
			return PostType.text;
		else if (Ph_MediaViewer.isUrlImgur(postData.url))
			return PostType.imgur;
		else if (Ph_MediaViewer.isPostVideo(postData))
			return PostType.video
		else if (Ph_MediaViewer.isPostImage(postData))
			return PostType.image;
		else if (postData.gallery_data)
			return PostType.redditGallery;
		else if (postData.post_hint == "rich:video")
			return PostType.embeddedVideo;
		else if (/^(https?:\/\/)?(www\.)?twitter\.com\/[^/]+\/status\/\d+/.test(postData.url))
			return PostType.tweet;
		else
			return PostType.link;
	}

	private makeLinkBody(postData: RedditPostData) {
		this.classList.add("padded");
		if (postData.preview)
			this.innerHTML = `
				<div class="linkPreviewWrapper">
					<a href="${escADQ(postData.url)}" rel="noopener">${escHTML(postData.url)}</a>
					<img src="${escADQ(postData.preview.images[0].source.url)}" alt="preview">
				</div>`;
		else
			this.innerHTML = `<a href="${escADQ(postData.url)}" rel="noopener">${escHTML(postData.url)}</a>`;
	}

	private makeImageBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_Image(postData));
	}

	private makeVideoBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_Video(postData));
	}

	private makeRedditGalleryBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromPostData_RedditGallery(postData));
	}

	private makeEmbeddedVideoBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		const iframeSrc = postData.media_embed.content.match(/src="([^"]+)"/)[1];		// extract src attribute from <iframe>
		this.innerHTML = `<div class="aspect-ratio-16-9-wrapper"><iframe src="${escADQ(iframeSrc)}" allowfullscreen></iframe></div>`;
	}

	private makeTextBody(postData: RedditPostData) {
		this.append(new Ph_PostText(postData));
	}

	private makeTweetBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.innerHTML = `
			<div class="aspect-ratio-16-9-wrapper">
				<iframe border=0 frameborder=0 height=250 width=550
					src="https://twitframe.com/show?url=${encodeURIComponent(postData.url)}&theme=dark&align=center">
				</iframe>
			</div>`;
	}

	private makeImgurBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.appendChild(Ph_MediaViewer.fromImgurUrl(postData.url));
	}

	private makeDefaultBody(postData: RedditPostData) {
		this.classList.add("padded");
		this.innerText = `Unknown post type ${this.getPostType(postData)}`;
	}
}

customElements.define("ph-post-body", Ph_PostBody);

enum PostType {
	link,
	image,
	video,
	redditGallery,
	embeddedVideo,
	text,
	tweet,
	imgur
}
