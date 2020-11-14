
export default class Ph_VoteButton extends HTMLButtonElement {
	animated: SVGAnimateElement;

	constructor(isUpVote: boolean) {
		super();

		this.className = `voteButton transparentButtonAlt ${isUpVote ? "up" : "down"}`;

		this.innerHTML = `
			<svg fill="#e4e4e4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="shadowBtn">
				<path d="M32.59 30.41 24 21.83 15.41 30.41 12.59 27.59 12.59 27.59 22.59 17.59A2 2 0 0 1 25.41 17.59L35.41 27.59 35.41 27.59 32.59 30.41Z">
					<animate attributeName="d" dur="0.5s" begin="indefinite"
						keyTimes="0; 0.5; 0.66; 1"
						values="
						M32.59 30.41 24 21.83 15.41 30.41 12.59 27.59 12.59 27.59 22.59 17.59A2 2 0 0 1 25.41 17.59L35.41 27.59 35.41 27.59 32.59 30.41Z;
						M32.59 30.41 24 21.83 15.41 30.41 12.59 27.59 12.59 15.59 22.59 5.59A2 2 0 0 1 25.41 5.59L35.41 15.59 35.41 27.59 32.59 30.41Z;
						M32.59 30.41 24 21.83 15.41 30.41 12.59 27.59 12.59 12.59 22.59 2.59A2 2 0 0 1 25.41 2.59L35.41 12.59 35.41 27.59 32.59 30.41Z;
						M32.59 10.41 24 1.83 15.41 10.41 12.59 12.59 12.59 12.59 22.59 2.59A2 2 0 0 1 25.41 2.59L35.41 12.59 35.41 12.59 32.59 10.41Z"
						></animate>
				</path>
			</svg>
			<svg fill="#e4e4e4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="mainBtn">
				<path d="M34,31a2,2,0,0,1-1.41-.59L24,21.83l-8.59,8.58a2,2,0,0,1-2.82-2.82l10-10a2,2,0,0,1,2.82,0l10,10A2,2,0,0,1,34,31Z"></path>
			</svg>`;
		this.animated = this.$tag("animate")[0] as SVGAnimateElement;
	}

	vote(isAnimated: boolean) {
		this.classList.add("voted");
		if (isAnimated)
			// @ts-ignore
			this.animated.beginElement();
	}

	unVote() {
		this.classList.remove("voted");
	}
}

customElements.define("ph-vote-button", Ph_VoteButton, { extends: "button" });
