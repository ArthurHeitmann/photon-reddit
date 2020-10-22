import { threadId } from "worker_threads";
import Ph_VideoWrapper from "../videoWrapper.js";

export default class Ph_VideoAudio extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	audio: HTMLVideoElement;
	lastNon0Volume: number;

	constructor(videoSources: { src: string, type: string }[], audioMp4Url: string) {
		super();

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		for (const source of videoSources)
			this.video.insertAdjacentHTML("beforeend", `<source src="${source.src}" type="${source.type}">`);
		this.appendChild(this.video);
		
		this.audio = document.createElement("video");
		this.audio.setAttribute("loop", "");
		this.audio.classList.add("hide");
		this.audio.innerHTML = `<source src="${audioMp4Url}" type="video/mp4">`;
		this.appendChild(this.audio);

		this.video.addEventListener("play", () => this.audio.play());
		this.video.addEventListener("pause", () => this.audio.pause());
		this.video.addEventListener("seeking", () => this.audio.currentTime = this.video.currentTime);
		this.audio.addEventListener("play", () => this.video.paused && this.audio.pause());
		this.audio.addEventListener("pause", () => !this.video.paused && this.audio.play());
		
		this.lastNon0Volume = this.audio.volume;
	}

	play() {
		this.video.play();
	}

	pause() {
		this.video.pause();
	}

	togglePlay(): boolean {
		if (this.video.paused)
			this.play();
		else
			this.pause();

		return !this.video.paused;
	}

	seekTo(time: number) {
		this.video.currentTime = time;
	}

	getCurrentTime(): number {
		return this.video.currentTime;
	}

	getMaxTime(): number {
		return this.video.duration;
	}

	toggleMute(): boolean {
		if (this.audio.volume === 0)
			this.setVolume(this.lastNon0Volume ? this.lastNon0Volume : .5);
		else
			this.setVolume(0);

		return this.audio.volume !== 0;
	}

	setVolume(vol: number): void {
		this.audio.volume = Math.min(1, Math.max(0, vol));
		if (this.audio.volume > 0)
			this.lastNon0Volume = this.audio.volume;
	}

	volumePlus(): void {
		this.setVolume(this.audio.volume + .1)
	}
	
	volumeMinus(): void {
		this.setVolume(this.audio.volume - .1)
	}

	getVolume(): number {
		return this.audio.volume;
	}

	setTimeUpdateCallback(callback: () => void): void {
		this.video.addEventListener("timeupdate", callback, { passive: true });
	}

	toggleFullscreen(): boolean {
		this.classList.toggle("fullscreen");
		if (document.fullscreenElement) {
			document.exitFullscreen();
			return false;
		}
		else if (this.parentElement.requestFullscreen) {
			this.parentElement.requestFullscreen();
			return true;
		}
	}
}

customElements.define("ph-video-audio", Ph_VideoAudio);
