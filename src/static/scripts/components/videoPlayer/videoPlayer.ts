
export default abstract class Ph_VideoPlayer extends HTMLElement {
	isPlaying = false;

	constructor() {
		super();

		this.classList.add("videoPlayer");
	}

	abstract play();
	abstract pause();
	abstract togglePlay();
	abstract seekTo(time: number);
}
