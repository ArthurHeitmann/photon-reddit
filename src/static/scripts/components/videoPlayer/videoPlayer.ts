import { secondsToVideoTime } from "../../utils/conv.js";
import { RedditApiType } from "../../utils/types.js";
import Ph_DropDown, {DirectionX, DirectionY} from "../misc/dropDown/dropDown.js";
import Ph_DropDownArea from "../misc/dropDown/dropDownArea/dropDownArea.js";
import Ph_DropDownEntry from "../misc/dropDown/dropDownEntry/dropDownEntry.js";
import Ph_ProgressBar from "../misc/progressBar/progressBar.js";
import Ph_SimpleVideo from "./simpleVideo/simpleVideo.js";
import Ph_VideoAudio from "./videoAudio/videoAudio.js";
import Ph_VideoWrapper from "./videoWrapper.js";

export default class Ph_VideoPlayer extends HTMLElement {
	postData: RedditApiType;
	video: Ph_VideoWrapper;
	hideTimeout = null;
	url: string;
	videoProgressInterval = null;
	controlsDropDown: Ph_DropDown;

	constructor(postData: RedditApiType) {
		super();

		this.postData = postData;
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
				timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
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

		// time text
		const timeText = document.createElement("div");
		controls.appendChild(timeText);
		timeText.innerText = "00:00 / 00:00";

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
		this.video.addEventListener("ph-noaudio", () => volumeWrapper.classList.add("remove"));

		// left right divider
		const divider = document.createElement("div");
		divider.className = "mla";
		controls.appendChild(divider);

		// video src
		const srcText = document.createElement("div");
		controls.appendChild(srcText);
		srcText.innerHTML = `<a href="${this.url}" target="_blank">${this.url.match(/([\w.\.]+)\//)[1]}</a>`;

		// settings
		this.controlsDropDown = new Ph_DropDown([
			{ displayHTML: "Speed", nestedEntries: [
					{ displayHTML: "0.10x", value: 0.10, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "0.25x", value: 0.25, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "0.50x", value: 0.50, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "1.00x", value: 1.00, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "2.00x", value: 2.00, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "4.00x", value: 4.00, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "8.00x", value: 8.00, onSelectCallback: this.setVideoSpeed.bind(this) },
					{ displayHTML: "16.00x", value: 16.00, onSelectCallback: this.setVideoSpeed.bind(this) },
				] },
			{ displayHTML: "Popout", onSelectCallback: this.popoutVideo.bind(this) },
		], `<img src="/img/settings2.svg">`, DirectionX.right, DirectionY.top, false);
		this.controlsDropDown.classList.add("settings");
		controls.appendChild(this.controlsDropDown);

		// fullscreen
		const { btn: fullscreenButton, img: fullscreenButtonImg} = this.makeImgBtn("/img/fullscreen.svg", controls);
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

	setVideoSpeed(valueChain: any[], source: Ph_DropDownEntry) {
		this.video.setPlaybackSpeed(valueChain[1]);
	}

	popoutVideo() {
		window.open(
			`/mediaViewer.html?url=${encodeURIComponent(this.postData.data["permalink"])}`,
			"_blank",
			`location=no,status=no,menubar=no,width=${this.video.getDimensions()[0]},height=${this.video.getDimensions()[1]}`
		);
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

		for (let area of this.controlsDropDown.getElementsByClassName("dropDownArea")) {
			(area as Ph_DropDownArea).closeMenu(true);
		}

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
