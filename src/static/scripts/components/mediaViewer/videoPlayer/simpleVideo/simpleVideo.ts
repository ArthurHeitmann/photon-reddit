import {PhEvents} from "../../../../types/Events";
import {escADQ} from "../../../../utils/htmlStatics";
import {clamp, hasParams, urlWithHttps} from "../../../../utils/utils";
import Users from "../../../../multiUser/userManagement";
import Ph_VideoWrapper, {BasicVideoData, SourceData, VideoTrackInfo} from "../videoWrapper";

/**
 * A video with a list of fallback sources
 */
export default class Ph_SimpleVideo extends Ph_VideoWrapper {
	video: HTMLVideoElement;
	lastNon0Volume: number;
	noAudioProgressCallback: () => void;
	videoTracks: VideoTrackInfo[];

	/** @param sourcesArray browser first tries to load src 0, when fails try src 1, ... */
	constructor(sourcesArray: SourceData[]) {
		super();
		if (!hasParams(arguments)) return;

		sourcesArray.forEach(src => src.src = urlWithHttps(src.src));

		this.videoTracks = sourcesArray
			.filter(src => Boolean(src.label))
			.map(src => (<VideoTrackInfo> {
				label: src.label || src.src,
				src: src,
				heightHint: src.heightHint,
			}));

		this.video = document.createElement("video");
		this.video.setAttribute("loop", "");
		this.appendChild(this.video);
		if (sourcesArray.length === 0)
			this.insertAdjacentHTML("afterbegin", `<p>No video</p>`);
		const qualityPreferenceSortedSources: SourceData[] =
			Users.global.d.photonSettings.preferHigherVideoQuality
				? sourcesArray
				: sourcesArray.filter(src => src.lowerQualityAlternative)
					.concat(sourcesArray.filter(src => !src.lowerQualityAlternative));
		for (const source of qualityPreferenceSortedSources)
			this.video.insertAdjacentHTML("beforeend", `<source src="${escADQ(source.src)}" type="${escADQ(source.type)}">`);
		if (Number(qualityPreferenceSortedSources[0]?.heightHint))
			this.style.setProperty("--height-hint", `${qualityPreferenceSortedSources[0].heightHint}px`);

		this.lastNon0Volume = this.video.volume;
		this.video.muted = true;

		// this mess is needed in order to know if the video has audio
		this.video.addEventListener("timeupdate", this.noAudioProgressCallback = () => {
			if (this.video.currentTime > 0) {
				this.video.removeEventListener("timeupdate", this.noAudioProgressCallback);
				this.noAudioProgressCallback = undefined;
				if (this.video["webkitAudioDecodedByteCount"] === 0 || this.video["mozHasAudio"] === false || this.video["audioTracks"] && this.video["audioTracks"]["length"] === 0)
					this.dispatchEvent(new Event(PhEvents.noAudio));
			}
		});


		this.video.addEventListener("loadeddata", () => this.dispatchEvent(new Event(PhEvents.ready)));
		this.video.addEventListener("waiting", () => this.dispatchEvent(new Event(PhEvents.buffering)));
		this.video.addEventListener("playing", () => this.dispatchEvent(new Event(PhEvents.playing)));
		this.video.addEventListener("play", () => {
			if (!this.offsetParent) {
				this.pause();
				return;
			}
			this.dispatchEvent(new Event(PhEvents.play));
		});
		this.video.addEventListener("pause", () => this.dispatchEvent( new Event(PhEvents.pause)));
		this.video.addEventListener("volumechange", () => this.dispatchEvent(
			new CustomEvent(PhEvents.volumeChange, { detail: this.video.muted ? 0 : this.video.volume })));
		this.video.addEventListener("seeked", () => this.dispatchEvent(new Event(PhEvents.seek)));
		this.video.addEventListener("seeking", () => this.dispatchEvent(new Event(PhEvents.seek)));
	}

	play(): void {
		if (!this.offsetParent) {
			this.pause();
			return;
		}
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

	toggleMute(): boolean {
		return this.video.muted = !this.video.muted;
	}

	setIsMuted(isMuted: boolean): boolean {
		return this.video.muted = isMuted;
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
	getUrl(): string {
		return this.video.currentSrc;
	}

	exportData(): BasicVideoData {
		return {
			className: "Ph_SimpleVideo",
			data: this.video.currentSrc
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
			this.addEventListener(PhEvents.ready, this.play.bind(this), { once: true });
		if (playbackSpeed !== 1)
			this.setPlaybackSpeed(playbackSpeed);
	}

	getCurrentTrack(): VideoTrackInfo {
		return this.videoTracks.find(track => track.src.src === this.video.currentSrc);
	}
}

customElements.define("ph-video", Ph_SimpleVideo);
