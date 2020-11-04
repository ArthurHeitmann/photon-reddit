import { threadId } from "worker_threads";
import { clamp } from "../../../utils/utils.js";
import Ph_VideoWrapper from "../videoWrapper.js";

export default class Ph_VideoAudio extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	audio: HTMLVideoElement;
	lastNon0Volume: number;
	noAudioProgressCallback: () => void;

	constructor(videoSources: { src: string, type: string }[], audioSources: { src: string, type: string }[]) {
		super();

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		for (const source of videoSources)
			this.video.insertAdjacentHTML("beforeend", `<source src="${source.src}" type="${source.type}">`);
		this.appendChild(this.video);
		
		this.audio = document.createElement("video");
		this.audio.setAttribute("loop", "");
		this.audio.classList.add("hide");
		for (const source of audioSources)
			this.audio.insertAdjacentHTML("beforeend", `<source src="${source.src}" type="${source.type}">`);
		this.appendChild(this.audio);

		// pause (and play again) audio when video is buffering (and pray that the audio will never buffer)
		this.video.addEventListener("waiting", () => {
			this.dispatchEvent(new Event("ph-buffering"));
			this.audio.pause();
		});
		this.video.addEventListener("playing", () => {
			this.dispatchEvent(new Event("ph-playing"));
			this.audio.play();
		});
		this.video.addEventListener("loadeddata", () => this.dispatchEvent(new Event("ph-ready")));
		this.video.addEventListener("play", () => this.audio.play()
			.catch(() => undefined /* the pause() call from the line below will cause a weird exception */));
		this.video.addEventListener("pause", () => this.audio.pause());
		this.video.addEventListener("seeking", () => this.audio.currentTime = this.video.currentTime);
		this.audio.addEventListener("play", () => this.video.play());

		// this mess is needed in order to know if the video has audio
		this.video.addEventListener("timeupdate", this.noAudioProgressCallback = () => {
			if (this.video.currentTime > 0) {
				this.video.removeEventListener("timeupdate", this.noAudioProgressCallback);
				this.noAudioProgressCallback = undefined;
				if (this.audio["webkitAudioDecodedByteCount"] === 0 || this.audio["mozHasAudio"] === false || this.audio["audioTracks"] && this.audio["audioTracks"]["length"] === 0)
					this.dispatchEvent(new Event("ph-noaudio"));
			}
		});
		
		this.lastNon0Volume = this.audio.volume;
		this.audio.muted = true;

		this.video.addEventListener("play", () => this.dispatchEvent( new Event("ph-play")));
		this.video.addEventListener("pause", () => this.dispatchEvent( new Event("ph-pause")));
		this.audio.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent("ph-volumechange", { detail: this.audio.muted ? 0 : this.audio.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event("ph-seek")));
		this.video.addEventListener("seeking", () => this.dispatchEvent(new Event("ph-seek")));
	}

	play(): void {
		this.video.play();
	}

	pause(): void {
		this.video.pause();
	}

	togglePlay(): void {
		if (this.video.paused)
			this.play();
		else
			this.pause();
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
		this.audio.muted = !this.audio.muted;
	}

	setVolume(vol: number): void {
		this.audio.volume = clamp(vol, 0, 1);
		if (this.audio.volume > 0)
			this.lastNon0Volume = this.audio.volume;
		if (vol > 0 && this.audio.muted)
			this.audio.muted = false;
	}

	getVolume(): number {
		return this.audio.volume;
	}

	setPlaybackSpeed(speed: number): void {
		this.video.playbackRate = speed;
		this.audio.playbackRate = speed;
	}

	getDimensions(): number[] {
		return [ this.video.videoWidth, this.video.videoHeight ];
	}
}

customElements.define("ph-video-audio", Ph_VideoAudio);
