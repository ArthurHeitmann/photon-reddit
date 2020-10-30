
export default abstract class Ph_VideoWrapper extends HTMLElement {
	constructor() {
		super();

		this.classList.add("videoWrapper");
	}

	abstract play(): void;
	abstract pause(): void;
	abstract togglePlay(): void;
	abstract seekTo(time: number): void;
	abstract getCurrentTime(): number;
	abstract getMaxTime(): number;
	abstract toggleMute(): void;
	abstract setVolume(vol: number): void;
	abstract getVolume(): number;
	abstract setPlaybackSpeed(speed: number): void;
	abstract getDimensions(): number[];
	// should be dispatching the following events
	// - ph-play
	// - ph-pause
	// - ph-volumechange
	// - ph-seek
	// - ph-noaudio
}
