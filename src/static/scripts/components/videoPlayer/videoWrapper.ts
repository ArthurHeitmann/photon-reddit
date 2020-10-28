
export default abstract class Ph_VideoWrapper extends HTMLElement {
	constructor() {
		super();

		this.classList.add("videoWrapper");
	}

	abstract play(): void;
	abstract pause(): void;
	abstract togglePlay(): boolean;
	abstract seekTo(time: number): void;
	abstract getCurrentTime(): number;
	abstract getMaxTime(): number;
	abstract toggleMute(): boolean;
	abstract setVolume(vol: number): void;
	abstract getVolume(): number;
	// should be dispatching the following events
	// - ph-play
	// - ph-pause
	// - ph-volumechange
	// - ph-seek
}
