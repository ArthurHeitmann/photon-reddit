import { RedditApiData } from "../../../types/misc.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export interface FlairData {
	type: string,
	backgroundColor?: string,
	textColor?: string,
	richText?: {}[],
	text?: string
}

/**
 * A reddit flair (for example user or post related)
 */
export default class Ph_Flair extends HTMLElement {
	constructor(data: FlairData) {
		super();

		if (!data || !data.type)
			return;

		this.className = "flair";
		const [bgColor, textColor] = this.makeFlairColorScheme(data.backgroundColor, data.textColor);
		this.style.setProperty("--flair-bg", bgColor);
		this.style.setProperty("--flair-tc", textColor);

		if (data.type === "richtext") {
			for (const flairPart of data.richText) {
				switch (flairPart["e"]) {
					case "text":
						const text = document.createElement("span");
						text.innerText = flairPart["t"];
						this.append(text);
						break;
					case "emoji":
						const flairImg = document.createElement("img");
						flairImg.src = flairPart["u"];
						flairImg.alt = "flairImg";
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
		else if (data.type === "text") {
			this.innerText = data.text;
		}
		else {
			this.innerText = `Unknown Flair ${data.text}`;
			console.log(data);
		}

		if ((!this.innerText || /^\s*$/.test(this.innerText)) && this.$tag("img").length === 0)
			this.classList.add("empty");
	}

	/**
	 * Use this when using reddit api response data
	 *
	 * @param thingData raw api response
	 * @param prefix like "author" (for users) or "link" (for posts)
	 */
	static fromThingData(thingData: RedditApiData, prefix: string): Ph_Flair {
		return new Ph_Flair({
			type: thingData[`${prefix}_flair_type`],
			backgroundColor: thingData[`${prefix}_flair_background_color`],
			textColor: thingData[`${prefix}_flair_text_color`],
			richText: thingData[`${prefix}_flair_richtext`],
			text: thingData[`${prefix}_flair_text`],
		});
	}

	private makeFlairColorScheme(color: string, secondaryColor?: string): string[] {
		switch (color) {
			case "dark":
				return [this.shortColorToCss("dark"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("light")];
			case "light":
				return [this.shortColorToCss("light"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("dark")];
			default:
				if (color)
					return [this.shortColorToCss(color), this.shortColorToCss(secondaryColor) || this.contrastColor(color)];
				else
					return [this.shortColorToCss("dark"), this.shortColorToCss("light")];
		}
	}

	private contrastColor(color: string): string {
		if (color === "light")
			return this.shortColorToCss("dark");
		else if (color === "dark")
			return this.shortColorToCss("light");

		color = this.shortColorToCss(color);
		const testElement = document.createElement("div");
		testElement.className = "hide";
		testElement.style.color = color;
		document.body.appendChild(testElement);
		const cssRgb = getComputedStyle(testElement).color;
		testElement.remove();

		const rgbValues: string[] = cssRgb.match(/\d+/g);
		if (rgbValues) {
			const brightness = rgbValues.reduce((prev, cur) => prev + parseInt(cur), 0) / 3;
			return brightness < 128 ? this.shortColorToCss("light") : this.shortColorToCss("dark");
		}
		else {
			new Ph_Toast(Level.Error, "Invalid flair color");
			return "red";
		}
	}

	private shortColorToCss(colorOrShortColor): string {
		switch (colorOrShortColor) {
			case "dark":
				return "var(--bg-color)";
			case "light":
				return "var(--text-color)";
			default:
				return colorOrShortColor;
		}
	}
}

customElements.define("ph-flair", Ph_Flair);
