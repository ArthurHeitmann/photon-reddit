import {RedditPostData} from "../../../types/redditTypes";
import Ph_GifVideo from "./gifVideo/gifVideo";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo";
import Ph_Toast, {Level} from "../../misc/toast/toast";
import {getGfycatMp4SrcFromUrl} from "../../../api/gfycatApi";
import Ph_VideoAudio from "./videoAudio/videoAudio";
import {SourceData} from "./videoWrapper";
import {isJsonEqual} from "../../../utils/utils";
import {youtubeDlUrl} from "../../../api/photonApi";
import {getStreamableUrl} from "../../../api/streamableApi";
import Ph_VideoPlayer from "./videoPlayer";
import {getRedgifsMp4SrcFromUrl} from "../../../api/redgifsApi";

/** Creates a video player from a reddit post (with a video link) */
export function videoPlayerFromPostData({ postData, url }: { postData?: RedditPostData, url?: string }): Ph_VideoPlayer {
	if (!(postData || url))
		throw "either postData or url is needed";
	if (postData)
		url = postData.url;

	const videoOut = new Ph_VideoPlayer(url);

	function defaultCase() {
		if (/\.gif(\?.*)?$/i.test(url)) {
			videoOut.init(new Ph_GifVideo(url));
			return;
		}
		else if (/\.mp4(\?.*)?$/i.test(url)) {
			videoOut.init(new Ph_SimpleVideo([{src: url, type: "video/mp4"}]));
			return;
		}
		console.error(`Unknown video provider for ${url}`);
		new Ph_Toast(Level.error, `Unknown video provider for ${url}`);
	}

	// task of this huuuuge switch: get the video file url (.mp4/.gif/...) of this post and init the video player with it
	switch (url.match(/^https?:\/\/w?w?w?\.?([\w.]+)/i)[1]) {
		case "imgur.com":
		case "m.imgur.com":
		case "i.imgur.com":
			const typelessUrl = url.match(/^https?:\/\/([im])?\.?imgur\.com\/\w+/i)[0];		// removes file ending usually all .gif or .gifv have an .mp4
			videoOut.init(new Ph_SimpleVideo([
				{src: typelessUrl + ".mp4", type: "video/mp4"},
			]));
			break;
		case "gfycat.com":
			// gfycats paths are case sensitive, but the urls usually are all lower case
			// however in the media oembed property there is a correctly capitalized path
			if (postData?.media) {
				let capitalizedPath;
				if (/^https?:\/\/thumbs\.gfycat\.com\/./i.test(postData.media.oembed.thumbnail_url)) {
					capitalizedPath = postData.media.oembed.thumbnail_url.match(/^https?:\/\/thumbs\.gfycat\.com\/(\w+)/i)[1];
				} else if (/^https?:\/\/i.embed.ly\/./.test(postData.media.oembed.thumbnail_url)) {
					capitalizedPath = postData.media.oembed.thumbnail_url.match(/thumbs\.gfycat\.com%2F(\w+)/i)[1];
				} else {
					throw `Invalid gfycat oembed link ${postData.media.oembed.thumbnail_url}`;
				}
				videoOut.init(new Ph_SimpleVideo([
					{
						src: `https://giant.gfycat.com/${capitalizedPath}.mp4`,
						type: "video/mp4",
						label: "Default",
						heightHint: postData.media.oembed.height
					},
					{
						src: `https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4`,
						type: "video/mp4",
						label: "Mobile",
						lowerQualityAlternative: true,
						heightHint: postData.media.oembed.height
					},
				]));
			}
			// if no oembed data, use gfycat api
			else {
				getGfycatMp4SrcFromUrl(url)
					.then(sources => videoOut.init(new Ph_SimpleVideo(sources), true))
					.catch(() => videoOut.init(null));
			}
			break;
		case "v.redd.it":
		case "reddit.com":
			if (/\.mp4([?#].*)?$/i.test(url)) {
				defaultCase();
			}
			else {
				const vReddItFallBack = () => {
					videoOut.init(new Ph_VideoAudio([
						{ src: url + "/DASH_1080.mp4", type: "video/mp4" },
						{ src: url + "/DASH_1080", type: "video/mp4" },
						{ src: url + "/DASH_720.mp4", type: "video/mp4", lowerQualityAlternative: true },
						{ src: url + "/DASH_720", type: "video/mp4", lowerQualityAlternative: true },
						{ src: url + "/DASH_480.mp4", type: "video/mp4", lowerQualityAlternative: true },
						{ src: url + "/DASH_480", type: "video/mp4", lowerQualityAlternative: true },
						{ src: url + "/DASH_360.mp4", type: "video/mp4" },
						{ src: url + "/DASH_360", type: "video/mp4" },
						{ src: url + "/DASH_240.mp4", type: "video/mp4" },
						{ src: url + "/DASH_240", type: "video/mp4" },
						{ src: url + "/DASH_96.mp4", type: "video/mp4" },
						{ src: url + "/DASH_96", type: "video/mp4" },
						{ src: url + "/DASH_4_8_M", type: "video/mp4" },
						{ src: url + "/DASH_2_4_M", type: "video/mp4", lowerQualityAlternative: true },
						{ src: url + "/DASH_1_2_M", type: "video/mp4" },
						{ src: url + "/DASH_600_K", type: "video/mp4" },
					], [
						{ src: url + "/DASH_audio.mp4", type: "audio/mp4" },
						{ src: url + "/DASH_audio", type: "audio/mp4" },
						{ src: url + "/audio.mp4", type: "audio/mp4" },
						{ src: url + "/audio", type: "audio/mp4" },
					]), true);
				};

				let dashUrl: string;
				// gets videoId from https://v.redd.it/[videoId] or https://reddit.com/link/[postId]/video/[videoId]
				const vReddItId = url.match(/(https:\/\/v\.redd\.it\/|https?:\/\/(?:www\.)?reddit\.com\/link\/\w+\/video\/)([^/?#]+)|/i)[2];
				const vReddItUrl = `https://v.redd.it/${vReddItId}`;
				const redditVideoData = postData?.media?.reddit_video;
				if (redditVideoData)
					redditVideoData.fallback_url = redditVideoData.fallback_url.replace(/\?.*/, "")
				if (postData && postData.media && redditVideoData)
					dashUrl = redditVideoData.dash_url;
				else
					dashUrl = `${vReddItUrl}/DASHPlaylist.mpd`;

				fetch(dashUrl).then(async r => {
					const hlsXml = (new DOMParser()).parseFromString(await r.text(), "application/xml");

					let videoUrlElements = hlsXml.querySelectorAll(`Representation[id^=video i]`);
					const videoSources = Array.from(videoUrlElements)
						.sort((a, b) => {
							const bandwidthA = parseInt(a.getAttribute("bandwidth"));
							const bandwidthB = parseInt(b.getAttribute("bandwidth"));
							return bandwidthB - bandwidthA;
						})
						.map(rep => ({ path: rep.querySelector("BaseURL").textContent, height: parseInt(rep.getAttribute("height"))}))
						.map(trackData => (<SourceData> {
							src: `${vReddItUrl}/${trackData.path}`,
							type: "video/mp4",
							label: `${trackData.height}p`,
							heightHint: trackData.height,
							lowerQualityAlternative: Math.abs(600 - trackData.height) < 180	// true if approximately 720p or 480p
						}));
					if (redditVideoData) {
						const fallbackSrc = <SourceData> {
							src: redditVideoData.fallback_url,
							type: "video/mp4",
							label: `${redditVideoData.height}p`,
							heightHint: redditVideoData.height,
							lowerQualityAlternative: Math.abs(600 - redditVideoData.height) < 180	// true if approximately 720p or 480p
						};
						if (!isJsonEqual(fallbackSrc, videoSources[0])) {
							videoSources.splice(0, 0, fallbackSrc);
						}
					}
					if (videoSources.length === 0) {
						vReddItFallBack();
						return;
					}

					const audioUrlElement = hlsXml.querySelector(`Representation[id^=audio i] BaseURL`);
					const audioSrc = audioUrlElement
						? [{ src: `${vReddItUrl}/${audioUrlElement.textContent}`, type: "audio/mp4" }]
						: []

					videoOut.init(new Ph_VideoAudio(videoSources, audioSrc), true);
				})
					.catch(() => vReddItFallBack());
			}
			break;
		case "i.redd.it":
			// from i.reddit only gifs come; try to get the mp4 preview
			if (postData && postData.preview && postData.preview.images[0].variants.mp4) {
				videoOut.init(new Ph_SimpleVideo([{
					src: postData.preview.images[0].variants.mp4.source.url,
					type: "video/mp4",
					heightHint: postData.preview.images[0].variants.mp4.source.height,
				}]));
			}
			else
				defaultCase();
			break;
		case "clips.twitch.tv":
			// CURRENTLY NOT WORKING
			// try to get mp4 url from oembed data
			let twitchMp4Found = false;
			if (postData && postData.media && postData.media.oembed) {
				// if present the thumbnail url looks like 	https://clips-media-assets2.twitch.tv/AT-cm|1155435256-social-preview.jpg
				// the mp4 url is 							https://clips-media-assets2.twitch.tv/AT-cm|1155435256.mp4
				const twitchUrlMatches = postData.media.oembed.thumbnail_url.match(/(.*)-social-preview.jpg$/);
				if (twitchUrlMatches && twitchUrlMatches.length == 2) {
					const urlBase = twitchUrlMatches[1].replace(/twitch.tv\/(AT-cm%7C)?/, "twitch.tv/AT-cm%7C")
					videoOut.init(new Ph_SimpleVideo([
						{
							src: `${urlBase}.mp4`,
							type: "video/mp4",
							heightHint: postData.media.oembed.height,
							label: "HD"
						},
						{
							src: `${urlBase}-720.mp4`,
							type: "video/mp4",
							heightHint: postData.media.oembed.height,
							lowerQualityAlternative: true,
							label: "720p"
						},
						{
							src: `${urlBase}-480.mp4`,
							type: "video/mp4",
							heightHint: postData.media.oembed.height,
							lowerQualityAlternative: true,
							label: "480p"
						},
						{
							src: `${urlBase}-360.mp4`,
							type: "video/mp4",
							heightHint: postData.media.oembed.height,
							label: "360p"
						},
					]));
					twitchMp4Found = true;
				}
			}
			// if not suitable oembed data use youtube-dl
			if (!twitchMp4Found) {
				youtubeDlUrl(url).then(async clip => {
					if ("error" in clip || !clip.url) {
						videoOut.init(null);
						return;
					}
					videoOut.init(new Ph_SimpleVideo(
							[{ src: clip.url, type: "video/mp4" }]
						), true
					);
				}).catch(() => videoOut.init(null))
			}
			break;
		case "redgifs.com":
			// like gfycat but there is no usable info in the oembed data
			getRedgifsMp4SrcFromUrl(url)
				.then(sources => videoOut.init(new Ph_SimpleVideo(sources), true))
				.catch(() => videoOut.init(null));
			break;
		case "media.giphy.com":
		case "media1.giphy.com":
		case "media2.giphy.com":
		case "giphy.com":
			const giphyId = url.match(/giphy\.com(\/\w+)?\/(\w+-)*(\w+)/i)[3];		// gfycat.com/<id> or gfycat.com/name-of-gif-<id> or gfycat.com/something/<id> --> <id>
			videoOut.init(new Ph_SimpleVideo([
				{ src: `https://i.giphy.com/media/${giphyId}/giphy.mp4`, 		type: "video/mp4", lowerQualityAlternative: false, label: "Original" },
				{ src: `https://i.giphy.com/media/${giphyId}/giphy-preview.mp4`,type: "video/mp4", lowerQualityAlternative: true,  label: "Preview" },
			]));
			break;
		case "streamable.com":
			getStreamableUrl(url).then(sources => {
				videoOut.init(new Ph_SimpleVideo(sources), true)
			}).catch(() => videoOut.init(null));
			break;
		default:
			// some other .mp4 or .gif file
			defaultCase();
	}

	return videoOut;
}