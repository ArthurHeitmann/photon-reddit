import Ph_MorphingImage from "../../misc/morphingImage/morphingImage.js";
export default class Ph_PlayImage extends Ph_MorphingImage {
	constructor(isButton = false) {
		super(`M15,38a2,2,0,0,1-2-2V12a2,2,0,0,1,4,0V36A2,2,0,0,1,15,38zM13.58,37.42c-0.78-0.78-0.78-2.11,0.00-2.90L31.10,24.00L13.58,13.49C12.8,12.70,12.8,11.36,13.58,10.58c0.78-0.78,1.94-0.75,2.83-0.06l19.66,11.78c1.18,0.8,1.15,2.56-0.05,3.33l-19.65,11.82C15.55,38.05,14.56,38.32,13.58,37.42z`,"0 0 48 48", isButton);
		this.svg.style.transition = "transform .15s linear";
		this.svg.style.transform = "translateX(-4px) translateY(3px) rotate(120deg)"
	}

	toPlay() {
		this.changePath(`M15,38a2,2,0,0,1-2-2V12a2,2,0,0,1,4,0V36A2,2,0,0,1,15,38zM 13.58, 37.42c -0.78 -0.78 -0.78 -2.11, 0.00 -2.90L 31.10, 24.00L 13.58, 13.49C 12.8, 12.70, 12.8, 11.36, 13.58, 10.58c 0.78 -0.78, 1.94 -0.75, 2.83 -0.06l 19.66, 11.78c 1.18, 0.8, 1.15, 2.56 -0.05, 3.33l -19.65, 11.82C 15.55, 38.05, 14.56, 38.32, 13.58, 37.42z`);
		this.svg.style.transform = "translateX(-4px) translateY(3px) rotate(120deg)"
	}

	toPause() {
		this.changePath(`M15,38a2,2,0,0,1-2-2V12a2,2,0,0,1,4,0V36A2,2,0,0,1,15,38zM 33.008, 38.00c -1.10, 0 -2.02 -0.85 -2.02 -2.10L 31.04, 24.00L 31.01, 12.06c -0.05 -1.20, 0.91 -2.06, 2.06 -2.06c 1.10, 0, 1.94, 1.02, 1.94, 1.92l 0.02, 10.34c 0, 1.14 -0.02, 1.89 -0.02, 3.38l 0 10.00C 35.01, 36.93, 34.34, 37.94, 33.01, 38.00z`);
		this.svg.style.transform = "rotate(0)"
	}
}

customElements.define("ph-play-image", Ph_PlayImage);
