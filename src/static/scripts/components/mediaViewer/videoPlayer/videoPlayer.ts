import {PhEvents} from "../../../types/Events";
import {$tagAr} from "../../../utils/htmlStatics";
import {classInElementTree, isElementIn} from "../../../utils/htmlStuff";
import {
	applyAltVolumeFunc,
	clamp,
	getFullscreenElement,
	hasParams,
	isFullscreen,
	reverseAltVolumeFunc,
	secondsToVideoTime
} from "../../../utils/utils";
import Ph_ControlsBar, {ControlsLayoutSlots} from "../../misc/controlsBar/controlsBar";
import {DropDownActionData} from "../../misc/dropDown/dropDownEntry/dropDownEntry";
import Ph_ProgressBar from "../../misc/progressBar/progressBar";
import Ph_SwitchingImage from "../../misc/switchableImage/switchableImage";
import Users from "../../../multiUser/userManagement";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {MediaElement} from "../mediaElement";
import Ph_PlayImage from "./icons/playImage";
import Ph_SpeedChanger from "./speedChanger/speedChanger";
import Ph_VideoWrapper, {SourceData} from "./videoWrapper";

/**
 * A custom video player with custom controls
 */
export default class Ph_VideoPlayer extends Ph_PhotonBaseElement implements MediaElement {
	caption: string;
	controls: ControlsLayoutSlots;
	usesArrowKeys = true;
	element: HTMLElement;
	url: string;
	/** Video playing element */
	video: Ph_VideoWrapper;
	overlayIcon: Ph_SwitchingImage;
	videoProgressInterval = null;
	static globalVolume: number = 0.5;
	static globalIsMuted: boolean = true;
	static isVideoPlayAllowed = false;

	constructor(url: string) {
		super();
		if (!hasParams(arguments)) return;

		this.classList.add("videoPlayer");
		this.url = url;
		this.element = this;
		this.controls = {
			firstLeftItems: [],
			leftItems: [],
			rightItems: [],
		};

		this.overlayIcon = new Ph_SwitchingImage([
			{src: "/img/loading3.svg", key: "loading"},
			{src: "/img/playVideo.svg", key: "ready"},
			{src: "", key: "none"},
		]);
		this.overlayIcon.classList.add("initialIcon");
		this.appendChild(this.overlayIcon);
	}

	init(video: Ph_VideoWrapper, isLateInit = false) {
		this.video = video;

		if (this.video) {
			this.appendChild(this.video);
			this.classList.add("loading")
			this.fullInit();
			this.video.setVolume(Ph_VideoPlayer.globalVolume);
			this.video.setIsMuted(Ph_VideoPlayer.globalIsMuted);
			if (isLateInit)
				this.dispatchEvent(new Event(PhEvents.controlsChanged));
		}
		else {
			this.innerText = "No video found (maybe video was deleted)";
			this.classList.add("noVideo");
		}
	}

	fullInit() {
		// video autoplay
		const intersectionObserver = new IntersectionObserver(
			entries => {
				if (!Ph_VideoPlayer.isVideoPlayAllowed)
					return;
				if (
					Users.global.d.photonSettings.autoplayVideos &&
					entries[0].intersectionRatio > .4 &&
					isFullscreen() === (getFullscreenElement() === this) &&
					!classInElementTree(this.parentElement, "covered")
				) {
					this.video.play();
				}
				else if (!(getFullscreenElement() && isElementIn(getFullscreenElement(), this))) {
					this.video.pause();
				}
			},
			{
				threshold: .4,
			}
		);
		intersectionObserver.observe(this);

		this.addWindowEventListener(PhEvents.viewChange, () => this.video.pause());
		this.video.addEventListener("click", this.togglePlay.bind(this));
		this.video.addEventListener(PhEvents.ready, () => {
			this.classList.remove("loading");
			this.overlayIcon.showImage("ready");
			timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
			const activeTrackName = this.video.getCurrentTrack()?.label;
			this.markNewTrack(activeTrackName);
		});
		this.video.addEventListener(PhEvents.buffering, () => this.overlayIcon.showImage("loading"));
		this.video.addEventListener(PhEvents.playing, () => this.overlayIcon.showImage("none"));

		// play, pause, progress bar
		const playButton = new Ph_PlayImage(true);
		this.controls.firstLeftItems.push(playButton);
		playButton.addEventListener("click", () => this.togglePlay());
		this.video.addEventListener(PhEvents.play, () => {
			playButton.toPause();
			this.videoProgressInterval = setInterval(() => {
				this.controls.progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime());
				timeText.innerText = `${secondsToVideoTime(this.video.getCurrentTime())} / ${secondsToVideoTime(this.video.getMaxTime())}`;
			}, 100);
		});
		this.video.addEventListener(PhEvents.seek,
			() => this.controls.progressBar.setProgress(this.video.getCurrentTime() / this.video.getMaxTime()));
		this.video.addEventListener(PhEvents.pause, () => {
			playButton.toPlay();
			if (this.videoProgressInterval !== null) {
				clearTimeout(this.videoProgressInterval);
				this.videoProgressInterval = null;
			}
		});

