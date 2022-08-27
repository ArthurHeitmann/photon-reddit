import {RedditPostData} from "../../../types/redditTypes";
import {linksToSpa} from "../../../utils/htmlStuff";
import {getThumbnailUrl, getTwitchClipEmbedUrl, hasParams} from "../../../utils/utils";
import Ph_MediaViewer from "../../mediaViewer/mediaViewer";
import Ph_PostText from "./postText/postText";
import {PhEvents} from "../../../types/Events";
import Users from "../../../multiUser/userManagement";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import Ph_PostBodyCompactWrapper from "./compactBodyWrapper/compactBodyWrapper";
import {AllowIframesDecision, FeedDisplayType} from "../../global/photonSettings/settingsConfig";
import Ph_PostLink from "../postLink/postLink";
import Ph_IframeWrapper from "../../misc/iframeWrapper/iframeWrapper";

/**
 * Determines the post type and generates the type specific content
 */
export default class Ph_PostBody extends Ph_PhotonBaseElement {
	isInitialized = false;
	postType: PostType;
	private isBodyCollapsable = false;
	private bodyWrapper: Ph_PostBodyCompactWrapper;

	constructor(postData: RedditPostData | undefined, preferSmallerPost = false) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("content");
		this.classList.add("unintialized");

		this.bodyWrapper = new Ph_PostBodyCompactWrapper();
		if (postData)
			this.bodyWrapper.init(postData);
		this.bodyWrapper.addEventListener(PhEvents.compactPostToggle,
			() => this.classList.toggle("compact", !this.bodyWrapper.isExpanded));
		this.classList.toggle("compact", !this.bodyWrapper.isExpanded);
		this.addWindowEventListener(PhEvents.settingsChanged,
			this.updateCollapsedState.bind(this));
		this.append(this.bodyWrapper);

		if (postData) {
			this.postType = this.getPostType(postData, preferSmallerPost);
			this.init(postData, preferSmallerPost);
		}
	}

	init(postData: RedditPostData, preferSmallerPost = false) {
		if (!hasParams(arguments)) return;
		if (this.isInitialized)
			return;
		this.isInitialized = true;
		this.classList.remove("unintialized");

		if (!this.postType)
			this.postType = this.getPostType(postData, preferSmallerPost);
		switch (this.postType) {
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
		// surprise surprise, new reddit update allows text with images
		if (this.postType != PostType.text && postData.selftext.length > 0) {
			this.makeTextBody(postData);
			this.children[this.children.length - 1].classList.add("textAfterMedia");
		}

		this.bodyWrapper.init(postData);
		this.updateCollapsedState();

		linksToSpa(this, this.postType === PostType.text);
	}

	reinitialize(postData: RedditPostData) {
		this.isInitialized = false;
		this.postType = undefined;
		[...this.children]
			.filter(child => child !== this.bodyWrapper)
			.forEach(child => child.remove());
		this.init(postData);
	}

	private updateCollapsedState() {
		const isCollapsable = this.isBodyCollapsable && (
			Users.global.d.photonSettings.feedDisplayType === FeedDisplayType.compact ||
			Users.global.d.photonSettings.feedDisplayType === FeedDisplayType.gridCompact
		);
		this.classList.toggle("isBodyCollapsable", isCollapsable);
	}

	getPostType(postData: RedditPostData, preferSmallerPost): PostType {
		if (preferSmallerPost)
			return PostType.link;
		else if (postData.is_self)
			return PostType.text;
		else if (Ph_MediaViewer.isUrlImgur(postData.url))
			return PostType.imgur;
		else if (Ph_MediaViewer.isPostVideo(postData))
			return PostType.video
		else if (Ph_MediaViewer.isPostImage(postData))
			return PostType.image;
		else if (postData.gallery_data)
			return PostType.redditGallery;
		else if (postData.post_hint == "rich:video" || /https?:\/\/clips.twitch.tv\/[\w-]+/i.test(postData.url) && postData.media_embed?.content)
			return PostType.embeddedVideo;
		else if (/^(https?:\/\/)?(www\.)?twitter\.com\/[^/]+\/status\/\d+/i.test(postData.url))
			return PostType.tweet;
		else
			return PostType.link;
	}

	private makeLinkBody(postData: RedditPostData) {
		this.classList.add("padded");
		const thumbnailUrl = getThumbnailUrl(postData);
		this.append(new Ph_PostLink(postData.url, thumbnailUrl))
	}

	private makeImageBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = true;
		this.appendChild(Ph_MediaViewer.fromPostData_Image(postData));
	}

	private makeVideoBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = true;
		this.appendChild(Ph_MediaViewer.fromPostData_Video(postData));
	}

	private makeRedditGalleryBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = true;
		this.appendChild(Ph_MediaViewer.fromPostData_RedditGallery(postData));
	}

	private makeEmbeddedVideoBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = Users.global.d.photonSettings.allowIframes !== AllowIframesDecision.block;
		let iframeSrc = postData.media_embed.content.match(/src="([^"]+)"/)[1];		// extract src attribute from <iframe>
		if (/^https:\/\/cdn\.embedly\.com\/widgets\/media\.html\?src=https%3A%2F%2F\w+\.twitch\.tv/.test(iframeSrc))
			iframeSrc = getTwitchClipEmbedUrl(iframeSrc);
		this.append(new Ph_IframeWrapper(iframeSrc, {
			fallbackUrl: postData.url,
			fallbackThumbnailUrl: getThumbnailUrl(postData),
		}));
	}

	private makeTextBody(postData: RedditPostData) {
		this.append(new Ph_PostText(postData));
	}

	private makeTweetBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = Users.global.d.photonSettings.allowIframes !== AllowIframesDecision.block;
		const id = postData.url.match(/\/status\/(\d+)/)[1];
		const twitterEmbedParams = new URLSearchParams({
			id: id,
			width: "550px",
			theme: "dark",
			origin: location.origin,
			dnt: "true"
		});
		this.append(new Ph_IframeWrapper(`https://platform.twitter.com/embed/Tweet.html?${twitterEmbedParams.toString()}`, {
			fallbackUrl: postData.url,
			fallbackThumbnailUrl: getThumbnailUrl(postData),
			loadingText: "Loading Tweet..."
		}));
	}

	private makeImgurBody(postData: RedditPostData) {
		this.classList.add("fullScale");
		this.isBodyCollapsable = true;
		this.appendChild(Ph_MediaViewer.fromImgurUrl(postData.url));
	}

	private makeDefaultBody(postData: RedditPostData) {
		this.classList.add("padded");
		this.innerText = `Unknown post type ${this.getPostType(postData, false)}`;
	}
}

customElements.define("ph-post-body", Ph_PostBody);

export enum PostType {
	link,
	image,
	video,
	redditGallery,
	embeddedVideo,
	text,
	tweet,
	imgur
}
