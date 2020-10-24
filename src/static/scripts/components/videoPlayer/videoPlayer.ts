import { RedditApiType } from "../../utils/types.js";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo.js";
import Ph_VideoAudio from "./videoAudio/videoAudio.js";
import Ph_VideoWrapper from "./videoWrapper.js";

export default class Ph_VideoPlayer extends HTMLElement {
	video: Ph_VideoWrapper;
	hideTimeout = null;
	url: string;

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
		this.video.addEventListener("mouseleave", e => controls.contains(e.relatedTarget as HTMLElement) || this.hideControls());
		controls.addEventListener("mouseenter", this.clearHideTimeout.bind(this))
		controls.addEventListener("mouseleave", e => this.video.contains(e.relatedTarget as HTMLElement) || this.hideControls());
		this.video.addEventListener("click", () => this.video.togglePlay());
		this.video.addEventListener("dblclick", () => this.video.toggleFullscreen());

		const playButton = document.createElement("button");
		controls.appendChild(playButton);
		playButton.innerText = ">";
		playButton.addEventListener("click", () => this.video.togglePlay());

		const progressBarWrapper = document.createElement("div");
		controls.appendChild(progressBarWrapper);
		progressBarWrapper.className = "progressBar";
		const progressBar = document.createElement("div");
		progressBarWrapper.appendChild(progressBar);

		this.video.setTimeUpdateCallback(() => {
			progressBarWrapper.style.setProperty("--progress", (this.video.getCurrentTime() / this.video.getMaxTime()).toString());
		});
		progressBarWrapper.addEventListener("click", (e: MouseEvent) => {
			this.video.seekTo(e.offsetX / progressBarWrapper.offsetWidth * this.video.getMaxTime());
		});

		const muteButton = document.createElement("button");
		controls.appendChild(muteButton);
		muteButton.innerText = "M";
		muteButton.addEventListener("click", () => this.video.toggleMute());

		const fullscreenButton = document.createElement("button");
		controls.appendChild(fullscreenButton);
		fullscreenButton.innerHTML = "[&nbsp;&nbsp;&nbsp;]";
		fullscreenButton.addEventListener("click", () => this.video.toggleFullscreen());
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
}

customElements.define("ph-video-player", Ph_VideoPlayer);
