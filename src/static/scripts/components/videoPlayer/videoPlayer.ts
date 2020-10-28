import { RedditApiType } from "../../utils/types.js";
import Ph_ProgressBar from "../misc/progressBar/progressBar.js";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo.js";
import Ph_VideoAudio from "./videoAudio/videoAudio.js";
import Ph_VideoWrapper from "./videoWrapper.js";

export default class Ph_VideoPlayer extends HTMLElement {
	video: Ph_VideoWrapper;
	hideTimeout = null;
	url: string;
	videoProgressInterval = null;

	constructor(postData: RedditApiType) {
		super();

		this.url = postData.data["url"]; 
		this.classList.add("videoPlayer");
		switch (this.url.match(/^https?:\/\/w?w?w?\.?([\w\.]+)/)[1]) {
			case "imgur.com":
			case "i.imgur.com":
				const typelessUrl = this.url.match(/^https?:\/\/i?\.?imgur\.com\/\w+/)[0];
				this.appendChild(this.video = new Ph_SimpleVideo([
					{ src: typelessUrl + ".mp4", type: "video/mp4" },
				]));
				break;
			case "gfycat.com":
				const capitalizedPath = postData.data["media"]["oembed"]["thumbnail_url"].match(/^https?:\/\/thumbs\.gfycat\.com\/(\w+)/)[1];
				this.appendChild(this.video = new Ph_SimpleVideo([
					{ src: `https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4`, type: "video/mp4" },
					{ src: `https://giant.gfycat.com/${capitalizedPath}.webm`, type: "video/webm" },
					{ src: `https://giant.gfycat.com/${capitalizedPath}.mp4`, type: "video/mp4" },
					{ src: `https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4`, type: "video/mp4" },
				]));
				break;
			case "v.redd.it":
				const videoUrl = postData.data["url"] + "/DASH_720.mp4";
				const audioUrl = postData.data["url"] + "/DASH_audio.mp4";
				this.appendChild(this.video = new Ph_VideoAudio([
					{ src: postData.data["url"] + "/DASH_720.mp4", type: "video/mp4" },
					{ src: postData.data["url"] + "/DASH_480.mp4", type: "video/mp4" },
					{ src: postData.data["url"] + "/DASH_360.mp4", type: "video/mp4" },
					{ src: postData.data["url"] + "/DASH_240.mp4", type: "video/mp4" },
					{ src: postData.data["url"] + "/DASH_96.mp4", type: "video/mp4" },
				], audioUrl));
				break;
			case "clips.twitch.tv":
				const twitchUrl = postData.data["media"]["oembed"]["thumbnail_url"].match(/(.*)-social-preview.jpg$/)[1];
				this.appendChild(this. video = new Ph_SimpleVideo([{ src: twitchUrl + ".mp4", type: "video/mp4" }]));
				break;
			case "redgifs.com":
				const iframeUrl = this.url.replace(/\/watch\//, "/ifr/");
				fetch(`/getIframeSrc?url=${encodeURIComponent(iframeUrl)}`).then(res => res.json().then(src => {
					this.appendChild(this.video = new Ph_SimpleVideo(null, src["src"]));
					this.makeControls();
				}));
				break;
			default:
				this.innerText = `Unknown video provider for ${postData.data["url"]}`;
				break;
		}

		if (this.video)
			this.makeControls();
	}

	makeControls() {
		window.addEventListener("viewChange", () => this.video.pause());

		const controls = document.createElement("div");
		this.appendChild(controls);
		controls.className = "controls";
		this.classList.add("controlsVisible");

		this.video.addEventListener("mouseenter", this.showControls.bind(this));
		this.video.addEventListener("mousemove", this.restartHideTimeout.bind(this));
		controls.addEventListener("mouseenter", this.clearHideTimeout.bind(this))
		controls.addEventListener("mouseleave", e => this.video.contains(e.relatedTarget as HTMLElement) || this.restartHideTimeout());
		this.video.addEventListener("click", () => this.video.togglePlay());
		this.video.addEventListener("dblclick", () => this.toggleFullscreen());

		// play, pause, progress bar
		const { btn: playButton, img: playBtnImg } = this.makeImgBtn("/img/playVideo.svg", controls);
		playButton.addEventListener("click", () => this.video.togglePlay());
		this.video.addEventListener("ph-play", () => {
			playBtnImg.src = "/img/pause.svg";
			this.videoProgressInterval = setInterval(() => {
				progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime());
			}, 100);
		});
		this.video.addEventListener("ph-seek", () => progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime()));
		this.video.addEventListener("ph-pause", () => {
			playBtnImg.src = "/img/playVideo.svg";
			if (this.videoProgressInterval !== null) {
				clearTimeout(this.videoProgressInterval)
				this.videoProgressInterval = null;
			}
		});

