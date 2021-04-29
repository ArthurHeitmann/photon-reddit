import { getGfycatMp4SrcFromUrl, GfycatDomain } from "../../../api/gfycatApi.js";
import { trackMediaHost, youtubeDlUrl } from "../../../api/photonApi.js";
import { RedditApiType } from "../../../types/misc.js";
import { $tagAr, escHTML } from "../../../utils/htmlStatics.js";
import { classInElementTree } from "../../../utils/htmlStuff.js";
import { secondsToVideoTime } from "../../../utils/utils.js";
import { globalSettings } from "../../global/photonSettings/photonSettings.js";
import Ph_ControlsBar, { ControlsLayoutSlots } from "../../misc/controlsBar/controlsBar.js";
import Ph_ProgressBar from "../../misc/progressBar/progressBar.js";
import Ph_SwitchingImage from "../../misc/switchableImage/switchableImage.js";
import Ph_Toast, { Level } from "../../misc/toast/toast.js";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement.js";
import { MediaElement } from "../mediaElement.js";
import Ph_GifVideo from "./gifVideo/gifVideo.js";
import Ph_PlayImage from "./icons/playImage.js";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo.js";
import Ph_VideoAudio from "./videoAudio/videoAudio.js";
import Ph_VideoWrapper from "./videoWrapper.js";

/**
 * A custom video player with custom controls
 */
export default class Ph_VideoPlayer extends Ph_PhotonBaseElement implements MediaElement {
	caption: string;
	controls: ControlsLayoutSlots;
	element: HTMLElement;
	url: string;
	/** Video playing element */
	video: Ph_VideoWrapper;
	overlayIcon: Ph_SwitchingImage;
	videoProgressInterval = null;
	static globalVolume: number = 0.5;
	static globalIsMuted: boolean = true;
	static isVideoPlayAllowed = false;

