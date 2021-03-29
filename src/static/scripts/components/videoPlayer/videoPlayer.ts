import { getGfycatMp4SrcFromUrl, GfycatDomain } from "../../api/gfycatApi.js";
import { youtubeDlUrl } from "../../api/photonApi.js";
import { RedditApiType } from "../../types/misc.js";
import { escADQ, escHTML } from "../../utils/htmlStatics.js";
import { classInElementTree, elementWithClassInTree } from "../../utils/htmlStuff.js";
import { secondsToVideoTime } from "../../utils/utils.js";
import Ph_ControlsBar from "../misc/controlsBar/controlsBar.js";
import Ph_DropDown, { DirectionX, DirectionY } from "../misc/dropDown/dropDown.js";
import Ph_DropDownArea from "../misc/dropDown/dropDownArea/dropDownArea.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_ProgressBar from "../misc/progressBar/progressBar.js";
import Ph_SwitchingImage from "../misc/switchableImage/switchableImage.js";
import Ph_Toast, { Level } from "../misc/toast/toast.js";
import Ph_DraggableWrapper from "../post/postBody/draggableWrapper/draggableWrapper.js";

import Ph_GifVideo from "./gifVideo/gifVideo.js";
import Ph_PlayImage from "./icons/playImage.js";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo.js";
import Ph_VideoAudio from "./videoAudio/videoAudio.js";
import Ph_VideoWrapper from "./videoWrapper.js";

/**
 * A custom video player with custom controls
 */
export default class Ph_VideoPlayer extends HTMLElement {
	/** Video playing element */
	video: Ph_VideoWrapper;
	overlayIcon: Ph_SwitchingImage;
	/** video url */
	url: string;
	videoProgressInterval = null;
	controlsDropDown: Ph_DropDown;
	draggableWrapper: Ph_DraggableWrapper;
	resetViewBtn: HTMLButtonElement;

