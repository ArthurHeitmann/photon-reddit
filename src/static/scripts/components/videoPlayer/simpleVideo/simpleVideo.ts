import Ph_VideoWrapper from "../videoWrapper.js";

export default class Ph_SimpleVideo extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	lastNon0Volume: number;

	constructor(sourcesArray?: { src?: string, type: string }[], sourcesHtml?: string[]) {
		super();

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		this.appendChild(this.video);
		if (sourcesArray) {
			for (const source of sourcesArray)
				this.video.insertAdjacentHTML("beforeend", `<source src="${source.src}" type="${source.type}">`);
		}
		else if (sourcesHtml) {
			for (const source of sourcesHtml)
				this.video.insertAdjacentHTML("beforeend", source);
		}
		else
			throw "Invalid video sources"

		this.lastNon0Volume = this.video.volume;
		this.video.muted = true;
	}

	play(): void {
		this.video.play();
	}

	pause(): void {
		this.video.pause();
	}

	togglePlay(): boolean {
		if (this.video.paused)
			this.video.play();
		else
			this.video.pause();
		
		return !this.video.paused;
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

	toggleMute(): boolean {
		return this.video.muted = !this.video.muted;
	}

	setVolume(vol: number): void {
		this.video.volume = Math.min(1, Math.max(0, vol));
		if (this.video.volume > 0)
			this.lastNon0Volume = this.video.volume;
	}

	volumePlus(): void {
		this.setVolume(this.video.volume + .1)
	}
	
	volumeMinus(): void {
		this.setVolume(this.video.volume - .1)
	}

	getVolume(): number {
		return this.video.volume;
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

customElements.define("ph-video", Ph_SimpleVideo);