	/** Creates a video player from a reddit post (with a video link) */
	static fromPostData({ postData, url }: { postData?: RedditApiType, url?: string }): Ph_VideoPlayer {
		if (!(postData || url))
			throw "either postData or url is needed";
		if (postData)
			url = postData.data["url"];

		const videoOut = new Ph_VideoPlayer(url);

		function defaultCase() {
			if (/\.gif(\?.*)?$/.test(url)) {
				videoOut.init(new Ph_GifVideo(url));
				return;
			}
			else if (/\.mp4(\?.*)?$/.test(url)) {
				videoOut.init(new Ph_SimpleVideo([{src: url, type: "video/mp4"}]));
				return;
			}
			console.error(`Unknown video provider for ${url}`);
			new Ph_Toast(Level.error, `Unknown video provider for ${escHTML(url)}`);
		}

		// task of this huuuuge switch: get the video file url (.mp4/.gif/...) of this post
		switch (url.match(/^https?:\/\/w?w?w?\.?([\w.]+)/)[1]) {
			case "imgur.com":
			case "m.imgur.com":
			case "i.imgur.com":
				const typelessUrl = url.match(/^https?:\/\/([im])?\.?imgur\.com\/\w+/)[0];		// removes file ending usually all .gif or .gifv have an .mp4
				videoOut.init(new Ph_SimpleVideo([
					{src: typelessUrl + ".mp4", type: "video/mp4"},
				]));
				break;
			case "gfycat.com":
				// gfycats paths are case sensitive, but the urls usually are all lower case
				// however in the media oembed property there is a correctly capitalized path
				if (postData && postData.data["media"]) {
					let capitalizedPath;
					if (/^https?:\/\/thumbs\.gfycat\.com\/./.test(postData.data["media"]["oembed"]["thumbnail_url"])) {
						capitalizedPath = postData.data["media"]["oembed"]["thumbnail_url"].match(/^https?:\/\/thumbs\.gfycat\.com\/(\w+)/)[1];
					} else if (/^https?:\/\/i.embed.ly\/./.test(postData.data["media"]["oembed"]["thumbnail_url"])) {
						capitalizedPath = postData.data["media"]["oembed"]["thumbnail_url"].match(/thumbs\.gfycat\.com%2F(\w+)/)[1];
					} else {
						throw `Invalid gfycat oembed link ${postData.data["media"]["oembed"]["thumbnail_url"]}`;
					}
					videoOut.init(new Ph_SimpleVideo([
						{src: `https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4`, type: "video/mp4"},
						{src: `https://giant.gfycat.com/${capitalizedPath}.webm`, type: "video/webm"},
						{src: `https://giant.gfycat.com/${capitalizedPath}.mp4`, type: "video/mp4"},
						{src: `https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4`, type: "video/mp4"},
					]));
				}
				// if no oembed data, use gfycat api
				else {
					getGfycatMp4SrcFromUrl(url, GfycatDomain.gfycat)
						.then(mp4Url => videoOut.init(new Ph_SimpleVideo([{ src: mp4Url, type: "video/mp4" }]), true))
						.catch(() => videoOut.init(null));
				}
				break;
			case "v.redd.it":
				// wtf is this inconsistency v.redd.it ??????!
				// trying to minimize sources list and failed requests
				if (postData && postData.data["media"] && postData.data["media"]["reddit_video"]) {
					const helperUrl = postData.data["media"]["reddit_video"]["fallback_url"];
					const resolutions = [1080, 720, 480, 360, 240, 96];
					if (/DASH_\d+\?source=fallback/.test(helperUrl)) {		// DASH_<res>?source=fallback
						const maxRes = helperUrl.match(/(?<=DASH_)\d+/)[0];
						const resOptions = resolutions.slice(resolutions.indexOf(parseInt(maxRes)));
						videoOut.init(new Ph_VideoAudio(
							resOptions.map(res => ({src: `${url}/DASH_${res}`, type: "video/mp4"})),
							[
								{src: url + "/DASH_audio.mp4", type: "video/mp4"},
								{src: url + "/DASH_audio", type: "video/mp4"},
								{src: url + "/audio.mp4", type: "video/mp4"},
								{src: url + "/audio", type: "video/mp4"},
							]
						));
					}
					else if (/DASH_\d+\.mp4\?source=fallback/.test(helperUrl)) {		// DASH_<res>.mp4?source=fallback
						const maxRes = helperUrl.match(/(?<=DASH_)\d+/)[0];
						const resOptions = resolutions.slice(resolutions.indexOf(parseInt(maxRes)));
						videoOut.init(new Ph_VideoAudio(
							resOptions.map(res => <any> {src: `${url}/DASH_${res}.mp4`, type: "video/mp4"}),
							[
								{src: url + "/DASH_audio.mp4", type: "video/mp4"},
								{src: url + "/DASH_audio", type: "video/mp4"},
								{src: url + "/audio.mp4", type: "video/mp4"},
								{src: url + "/audio", type: "video/mp4"},
							]));
					}
					else if (/DASH_[\d_]+[KM]\.mp4\?source=fallback/.test(helperUrl)) {		// DASH_<bits>.mp4?source=fallback
						videoOut.init(new Ph_VideoAudio([
							{src: url + "/DASH_4_8_M.mp4", type: "video/mp4"},
							{src: url + "/DASH_2_4_M.mp4", type: "video/mp4"},
							{src: url + "/DASH_1_2_M.mp4", type: "video/mp4"},
							{src: url + "/DASH_600_K.mp4", type: "video/mp4"},
						], [
							{src: url + "/DASH_audio.mp4", type: "video/mp4"},
							{src: url + "/DASH_audio", type: "video/mp4"},
							{src: url + "/audio.mp4", type: "video/mp4"},
							{src: url + "/audio", type: "video/mp4"},
						]));
					}
					else if (/DASH_[\d_]+[KM]\?source=fallback/.test(helperUrl)) {		// DASH_<bits>?source=fallback
						videoOut.init(new Ph_VideoAudio([
							{src: url + "/DASH_4_8_M", type: "video/mp4"},
							{src: url + "/DASH_2_4_M", type: "video/mp4"},
							{src: url + "/DASH_1_2_M", type: "video/mp4"},
							{src: url + "/DASH_600_K", type: "video/mp4"},
						], [
							{src: url + "/DASH_audio.mp4", type: "video/mp4"},
							{src: url + "/DASH_audio", type: "video/mp4"},
							{src: url + "/audio.mp4", type: "video/mp4"},
							{src: url + "/audio", type: "video/mp4"},
						]));
					}
					else {
						new Ph_Toast(Level.error, "A wild new v.redd.it standard has appeared!");
						console.error(`A wild new v.redd.it standard has appeared! ${helperUrl}`);
						throw "A wild new v.redd.it standard has appeared!";
					}
				}
				else {
					// when everything fails: bruteforce
					videoOut.init(new Ph_VideoAudio([
						{src: url + "/DASH_1080.mp4", type: "video/mp4"},
						{src: url + "/DASH_1080", type: "video/mp4"},
						{src: url + "/DASH_720.mp4", type: "video/mp4"},
						{src: url + "/DASH_720", type: "video/mp4"},
						{src: url + "/DASH_480.mp4", type: "video/mp4"},
						{src: url + "/DASH_480", type: "video/mp4"},
						{src: url + "/DASH_360.mp4", type: "video/mp4"},
						{src: url + "/DASH_360", type: "video/mp4"},
						{src: url + "/DASH_240.mp4", type: "video/mp4"},
						{src: url + "/DASH_240", type: "video/mp4"},
						{src: url + "/DASH_96.mp4", type: "video/mp4"},
						{src: url + "/DASH_96", type: "video/mp4"},
						{src: url + "/DASH_4_8_M", type: "video/mp4"},
						{src: url + "/DASH_2_4_M", type: "video/mp4"},
						{src: url + "/DASH_1_2_M", type: "video/mp4"},
						{src: url + "/DASH_600_K", type: "video/mp4"},
					], [
						{src: url + "/DASH_audio.mp4", type: "video/mp4"},
						{src: url + "/DASH_audio", type: "video/mp4"},
						{src: url + "/audio.mp4", type: "video/mp4"},
						{src: url + "/audio", type: "video/mp4"},
					]));
				}
				break;
			case "i.redd.it":
				// from i.reddit only gifs come; try to get the mp4 preview
				if (postData && postData.data["preview"] && postData.data["preview"]["images"][0]["variants"]["mp4"]) {
					videoOut.init(new Ph_SimpleVideo([{
						src: postData.data["preview"]["images"][0]["variants"]["mp4"]["source"]["url"],
						type: "video/mp4"
					}]));
				}
				else
					defaultCase();
				break;
			case "clips.twitch.tv":
				// try to get mp4 url from oembed data
				let twitchMp4Found = false;
				if (postData && postData.data["media"] && postData.data["media"]["oembed"]) {
					// if present the thumbnail url looks like 	https://clips-media-assets2.twitch.tv/AT-cm|1155435256-social-preview.jpg
					// the mp4 url is 							https://clips-media-assets2.twitch.tv/AT-cm|1155435256.mp4
					const twitchUrlMatches = postData.data["media"]["oembed"]["thumbnail_url"].match(/(.*)-social-preview.jpg$/);
					if (twitchUrlMatches && twitchUrlMatches.length == 2) {
						videoOut.init(new Ph_SimpleVideo([{src: twitchUrlMatches[1] + ".mp4", type: "video/mp4"}]));
						twitchMp4Found = true;
					}
				}
				// if not suitable oembed data use youtube-dl
				if (!twitchMp4Found) {
					youtubeDlUrl(url).then(async clipMp4 => {
						videoOut.init(new Ph_SimpleVideo(
							clipMp4 ? [{ src: clipMp4, type: "video/mp4" }] : []
							), true
						);
					}).catch(err => {
						new Ph_Toast(Level.error, "Error getting Twitch clip");
						console.error("Error getting twitch clip url");
						console.error(err);
					});
				}
				break;
			case "redgifs.com":
				// like gfycat but there is no usable info in the oembed data
				getGfycatMp4SrcFromUrl(url, GfycatDomain.redgifs)
					.then(mp4Url => videoOut.init(new Ph_SimpleVideo([ { src: mp4Url, type: "video/mp4" } ]), true))
					.catch(() => videoOut.init(null));
				break;
			case "media2.giphy.com":
			case "giphy.com":
				const giphyId = url.match(/(?<=giphy\.com\/\w+\/)\w+/)[0];		// gfycat.com/<id> or gfycat.com/something/<id> --> <id>
				const giphyMp4 = `https://i.giphy.com/media/${giphyId}/giphy.mp4`;
				videoOut.init(new Ph_SimpleVideo([{ src: giphyMp4, type: "video/mp4" }]));
				break;
			default:
				// some other .mp4 or .gif file
				defaultCase();
		}

		return videoOut;
	}