	/** Creates a video player from a reddit post (with a video link) */
	static fromPostData(postData: RedditApiType): Ph_VideoPlayer {
		const videoOut = new Ph_VideoPlayer();
		videoOut.url = postData.data["url"];

		function defaultCase() {
			if (/\.gif(\?.*)?$/.test(postData.data["url"])) {
				videoOut.init(new Ph_GifVideo(postData.data["url"]));
				return;
			}
			else if (/\.mp4(\?.*)?$/.test(postData.data["url"])) {
				videoOut.init(new Ph_SimpleVideo([{src: postData.data["url"], type: "video/mp4"}]));
				return;
			}
			console.error(`Unknown video provider for ${postData.data["url"]}`);
			new Ph_Toast(Level.error, `Unknown video provider for ${escHTML(postData.data["url"])}`);
		}

		// task of this huuuuge switch: get the video file url (.mp4/.gif/...) of this post
		switch (postData.data["url"].match(/^https?:\/\/w?w?w?\.?([\w\.]+)/)[1]) {
			case "imgur.com":
			case "m.imgur.com":
			case "i.imgur.com":
				const typelessUrl = postData.data["url"].match(/^https?:\/\/([im])?\.?imgur\.com\/\w+/)[0];
				videoOut.init(new Ph_SimpleVideo([
					{src: typelessUrl + ".mp4", type: "video/mp4"},
				]));
				break;
			case "gfycat.com":
				// gfycats paths are case sensitive, but the urls usually are all lower case
				// however in the media oembed property there is a correctly capitalized path
				if (postData.data["media"]) {
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
					getGfycatMp4SrcFromUrl(postData.data["url"], GfycatDomain.gfycat)
						.then(mp4Url => videoOut.init(new Ph_SimpleVideo([{ src: mp4Url, type: "video/mp4" }])))
						.catch(() => videoOut.init(null));
				}
				break;
			case "v.redd.it":
				// wtf is this inconsistency v.redd.it ??????!
				// trying to minimize sources list and failed requests
				if (postData.data["media"] && postData.data["media"]["reddit_video"]) {
					const helperUrl = postData.data["media"]["reddit_video"]["fallback_url"];
					const resolutions = [1080, 720, 480, 360, 240, 96];
					if (/DASH_\d+\?source=fallback/.test(helperUrl)) {
						const maxRes = helperUrl.match(/(?<=DASH_)\d+/)[0];
						const resOptions = resolutions.slice(resolutions.indexOf(parseInt(maxRes)));
						videoOut.init(new Ph_VideoAudio(
							resOptions.map(res => ({src: `${postData.data["url"]}/DASH_${res}`, type: "video/mp4"})),
							[
								{src: postData.data["url"] + "/DASH_audio.mp4", type: "video/mp4"},
								{src: postData.data["url"] + "/DASH_audio", type: "video/mp4"},
								{src: postData.data["url"] + "/audio.mp4", type: "video/mp4"},
								{src: postData.data["url"] + "/audio", type: "video/mp4"},
							]
						));
					}
					else if (/DASH_\d+\.mp4\?source=fallback/.test(helperUrl)) {
						const maxRes = helperUrl.match(/(?<=DASH_)\d+/)[0];
						const resOptions = resolutions.slice(resolutions.indexOf(parseInt(maxRes)));
						videoOut.init(new Ph_VideoAudio(
							resOptions.map(res => <any> {src: `${postData.data["url"]}/DASH_${res}.mp4`, type: "video/mp4"}),
							[
								{src: postData.data["url"] + "/DASH_audio.mp4", type: "video/mp4"},
								{src: postData.data["url"] + "/DASH_audio", type: "video/mp4"},
								{src: postData.data["url"] + "/audio.mp4", type: "video/mp4"},
								{src: postData.data["url"] + "/audio", type: "video/mp4"},
							]));
					}
					else if (/DASH_[\d_]+[KM]\.mp4\?source=fallback/.test(helperUrl)) {
						videoOut.init(new Ph_VideoAudio([
							{src: postData.data["url"] + "/DASH_4_8_M.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_2_4_M.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_1_2_M.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_600_K.mp4", type: "video/mp4"},
						], [
							{src: postData.data["url"] + "/DASH_audio.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_audio", type: "video/mp4"},
							{src: postData.data["url"] + "/audio.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/audio", type: "video/mp4"},
						]));
					}
					else if (/DASH_[\d_]+[KM]\?source=fallback/.test(helperUrl)) {
						videoOut.init(new Ph_VideoAudio([
							{src: postData.data["url"] + "/DASH_4_8_M", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_2_4_M", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_1_2_M", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_600_K", type: "video/mp4"},
						], [
							{src: postData.data["url"] + "/DASH_audio.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/DASH_audio", type: "video/mp4"},
							{src: postData.data["url"] + "/audio.mp4", type: "video/mp4"},
							{src: postData.data["url"] + "/audio", type: "video/mp4"},
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
						{src: postData.data["url"] + "/DASH_1080.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_1080", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_720.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_720", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_480.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_480", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_360.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_360", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_240.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_240", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_96.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_96", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_4_8_M", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_2_4_M", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_1_2_M", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_600_K", type: "video/mp4"},
					], [
						{src: postData.data["url"] + "/DASH_audio.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/DASH_audio", type: "video/mp4"},
						{src: postData.data["url"] + "/audio.mp4", type: "video/mp4"},
						{src: postData.data["url"] + "/audio", type: "video/mp4"},
					]));
				}
				break;
			case "i.redd.it":
				// from i.reddit only gifs come; try to get the mp4 preview
				if (postData.data["preview"] && postData.data["preview"]["images"][0]["variants"]["mp4"]) {
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
				if (postData.data["media"] && postData.data["media"]["oembed"]) {
					const twitchUrlMatches = postData.data["media"]["oembed"]["thumbnail_url"].match(/(.*)-social-preview.jpg$/);
					if (twitchUrlMatches && twitchUrlMatches.length == 2) {
						videoOut.init(new Ph_SimpleVideo([{src: twitchUrlMatches[1] + ".mp4", type: "video/mp4"}]));
						twitchMp4Found = true;
					}
				}
				// if not suitable oembed data use youtube-dl
				if (!twitchMp4Found) {
					youtubeDlUrl(postData.data["url"]).then(async clipMp4 => {
						videoOut.init(new Ph_SimpleVideo([{ src: clipMp4, type: "video/mp4" }]));
					}).catch(err => {
						new Ph_Toast(Level.error, "Error getting Twitch clip");
						console.error("Error getting twitch clip url");
						console.error(err);
					});
				}
				break;
			case "redgifs.com":
				// like gfycat but there is no usable info in the oembed data
				getGfycatMp4SrcFromUrl(postData.data["url"], GfycatDomain.redgifs)
					.then(mp4Url => videoOut.init(new Ph_SimpleVideo([ { src: mp4Url, type: "video/mp4" } ])))
					.catch(() => videoOut.init(null));
				break;
			default:
				// some other .mp4 or .gif file
				defaultCase();
		}

		return videoOut;
	}

	constructor(video?: Ph_VideoWrapper) {
		super();

		this.classList.add("videoPlayer");
		this.setAttribute("tabindex", "0");

		this.overlayIcon = new Ph_SwitchingImage([
			{src: "/img/loading.svg", key: "loading"},
			{src: "/img/playVideo.svg", key: "ready"},
			{src: "", key: "none"},
		]);
		this.overlayIcon.classList.add("initialIcon");
		this.appendChild(this.overlayIcon);

		if (video)
			this.init(video);
	}

	init(video: Ph_VideoWrapper) {
		this.video = video;

		if (this.video)
			this.makeControls();
		else
			this.innerText = "No video supplied (maybe video was deleted)";
	}

	makeControls() {
		window.addEventListener("ph-view-change", () => this.video.pause());

		setTimeout(() => {
			elementWithClassInTree(this.parentElement, "post").addEventListener("ph-intersection", (e: CustomEvent) => {
				const entries: IntersectionObserverEntry[] = e.detail;
				if (entries[0].intersectionRatio > .4 && !classInElementTree(this.parentElement, "covered")) {
					this.video.play();
					this.focus({preventScroll: true});
				}
				else {
					this.video.pause();
					this.blur();
				}
			});
		}, 0);

		this.draggableWrapper = new Ph_DraggableWrapper();
		this.video.classList.add("draggable");
		this.draggableWrapper.appendChild(this.video);
		this.appendChild(this.draggableWrapper);

		const controls = new Ph_ControlsBar(true);
		controls.addShowHideListeners(this.video);
		this.appendChild(controls);

		this.video.addEventListener("click", () => this.video.togglePlay());
		this.video.addEventListener("dblclick", () => this.toggleFullscreen());
		this.addEventListener("keydown", e => {
			let actionExecuted = false;
			switch (e.code) {
				case "Space":
				case "KeyP":
				case "KeyK":
					this.video.togglePlay();
					actionExecuted = true;
					break;
				case "ArrowLeft":
				case "KeyJ":
					this.video.seekTo(this.video.getCurrentTime() - 5);
					actionExecuted = true;
					break;
				case "ArrowRight":
				case "KeyL":
					this.video.seekTo(this.video.getCurrentTime() + 5);
					actionExecuted = true;
					break;
				case "ArrowUp":
					this.video.setVolume(this.video.getVolume() + .1);
					actionExecuted = true;
					break;
				case "ArrowDown":
					this.video.setVolume(this.video.getVolume() - .1);
					actionExecuted = true;
					break;
				case "KeyF":
					this.toggleFullscreen();
					actionExecuted = true;
					break;
				case "KeyM":
					this.video.toggleMute();
					actionExecuted = true;
					break;
				case "KeyI":
					this.popoutVideo();
					actionExecuted = true;
					break;
				case "KeyR":
					this.draggableWrapper.setMoveXY(0, 0);
					this.draggableWrapper.setZoom(1);
					actionExecuted = true;
					break;
			}
			if (actionExecuted) {
				e.preventDefault();
				controls.restartHideTimeout();
			}
		});
		this.video.addEventListener("ph-ready", () => {
			this.overlayIcon.showImage("ready");
			timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
		});
		this.video.addEventListener("ph-buffering", () => this.overlayIcon.showImage("loading"));
		this.video.addEventListener("ph-playing", () => this.overlayIcon.showImage("none"));

		// play, pause, progress bar
		const playButton = new Ph_PlayImage();
		controls.appendMorphingImage(playButton);
		playButton.setAttribute("data-tooltip", "Shortcut: Space/P/K");
		playButton.addEventListener("click", () => this.video.togglePlay());
		this.video.addEventListener("ph-play", () => {
			playButton.toPause();
			this.videoProgressInterval = setInterval(() => {
				progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime());
				timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
			}, 100);
		});
		this.video.addEventListener("ph-seek", () => progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime()));
		this.video.addEventListener("ph-pause", () => {
			playButton.toPlay();
			if (this.videoProgressInterval !== null) {
				clearTimeout(this.videoProgressInterval);
				this.videoProgressInterval = null;
			}
		});

		// time text
		const timeText = document.createElement("div");
		controls.appendChild(timeText);
		timeText.innerText = "00:00 / 00:00";

		// volume
		const volumeWrapper = document.createElement("div");
		volumeWrapper.className = "volumeWrapper";
		controls.appendChild(volumeWrapper);
		const muteButton = this.makeImgBtn(new Ph_SwitchingImage([
			{src: "/img/mute.svg", key: "mute"},
			{src: "/img/audio.svg", key: "audio"},
		]), volumeWrapper);
		muteButton.parentElement.setAttribute("data-tooltip", "Shortcut: M");
		muteButton.parentElement.addEventListener("click", () => this.video.toggleMute());
		const volumeSlider = new Ph_ProgressBar(true, 20);
		volumeSlider.setAttribute("data-tooltip", "Shortcut: Arrow Up/Down or Scroll");
		volumeSlider.addEventListener("ph-drag", (e: CustomEvent) => this.video.setVolume(e.detail));
		volumeWrapper.appendChild(volumeSlider);
		this.video.addEventListener("ph-volumechange",
			(e: CustomEvent) => {
				muteButton.showImage(e.detail === 0 ? "mute" : "audio");
				volumeSlider.setProgress(e.detail);
			}
		);
		volumeWrapper.addEventListener("wheel", e => {
			e.preventDefault();
			this.video.setVolume(this.video.getVolume() + ((-e.deltaY || e.deltaX) > 0 ? .05 : -.05));
		}, {passive: false});
		this.video.addEventListener("ph-noaudio", () => {
			volumeWrapper.classList.add("remove");
			setTimeout(() => volumeWrapper.remove(), 1000);
		});

		// left right divider
		controls.appendSpacer();

		// video src
		if (this.url) {
			const srcText = document.createElement("div");
			controls.appendChild(srcText);
			srcText.innerHTML = `<a href="${escADQ(this.url)}" target="_blank" rel="noopener">${escHTML(this.url.match(/([\w.\.]+)\//)[1])}</a>`;
		}

		// reset view
		this.resetViewBtn = controls.appendMakeImageButton("/img/reset.svg");
		this.resetViewBtn.classList.add("hide");
		this.resetViewBtn.setAttribute("data-tooltip", "Shortcut: R");
		this.resetViewBtn.addEventListener("click", () => {
			this.draggableWrapper.setZoom(1);
			this.draggableWrapper.setMoveXY(0, 0);
		});
		controls.appendChild(this.resetViewBtn);

		// settings
		const videoSettingsImg = document.createElement("img");
		videoSettingsImg.src = "/img/settings2.svg";
		videoSettingsImg.draggable = false;
		videoSettingsImg.alt = "settings";
		this.controlsDropDown = new Ph_DropDown([
			{
				displayHTML: "Speed", nestedEntries: [
					{displayHTML: "0.10x", value: 0.10, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "0.25x", value: 0.25, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "0.50x", value: 0.50, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "1.00x", value: 1.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "2.00x", value: 2.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "4.00x", value: 4.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "8.00x", value: 8.00, onSelectCallback: this.setVideoSpeed.bind(this)},
					{displayHTML: "16.00x", value: 16.00, onSelectCallback: this.setVideoSpeed.bind(this)},
				]
			},
			// {
			// 	displayHTML: `<span data-tooltip="Shortcut: I">Popout</span>`,
			// 	onSelectCallback: this.popoutVideo.bind(this)
			// },
		], videoSettingsImg, DirectionX.right, DirectionY.top, false);
		this.controlsDropDown.classList.add("settings");
		this.controlsDropDown.$class("dropDownButton")[0].classList.add("imgBtn");
		controls.appendChild(this.controlsDropDown);
		controls.addEventListener("ph-hidecontrols", () => {
			for (let area of this.controlsDropDown.getElementsByClassName("dropDownArea")) {
				(area as Ph_DropDownArea).closeMenu(true);
			}
		});

		// fullscreen
		const fullscreenButton = this.makeImgBtn(new Ph_SwitchingImage([
			{src: "/img/fullscreen.svg", key: "fullscreen"},
			{src: "/img/minimize.svg", key: "minimize"},
		]), controls);
		fullscreenButton.setAttribute("data-tooltip", "Shortcut: F");
		fullscreenButton.parentElement.addEventListener("click", () => this.toggleFullscreen());
		this.addEventListener("fullscreenchange",
			() => {
				fullscreenButton.showImage(document.fullscreenElement ? "minimize" : "fullscreen");
				if (!document.fullscreenElement)
					this.onExitFullscreen();
			}
		);

		// progress bar
		const progressBar = new Ph_ProgressBar(true);
		controls.appendChild(progressBar);
		progressBar.setAttribute("data-tooltip", "Shortcut: Arrow Left/K, Arrow Right/L, or Scroll");
		progressBar.addEventListener("ph-drag", (e: CustomEvent) => {
			this.video.seekTo(e.detail * this.video.getMaxTime());
		});
		progressBar.addEventListener("wheel", e => {
			e.preventDefault();
			this.video.seekTo(this.video.getCurrentTime() + ((-e.deltaY || e.deltaX) > 0 ? 5 : -5));
		}, {passive: false});
		const timeTextHover = document.createElement("div");
		timeTextHover.className = "timeTextHover";
		controls.appendChild(timeTextHover);
		progressBar.addEventListener("mousemove", e => {
			timeTextHover.innerText = secondsToVideoTime(e.offsetX / progressBar.offsetWidth * this.video.getMaxTime());
			timeTextHover.style.left = `${e.offsetX}px`;
		});
		progressBar.addEventListener("mouseenter", () => {
			timeTextHover.classList.add("show");
		});
		progressBar.addEventListener("mouseleave", () => {
			timeTextHover.classList.remove("show");
		});
	}

	makeImgBtn(img: Ph_SwitchingImage, appendTo: HTMLElement): Ph_SwitchingImage {
		const button = document.createElement("button");
		button.className = "imgBtn";
		button.appendChild(img);
		appendTo.appendChild(button);
		return img;
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

	toggleFullscreen(): boolean {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			this.onExitFullscreen();
			return false;
		}
		else if (this.requestFullscreen) {
			this.requestFullscreen();
			this.onEnterFullscreen();
			return true;
		}
		throw "can't enter fullscreen";
	}

	onEnterFullscreen() {
		this.draggableWrapper.activateWith(this.video);
		this.resetViewBtn.classList.remove("hide");
		this.classList.add("fullscreen");
	}

	onExitFullscreen() {
		this.resetViewBtn.click();
		this.draggableWrapper.deactivate();
		this.resetViewBtn.classList.add("hide");
		this.classList.remove("fullscreen");
	}
}

customElements.define("ph-video-player", Ph_VideoPlayer);
