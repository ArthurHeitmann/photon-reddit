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

		this.video.addEventListener("play", () => this.dispatchEvent( new Event("ph-play")));
		this.video.addEventListener("pause", () => this.dispatchEvent( new Event("ph-pause")));
		this.video.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent("ph-volumechange", { detail: this.video.muted ? 0 : this.video.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event("ph-seek")));
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
		if (vol > 0 && this.video.muted)
			this.video.muted = false;
	}

	getVolume(): number {
		return this.video.volume;
	}

}

customElements.define("ph-video", Ph_SimpleVideo);
