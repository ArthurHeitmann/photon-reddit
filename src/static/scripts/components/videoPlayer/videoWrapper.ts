
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
	abstract setTimeUpdateCallback(callback: () => void): void;
}