		// time text
		const timeText = document.createElement("div");
		timeText.className = "textOnly";
		this.controls.leftItems.push(timeText);
		timeText.innerText = "00:00 / 00:00";

		// volume
		const volumeWrapper = document.createElement("div");
		volumeWrapper.className = "volumeWrapper";
		this.controls.leftItems.push(volumeWrapper);
		const { b: muteButton, img: muteImg } = Ph_ControlsBar.makeSwitchingImageBtn(new Ph_SwitchingImage([
			{ src: "/img/mute.svg", key: "mute" },
			{ src: "/img/audio.svg", key: "audio" },
		]));
		volumeWrapper.appendChild(muteButton);
		muteButton.addEventListener("click", () => this.toggleMuted());
		const volumeSlider = new Ph_ProgressBar(true, 20);
		volumeSlider.addEventListener(PhEvents.drag, (e: CustomEvent) => this.setVolume(e.detail));
		volumeWrapper.appendChild(volumeSlider);
		this.video.addEventListener(PhEvents.volumeChange,
			(e: CustomEvent) => {
				muteImg.showImage(e.detail === 0 ? "mute" : "audio");
				const volume = reverseAltVolumeFunc(e.detail);
				volumeSlider.setProgress(volume);
			}
		);
		volumeWrapper.addEventListener("wheel", e => {
			e.preventDefault();
			this.setVolume(reverseAltVolumeFunc(this.video.getVolume()) + ((-e.deltaY || e.deltaX) > 0 ? .05 : -.05));
		}, {passive: false});
		this.video.addEventListener(PhEvents.noAudio, () => {
			volumeWrapper.classList.add("remove");
			setTimeout(() => volumeWrapper.remove(), 1000);
		});

		// settings
		const speedChanger = new Ph_SpeedChanger();
		speedChanger.addEventListener(PhEvents.speedChanged, this.onVideoSpeedChange.bind(this));
		this.controls.settingsEntries = [
			{
				label: speedChanger,
				nonSelectable: true
			},
				this.video.getVideoTracks().length > 1 && {
				label: "Quality",
				labelImgUrl: "/img/hd.svg",
				nestedEntries: this.video.getVideoTracks().map((track) => ({
					label: track.label,
					labelImgUrl: "/img/circle.svg",
					value: track.src,
					onSelectCallback: this.onSetVideoQuality.bind(this)
				}))
			},
			{
				label: `Pop Out`,
				labelImgUrl: "/img/popUp.svg",
				onSelectCallback: this.popoutVideo.bind(this)
			},
		];

