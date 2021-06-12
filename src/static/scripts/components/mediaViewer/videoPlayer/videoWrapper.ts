/**
 * Interface/abstract class for something that plays video like media
 */

export default abstract class Ph_VideoWrapper extends HTMLElement {
	protected constructor() {
		super();

		this.classList.add("videoWrapper");
	}

	abstract play(): void;
	abstract pause(): void;
	abstract togglePlay(): void;
	abstract seekTo(time: number): void;
	abstract getCurrentTime(): number;
	abstract getMaxTime(): number;
	abstract toggleMute(): boolean;
	abstract setIsMuted(isMuted: boolean): boolean;
	abstract setVolume(vol: number): void;
	abstract getVolume(): number;
	abstract setPlaybackSpeed(speed: number): void;
	abstract getDimensions(): number[];
	abstract getUrl(): string;
	abstract exportData(): BasicVideoData;
	abstract getVideoTracks(): VideoTrackInfo[];
	abstract setVideoTrack(key: any);

	// should be dispatching the following events
	// - ph-play			video starts playing
	// - ph-pause			video pauses
	// - ph-volume-change	volume changes
	// - ph-seek			video playing position has changed
	// - ph-no-audio			signals that is video has no audio
	// - ph-ready			video is ready to be played
	// - ph-buffering		video is buffering/loading
	// - ph-playing			video has stopped buffering
}

export interface BasicVideoData {
	className: "Ph_SimpleVideo" | "Ph_VideoAudio" | "Ph_GifVideo",
	data: any
}

export interface VideoTrackInfo {
	label: string,
	key: any
}

export interface SourceData {
	src: string,
	type: string,
	label?: string
}
