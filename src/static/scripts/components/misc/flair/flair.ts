import { RedditApiData } from "../../../utils/types.js";

export default class Ph_Flair extends HTMLElement {
	constructor(thingData: RedditApiData, prefix: string) {
		super();

		this.className = "flair";
		if (thingData[`${prefix}_flair_background_color`])
			this.style.setProperty("--flair-bg", thingData[`${prefix}_flair_background_color`])
		if (thingData[`${prefix}_flair_text_color`])
			this.style.setProperty("--flair-tc", this.flairTextColor(thingData[`${prefix}_flair_text_color`]))

		if (thingData[`${prefix}_flair_type`] === "richtext") {
			for (const flairPart of thingData[`${prefix}_flair_richtext`]) {
				switch (flairPart["e"]) {
					case "text":
						const text = document.createElement("span");
						text.innerText = flairPart["t"];
						this.append(text);
						break;
					case "emoji":
						const flairImg = document.createElement("img");
						flairImg.src = flairPart["u"];
						flairImg.setAttribute("data-tooltip", flairPart["a"]);
						this.append(flairImg);
						break;
					default:
						this.append(`Unknown Flair ${flairPart["e"]}`);
						console.error("Unknown flair part");
						console.error(flairPart);
						break;
				}
			}
		}
		else if (thingData[`${prefix}_flair_type`] === "text") {
			this.innerText = thingData[`${prefix}_flair_text`];
		}
		else {
			this.innerText = `Unknown Flair ${thingData[`${prefix}_flair_text`]}`;
			console.log(thingData);
		}

		if (!this.innerText)
			this.classList.add("empty");
	}

	private flairTextColor(color: string): string {
		switch (color) {
			case "dark":
				return "var(--bg-color)";
			case "light":
				return "var(--text-color)";
			default:
				return color || "var(--text-color)";
		}
	}
}

customElements.define("ph-flair", Ph_Flair);
