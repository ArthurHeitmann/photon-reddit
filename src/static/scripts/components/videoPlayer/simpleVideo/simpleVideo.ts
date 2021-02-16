import { escADQ } from "../../../utils/htmlStatics.js";
import { allUrlsWithHttps, clamp, urlWithHttps } from "../../../utils/utils.js";
import Ph_VideoWrapper from "../videoWrapper.js";

export default class Ph_SimpleVideo extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	lastNon0Volume: number;
	noAudioProgressCallback: () => void;

	constructor(sourcesArray?: { src: string, type: string }[], sourcesHtml?: string[]) {
		super();

		if (sourcesArray)
			sourcesArray.forEach(src => src.src = urlWithHttps(src.src));
		if (sourcesHtml) {
			for (let i = 0; i < sourcesHtml.length; i++) {
				sourcesHtml[i] = allUrlsWithHttps(sourcesHtml[i]);
			}
		}

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		this.appendChild(this.video);
		if (sourcesArray) {
			for (const source of sourcesArray)
				this.video.insertAdjacentHTML("beforeend", `<source src="${escADQ(source.src)}" type="${escADQ(source.type)}">`);
		}
		else if (sourcesHtml) {
			for (const source of sourcesHtml)
				this.video.insertAdjacentHTML("beforeend", source);
		}
		else
			throw "Invalid video sources"

		this.lastNon0Volume = this.video.volume;
		this.video.muted = true;

		// this mess is needed in order to know if the video has audio
		this.video.addEventListener("timeupdate", this.noAudioProgressCallback = () => {
			if (this.video.currentTime > 0) {
				this.video.removeEventListener("timeupdate", this.noAudioProgressCallback);
				this.noAudioProgressCallback = undefined;
				if (this.video["webkitAudioDecodedByteCount"] === 0 || this.video["mozHasAudio"] === false || this.video["audioTracks"] && this.video["audioTracks"]["length"] === 0)
					this.dispatchEvent(new Event("ph-noaudio"));
			}
		});


		this.video.addEventListener("loadeddata", () => this.dispatchEvent(new Event("ph-ready")));
		this.video.addEventListener("waiting", () => this.dispatchEvent(new Event("ph-buffering")));
		this.video.addEventListener("playing", () => this.dispatchEvent(new Event("ph-playing")));
		this.video.addEventListener("play", () => this.dispatchEvent( new Event("ph-play")));
		this.video.addEventListener("pause", () => this.dispatchEvent( new Event("ph-pause")));
		this.video.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent("ph-volumechange", { detail: this.video.muted ? 0 : this.video.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event("ph-seek")));
		this.video.addEventListener("seeking", () => this.dispatchEvent(new Event("ph-seek")));
	}

	play(): void {
		this.video.play().catch(() => undefined);
	}

	pause(): void {
		this.video.pause();
	}

	togglePlay(): void {
		if (this.video.paused)
			this.video.play();
		else
			this.video.pause();
	}

	seekTo(time: number): void {
		this.video.currentTime = time;
	}

	getCurrentTime(): number {
		return this.video.currentTime;
	}

	getMaxTime(): number {
		return this.video.duration;
	}

	toggleMute(): void {
		this.video.muted = !this.video.muted;
	}

	setVolume(vol: number): void {
		this.video.volume = clamp(vol, 0, 1);
		if (this.video.volume > 0)
			this.lastNon0Volume = this.video.volume;
		if (vol > 0 && this.video.muted)
			this.video.muted = false;
	}

	getVolume(): number {
		return this.video.volume;
	}

	setPlaybackSpeed(speed: number): void {
		this.video.playbackRate = speed;
	}

	getDimensions(): number[] {
		return [ this.video.videoWidth, this.video.videoHeight ];
	}
}

customElements.define("ph-video", Ph_SimpleVideo);
