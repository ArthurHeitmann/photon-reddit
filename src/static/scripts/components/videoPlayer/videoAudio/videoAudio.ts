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

		this.video.addEventListener("play", () => this.audio.play()
			.catch(() => undefined /* the the event from the line below will cause a weird exception */));
		this.video.addEventListener("pause", () => this.audio.pause());
		this.video.addEventListener("seeking", () => this.audio.currentTime = this.video.currentTime);
		this.audio.addEventListener("play", () => this.video.play());
		this.audio.addEventListener("pause", () => this.video.pause());
		
		this.lastNon0Volume = this.audio.volume;
		this.audio.muted = true;

		this.video.addEventListener("play", () => this.dispatchEvent( new Event("ph-play")));
		this.video.addEventListener("pause", () => this.dispatchEvent( new Event("ph-pause")));
		this.audio.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent("ph-volumechange", { detail: this.audio.muted ? 0 : this.audio.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event("ph-seek")));
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
		return this.audio.muted = !this.audio.muted;
	}

	setVolume(vol: number): void {
		this.audio.volume = Math.min(1, Math.max(0, vol));
		if (this.audio.volume > 0)
			this.lastNon0Volume = this.audio.volume;
	}

	getVolume(): number {
		return this.audio.volume;
	}
}

customElements.define("ph-video-audio", Ph_VideoAudio);
