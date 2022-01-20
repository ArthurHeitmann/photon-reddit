import {PhEvents} from "../../../../types/Events";
import {escADQ} from "../../../../utils/htmlStatics";
import {clamp, hasParams, urlWithHttps} from "../../../../utils/utils";
import Users from "../../../multiUser/userManagement";
import Ph_VideoWrapper, {BasicVideoData, SourceData, VideoTrackInfo} from "../videoWrapper";

/**
 * Use this when you have 2 mp4s, 1 for video & 1 for audio. This will play, pause, seek, ... them together
 */
export default class Ph_VideoAudio extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	audio: HTMLVideoElement;
	lastNon0Volume: number;
	audioCheckCompleted: boolean = false;
	hasAudio: boolean = true;
	lastSyncMs: number = 0;
	pendingPlay: boolean = false;
	videoTracks: VideoTrackInfo[];

	constructor(videoSources: SourceData[], audioSources: { src: string, type: string }[]) {
		super();
		if (!hasParams(arguments)) return;

		videoSources.forEach(src => src.src = urlWithHttps(src.src));
		audioSources.forEach(src => src.src = urlWithHttps(src.src));

		this.videoTracks = videoSources
			.filter(src => Boolean(src.label))
			.map(src => (<VideoTrackInfo> {
				label: src.label || src.src,
				src: src,
			}));

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		const qualityPreferenceSortedSources: SourceData[] =
			Users.global.d.photonSettings.preferHigherVideoQuality
				? videoSources
				: videoSources.filter(src => src.lowerQualityAlternative)
				  .concat(videoSources.filter(src => !src.lowerQualityAlternative));
		for (const source of qualityPreferenceSortedSources)
			this.video.insertAdjacentHTML("beforeend", `<source src="${escADQ(source.src)}" type="${escADQ(source.type)}">`);
		this.appendChild(this.video);
		
		this.audio = document.createElement("video");
		this.audio.setAttribute("loop", "");
		this.audio.classList.add("hide");
		for (const source of audioSources)
			this.audio.insertAdjacentHTML("beforeend", `<source src="${escADQ(source.src)}" type="${escADQ(source.type)}">`);
		this.appendChild(this.audio);

		// pause (and play again) audio when video is buffering (and pray that the audio will never buffer)
		this.video.addEventListener("waiting", () => {
			this.dispatchEvent(new Event(PhEvents.buffering));
			this.audio.pause();
			if (!this.video.paused)
				this.pendingPlay = true;
		});
		this.video.addEventListener("canplay", () => {
			if (!this.pendingPlay)
				return;
			if (!this.offsetParent)
				return;
			// if video started to buffer during playing continue now
			this.pendingPlay = false;
			this.play();
		});
		this.video.addEventListener("playing", () => {
			if (!this.offsetParent) {
				this.pause();
				return;
			}
			this.dispatchEvent(new Event(PhEvents.playing));
			this.audio.play();
		});
		this.video.addEventListener("loadeddata", () => this.dispatchEvent(new Event(PhEvents.ready)));
		this.video.addEventListener("seeking", () => this.audio.currentTime = this.video.currentTime);
		this.audio.addEventListener("play", () => {
			if (!this.offsetParent) {
				this.pause();
				return;
			}
			this.video.play();
		});
		this.audio.addEventListener("pause", () => this.video.readyState !== 1 && this.video.pause());

		if (audioSources.length === 0) {
			this.audioCheckCompleted = true;
			this.hasAudio = false;
			setTimeout(() => this.dispatchEvent(new Event(PhEvents.noAudio)), 0);
		}
		this.video.addEventListener("timeupdate", () => {
			// this mess is needed in order to know if the video has no audio
			if (!this.audioCheckCompleted && this.video.currentTime > 0.2) {
				this.audioCheckCompleted = true;
				if (
					this.audio["webkitAudioDecodedByteCount"] === 0
					|| this.audio["mozHasAudio"] === false ||
					this.audio["audioTracks"] && this.audio["audioTracks"]["length"] === 0
				) {
					this.dispatchEvent(new Event(PhEvents.noAudio));
					this.hasAudio = false;
					this.audio.muted = true;
				}
			}
			if (!this.hasAudio)
				return;
			// making sure that audio & video is in sync
			const videoAudioDeSync = Math.abs(this.video.currentTime - this.audio.currentTime);
			const now = Date.now();
			if (this.video.playbackRate <= 1 && videoAudioDeSync > 1 && now - this.lastSyncMs > 5000) {
				this.audio.currentTime = this.video.currentTime;
				this.lastSyncMs = now;
			}
		});
		
		this.lastNon0Volume = this.audio.volume;
		this.audio.muted = true;

		this.video.addEventListener("play", () => this.dispatchEvent(new Event(PhEvents.play)));
		this.video.addEventListener("pause", () => this.dispatchEvent(new Event(PhEvents.pause)));
		this.audio.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent(PhEvents.volumeChange, { detail: this.audio.muted ? 0 : this.audio.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event(PhEvents.seek)));
		this.video.addEventListener("seeking", () => this.dispatchEvent(new Event(PhEvents.seek)));
	}

	play(): void {
		if (!this.offsetParent) {
			this.pause();
			return;
		}
		this.video.play().catch(() => undefined);
		if (!this.audioCheckCompleted || this.hasAudio)
			this.audio.play().catch(() => undefined);
	}

	pause(): void {
		this.video.pause();
		if (!this.audioCheckCompleted || this.hasAudio)
			this.audio.pause();
		this.pendingPlay = false;
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

	toggleMute(): boolean {
		return this.audio.muted = !this.audio.muted;
	}

	setIsMuted(isMuted: boolean): boolean {
		return this.audio.muted = isMuted;
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

	getUrl(): string {
		return this.video.currentSrc;
	}

	exportData(): BasicVideoData {
		return {
			className: "Ph_VideoAudio",
			data: [this.video.currentSrc, this.audio.currentSrc]
		};
	}

	getVideoTracks(): VideoTrackInfo[] {
		return this.videoTracks;
	}

	setVideoTrack(key: SourceData) {
		const currentTime = this.video.currentTime;
		const isPaused = this.video.paused;
		const playbackSpeed = this.video.playbackRate;
		this.pause();
		this.dispatchEvent(new Event(PhEvents.buffering));
		this.video.innerHTML = `<source src="${escADQ(key.src)}" type="${escADQ(key.type)}">`;
		this.video.load();
		this.video.currentTime = currentTime;
		if (!isPaused)
			this.addEventListener(PhEvents.ready, this.play.bind(this), { once: true })
		if (playbackSpeed !== 1)
			this.setPlaybackSpeed(playbackSpeed);
	}

	getCurrentTrack(): VideoTrackInfo {
		return this.videoTracks.find(track => track.src.src === this.video.currentSrc);
	}
}

customElements.define("ph-video-audio", Ph_VideoAudio);