		// volume
		const volumeWrapper = document.createElement("div");
		volumeWrapper.className = "volumeWrapper";
		controls.appendChild(volumeWrapper);
		const { btn: muteButton, img: muteButtonImg } = this.makeImgBtn("/img/audio.svg", volumeWrapper);
		muteButton.addEventListener("click", () => this.video.toggleMute());
		const volumeSlider = new Ph_ProgressBar(true, 20);
		volumeSlider.addEventListener("ph-drag", (e: CustomEvent) => this.video.setVolume(e.detail));
		volumeWrapper.appendChild(volumeSlider);
		this.video.addEventListener("ph-volumechange",
			(e: CustomEvent) => {
				e.detail === 0 ?
					muteButtonImg.src = "/img/mute.svg":
					muteButtonImg.src = "/img/audio.svg";
				volumeSlider.setProgress(e.detail);
			}
		)

		// fullscreen
		const { btn: fullscreenButton, img: fullscreenButtonImg} = this.makeImgBtn("/img/fullscreen.svg", controls);
		fullscreenButton.classList.add("mla");
		fullscreenButton.addEventListener("click", () => this.toggleFullscreen())
		this.addEventListener("fullscreenchange",
			() => document.fullscreenElement ?
			fullscreenButtonImg.src = "/img/minimize.svg" :
			fullscreenButtonImg.src = "/img/fullscreen.svg"
		)

		// progress bar
		const progressBar = new Ph_ProgressBar(true);
		controls.appendChild(progressBar);
		progressBar.addEventListener("ph-drag", (e: CustomEvent) => {
			this.video.seekTo(e.detail * this.video.getMaxTime());
		});
	}

	makeImgBtn(defaultSrc: string, appendTo: HTMLElement): { btn: HTMLButtonElement, img: HTMLImageElement } {
		const button = document.createElement("button");
		button.className = "imgBtn";
		const btnImg = document.createElement("img");
		btnImg.draggable = false;
		btnImg.src = defaultSrc;
		button.appendChild(btnImg);
		appendTo.appendChild(button);
		return { btn: button, img: btnImg };
	}

	showControls() {
		this.classList.add("controlsVisible");

		this.hideTimeout = setTimeout(() => this.hideControls(), 2000);
	}

	restartHideTimeout() {
		if (!this.classList.contains("controlsVisible")) {
			this.clearHideTimeout();
			this.showControls();
			return;
		}

		this.clearHideTimeout();

		this.hideTimeout = setTimeout(() => this.hideControls(), 2000);
	}

	clearHideTimeout() {
		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	hideControls() {
		this.classList.remove("controlsVisible");
		
		this.clearHideTimeout();
	}

	toggleFullscreen(): boolean {
		this.classList.toggle("fullscreen");
		if (document.fullscreenElement) {
			document.exitFullscreen();
			return false;
		}
		else if (this.requestFullscreen) {
			this.requestFullscreen();
			return  true
		}
		throw "can't enter fullscreen";
	}
}

customElements.define("ph-video-player", Ph_VideoPlayer);