	constructor(url: string) {
		super();

		this.classList.add("videoPlayer");
		this.url = url;
		this.element = this;
		this.controls = {
			firstLeftItems: [],
			leftItems: [],
			rightItems: [],
		};

		this.overlayIcon = new Ph_SwitchingImage([
			{src: "/img/loading.svg", key: "loading"},
			{src: "/img/playVideo.svg", key: "ready"},
			{src: "", key: "none"},
		]);
		this.overlayIcon.classList.add("initialIcon");
		this.appendChild(this.overlayIcon);
	}

	init(video: Ph_VideoWrapper, isLateInit = false) {
		this.video = video;

		if (this.video) {
			this.appendChild(this.video);
			this.fullInit();
			this.video.setVolume(Ph_VideoPlayer.globalVolume);
			this.video.setIsMuted(Ph_VideoPlayer.globalIsMuted);
			if (isLateInit)
				this.dispatchEvent(new Event("ph-controls-changed"));
		}
		else
			this.innerText = "No video supplied (maybe video was deleted)";
	}

	fullInit() {
		// video autoplay
		const intersectionObserver = new IntersectionObserver(
			entries => {
				if (!Ph_VideoPlayer.isVideoPlayAllowed)
					return;
				if (
					globalSettings.autoplayVideos &&
					entries[0].intersectionRatio > .4 &&
					Boolean(document.fullscreenElement) === (document.fullscreenElement === this) &&
					!classInElementTree(this.parentElement, "covered")
				) {
					this.video.play();
				}
				else {
					this.video.pause();
				}
			},
			{
				threshold: .4,
			}
		);
		intersectionObserver.observe(this);

		this.addWindowEventListener("ph-view-change", () => this.video.pause());
		this.video.addEventListener("click", this.togglePlay.bind(this));
		this.video.addEventListener("ph-ready", () => {
			this.overlayIcon.showImage("ready");
			timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
		});
		this.video.addEventListener("ph-buffering", () => this.overlayIcon.showImage("loading"));
		this.video.addEventListener("ph-playing", () => this.overlayIcon.showImage("none"));

		// play, pause, progress bar
		const playButton = new Ph_PlayImage(true);
		this.controls.firstLeftItems.push(playButton);
		playButton.addEventListener("click", () => this.togglePlay());
		this.video.addEventListener("ph-play", () => {
			playButton.toPause();
			this.videoProgressInterval = setInterval(() => {
				this.controls.progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime());
				timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
			}, 100);
		});
		this.video.addEventListener("ph-seek",
			() => this.controls.progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime()));
		this.video.addEventListener("ph-pause", () => {
			playButton.toPlay();
			if (this.videoProgressInterval !== null) {
				clearTimeout(this.videoProgressInterval);
				this.videoProgressInterval = null;
			}
		});

		// time text
		const timeText = document.createElement("div");
		timeText.className = "textOnly";
		this.controls.leftItems.push(timeText);
		timeText.innerText = "00:00 / 00:00";

		// volume
		const volumeWrapper = document.createElement("div");
		volumeWrapper.className = "volumeWrapper";
		this.controls.leftItems.push(volumeWrapper);
		const { b: muteButton, img: muteImg } = Ph_ControlsBar.makeSwitchingImageBtn(new Ph_SwitchingImage([
			{ src: "/img/mute.svg", key: "mute" },
			{ src: "/img/audio.svg", key: "audio" },
		]));
		volumeWrapper.appendChild(muteButton);
		muteButton.addEventListener("click", () => this.toggleMuted());
		const volumeSlider = new Ph_ProgressBar(true, 20);
		volumeSlider.addEventListener("ph-drag", (e: CustomEvent) => this.setVolume(e.detail));
		volumeWrapper.appendChild(volumeSlider);
		this.video.addEventListener("ph-volume-change",
			(e: CustomEvent) => {
				muteImg.showImage(e.detail === 0 ? "mute" : "audio");
				volumeSlider.setProgress(e.detail);
			}
		);
		volumeWrapper.addEventListener("wheel", e => {
			e.preventDefault();
			this.setVolume(this.video.getVolume() + ((-e.deltaY || e.deltaX) > 0 ? .05 : -.05));
		}, {passive: false});
		this.video.addEventListener("ph-no-audio", () => {
			volumeWrapper.classList.add("remove");
			setTimeout(() => volumeWrapper.remove(), 1000);
		});

		// settings
		this.controls.settingsEntries = [
			{
				label: "Speed", nestedEntries: [
					{label: "0.10x", value: 0.10, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "0.25x", value: 0.25, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "0.50x", value: 0.50, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "1.00x", value: 1.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "2.00x", value: 2.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "4.00x", value: 4.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "8.00x", value: 8.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{label: "16.00x", value: 16.00, onSelectCallback: this.setVideoSpeed.bind(this)},
				]
			},
			// {
			// 	label: `<span>Popout</span>`,
			// 	onSelectCallback: this.popoutVideo.bind(this)
			// },
		];

		// progress bar
		this.controls.progressBar = new Ph_ProgressBar(true);
		this.controls.progressBar.addEventListener("ph-drag", (e: CustomEvent) => {
			this.video.seekTo(e.detail * this.video.getMaxTime());
		});
		this.controls.progressBar.addEventListener("wheel", e => {
			e.preventDefault();
			this.video.seekTo(this.video.getCurrentTime() + ((-e.deltaY || e.deltaX) > 0 ? 5 : -5));
		}, {passive: false});
		const timeTextHover = document.createElement("div");
		timeTextHover.className = "timeTextHover";
		this.controls.progressBar.appendChild(timeTextHover);
		this.controls.progressBar.addEventListener("mousemove", e => {
			timeTextHover.innerText = secondsToVideoTime(e.offsetX / this.controls.progressBar.offsetWidth * this.video.getMaxTime());
			timeTextHover.style.left = `${e.offsetX}px`;
		});
		this.controls.progressBar.addEventListener("mouseenter",
			() => timeTextHover.classList.add("show"));
		this.controls.progressBar.addEventListener("mouseleave",
			() => timeTextHover.classList.remove("show"));
	}

	onKeyDownEvent(e: KeyboardEvent) {
		switch (e.code) {
			case "Space":
			case "KeyP":
			case "KeyK":
				this.togglePlay();
				break;
			case "ArrowLeft":
			case "KeyJ":
				if (!(e.ctrlKey || e.shiftKey))
					this.video.seekTo(this.video.getCurrentTime() - 5);
				break;
			case "ArrowRight":
			case "KeyL":
				if (!(e.ctrlKey || e.shiftKey))
					this.video.seekTo(this.video.getCurrentTime() + 5);
				break;
			case "ArrowUp":
				this.setVolume(this.video.getVolume() + .1);
				break;
			case "ArrowDown":
				this.setVolume(this.video.getVolume() - .1);
				break;
			case "KeyM":
				this.toggleMuted();
				break;
			// case "KeyI":
			// 	this.popoutVideo();
			// 	break;
		}
	}

	setVideoSpeed(valueChain: any[]) {
		this.video.setPlaybackSpeed(valueChain[1]);
	}

	popoutVideo() {
		// window.open(
		// 	`/mediaViewer.html?url=${encodeURIComponent(this.postData.data["permalink"])}`,
		// 	"_blank",
		// 	`location=no,status=no,menubar=no,width=${this.video.getDimensions()[0]},height=${this.video.getDimensions()[1]}`
		// );
	}

	togglePlay(e?: Event) {
		e?.stopImmediatePropagation();
		e?.stopPropagation();
		this.video.togglePlay();
		Ph_VideoPlayer.isVideoPlayAllowed = true;
	}

	setVolume(newVolume: number, broadcastChange = true) {
		this.video.setVolume(newVolume);
		if (!broadcastChange || !globalSettings.globalVideoVolume)
			return;
		Ph_VideoPlayer.globalVolume = newVolume;
		Ph_VideoPlayer.globalIsMuted = newVolume === 0;
		$tagAr("ph-video-player").forEach((player: Ph_VideoPlayer) => player.setVolume(newVolume, false));
	}

	toggleMuted(broadcastChange = true, newIsMuted: boolean = null) {
		if (!broadcastChange) {
			this.video.setIsMuted(newIsMuted);
			return;
		}
		const newMuted = this.video.toggleMute();
		if (!globalSettings.globalVideoVolume)
			return;
		Ph_VideoPlayer.globalIsMuted = newMuted;
		$tagAr("ph-video-player").forEach((player: Ph_VideoPlayer) => player.toggleMuted(false, newMuted));
	}
}

customElements.define("ph-video-player", Ph_VideoPlayer);
