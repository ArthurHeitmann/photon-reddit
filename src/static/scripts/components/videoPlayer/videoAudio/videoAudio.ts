import Ph_VideoPlayer from "../videoPlayer.js";

export default class Ph_VideoAudio extends Ph_VideoPlayer {
	video: HTMLVideoElement;
	audio: HTMLVideoElement;

	constructor(videoMp4Url: string, audioMp4Url: string) {
		super();

		this.video = document.createElement("video");
		this.video.setAttribute("controls", "");
		this.video.innerHTML = `<source src="${videoMp4Url}" type="video/mp4">`;
		this.appendChild(this.video);
		
		this.audio = document.createElement("video");
		this.audio.classList.add("hide");
		this.audio.innerHTML = `<source src="${audioMp4Url}" type="video/mp4">`;
		this.appendChild(this.audio);

		this.video.addEventListener("play", () => this.audio.play());
		this.video.addEventListener("pause", () => this.audio.pause());
		this.video.addEventListener("seeking", () => this.audio.currentTime = this.video.currentTime);
	}

	play() {
		this.video.play();
	}

	pause() {
		this.video.pause();
	}

	togglePlay() {
		if (this.isPlaying)
			this.pause();
		else
			this.play();
		this.isPlaying = !this.isPlaying;
	}

	seekTo(time: number) {
		this.video.currentTime = time;
	}
}

customElements.define("ph-video-audio", Ph_VideoAudio);