		// progress bar
		this.controls.progressBar = new Ph_ProgressBar(true);
		this.controls.progressBar.addEventListener(PhEvents.drag, (e: CustomEvent) => {
			this.video.seekTo(clamp(e.detail * this.video.getMaxTime(), 0, this.video.getMaxTime() - 0.001));
		});
		this.controls.progressBar.addEventListener("wheel", e => {
			e.preventDefault();
			this.video.seekTo(this.video.getCurrentTime() + ((-e.deltaY || e.deltaX) > 0 ? 5 : -5));
		}, {passive: false});
		const timeTextHover = document.createElement("div");
		timeTextHover.className = "timeTextHover";
		this.controls.progressBar.appendChild(timeTextHover);
		this.controls.progressBar.addEventListener("mousemove", e => {
			const barLeft = this.controls.progressBar.getBoundingClientRect().left;
			const barWidth = this.controls.progressBar.offsetWidth;
			const mouseOnBarPercent = (e.clientX - barLeft) / barWidth;
			timeTextHover.innerText = secondsToVideoTime(mouseOnBarPercent * this.video.getMaxTime());
			timeTextHover.style.left = `${e.clientX - barLeft}px`;
		});
		this.controls.progressBar.addEventListener("mouseenter",
			() => timeTextHover.classList.add("show"));
		this.controls.progressBar.addEventListener("mouseleave",
			() => timeTextHover.classList.remove("show"));
	}

	onKeyDownEvent(e: KeyboardEvent) {
		switch (e.code) {
			case "Space":
			case "KeyP":
			case "KeyK":
				this.togglePlay();
				break;
			case "ArrowLeft":
			case "KeyJ":
				if (!(e.ctrlKey || e.shiftKey))
					this.video.seekTo(this.video.getCurrentTime() - 5);
				break;
			case "ArrowRight":
			case "KeyL":
				if (!(e.ctrlKey || e.shiftKey))
					this.video.seekTo(this.video.getCurrentTime() + 5);
				break;
			case "ArrowUp":
				this.setVolume(reverseAltVolumeFunc(this.video.getVolume()) + .1);
				break;
			case "ArrowDown":
				this.setVolume(reverseAltVolumeFunc(this.video.getVolume()) - .1);
				break;
			case "KeyM":
				this.toggleMuted();
				break;
			case "KeyI":
				this.popoutVideo();
				break;
		}
	}

	onVideoSpeedChange(e: CustomEvent) {
		this.video.setPlaybackSpeed(e.detail);
	}

	popoutVideo() {
		const maxWidth = window.screen.width / 3;
		const maxHeight = window.screen.height / 3;
		let targetWidth = this.video.getDimensions()[0];
		let targetHeight = this.video.getDimensions()[1];
		if (targetWidth > maxWidth) {
			const factor = targetWidth / maxWidth;
			targetWidth /= factor;
			targetHeight /= factor;
		}
		if (targetHeight > maxHeight) {
			const factor = targetHeight / maxHeight;
			targetWidth /= factor;
			targetHeight /= factor;
		}
		targetWidth = Math.floor(targetWidth);
		targetHeight = Math.floor(targetHeight);
		window.open(
			`/scripts/components/mediaViewer/videoPlayer/popoutVideoPlayer/popoutVideoPlayer.html?data=${encodeURIComponent(JSON.stringify(this.video.exportData()))}`,
			"_blank",
			`location=no,status=no,menubar=no,width=${targetWidth},height=${targetHeight}`
		);
		this.video.pause();
	}

	togglePlay() {
		this.video.togglePlay();
		Ph_VideoPlayer.isVideoPlayAllowed = true;
	}

	setVolume(newVolume: number, broadcastChange = true) {
		newVolume = clamp(newVolume, 0, 1);
		const videoVolume = applyAltVolumeFunc(newVolume);
		this.video?.setVolume(videoVolume);
		if (!broadcastChange || !Users.global.d.photonSettings.globalVideoVolume)
			return;
		Ph_VideoPlayer.globalVolume = videoVolume;
		Ph_VideoPlayer.globalIsMuted = videoVolume === 0;
		$tagAr("ph-video-player").forEach((player: Ph_VideoPlayer) => player.setVolume(newVolume, false));
	}

	toggleMuted(broadcastChange = true, newIsMuted: boolean = null) {
		if (!broadcastChange) {
			this.video.setIsMuted(newIsMuted);
			return;
		}
		const newMuted = this.video.toggleMute();
		if (!Users.global.d.photonSettings.globalVideoVolume)
			return;
		Ph_VideoPlayer.globalIsMuted = newMuted;
		$tagAr("ph-video-player").forEach((player: Ph_VideoPlayer) => player.toggleMuted(false, newMuted));
	}

	onSetVideoQuality(data: DropDownActionData) {
		const newSource = data.valueChain[1] as SourceData;
		this.markNewTrack(newSource.label);
		this.video.setVideoTrack(newSource);
	}

	markNewTrack(newTrackLabel: string) {
		if (!newTrackLabel)
			return;
		const currentEntry = this.controls.settingsEntries
			.find(entry => entry.label === "Quality")?.nestedEntries
			?.find(entry => entry.labelImgUrl === "/img/circleFilled.svg");
		if (currentEntry)
			currentEntry.labelImgUrl = "/img/circle.svg";
		const newEntry = this.controls.settingsEntries
			.find(entry => entry.label === "Quality")?.nestedEntries
			?.find(entry => entry.label === newTrackLabel);
		if (newEntry)
			newEntry.labelImgUrl = "/img/circleFilled.svg";
		this.dispatchEvent(new Event(PhEvents.controlsChanged))
	}
}

customElements.define("ph-video-player", Ph_VideoPlayer);
