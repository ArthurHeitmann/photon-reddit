import {FlairApiData, FlairData, RedditApiData} from "../../../types/redditTypes";
import {colorStringToRgb, emojiFlagsToImages} from "../../../utils/htmlStatics";
import {clamp, hasParams} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";

type RGB = [number, number, number];

/**
 * A reddit flair (for example user or post related)
 */
export default class Ph_Flair extends HTMLElement {
	data: FlairData;
	hasTextChanged: boolean = false;
	isEditing: boolean = false;
	flairContent: HTMLDivElement;
	editButton: HTMLButtonElement;
	confirmButton: HTMLButtonElement;
	cancelButton: HTMLButtonElement;
	editInput: HTMLInputElement;
	initialText: string;

	constructor(data: FlairData, allowEdits: boolean = true) {
		super();
		if (!hasParams(arguments)) return;

		if (!data || !data.type)
			return;

		this.data = data;

		this.className = "flair";
		const [bgColor, textColor] = this.makeFlairColorScheme(data.backgroundColor, data.textColor);
		this.style.setProperty("--flair-bg", `rgb(${bgColor.join(",")})`);
		this.style.setProperty("--flair-tc", `rgb(${textColor.join(",")})`);

		this.flairContent = document.createElement("div");
		this.append(this.flairContent);

		if (data.type === "richtext") {
			for (const flairPart of data.richText) {
				switch (flairPart.e) {
					case "text":
						const text = document.createElement("span");
						text.className = "flairText";
						text.innerText = flairPart.t.replace(/\n/g, " ");
						this.flairContent.append(text);
						break;
					case "emoji":
						const flairImgWrapper = document.createElement("span");
						flairImgWrapper.setAttribute("data-tooltip", flairPart.a);
						flairImgWrapper.className = "flairImg";
						const flairImg = document.createElement("img");
						flairImgWrapper.append(flairImg);
						flairImg.src = flairPart.u;
						flairImg.alt = "flairImg";
						this.flairContent.append(flairImgWrapper);
						break;
					default:
						this.flairContent.append(`Unknown Flair ${flairPart.e}`);
						console.error("Unknown flair part");
						console.error(flairPart);
						break;
				}
			}
		}
		else if (data.type === "text") {
			this.flairContent.innerText = data.text?.replace(/\n/g, " ") || "";
		}
		else {
			this.flairContent.innerText = `Unknown Flair ${data.text}`;
			console.log(data);
		}

		emojiFlagsToImages(this.flairContent);

		if (data.isEditable && allowEdits) {
			this.editButton = document.createElement("button");
			this.editButton.className = "transparentButton";
			this.editButton.innerHTML = `<img src="/img/edit.svg" alt="edit flair">`;
			this.editButton.addEventListener("click" , e => {
				stopPropagation(e);
				this.showEdit();
				this.initialText = this.data.text;
				this.editInput.value = this.data.text;
			});
			this.append(this.editButton);

			this.editInput = document.createElement("input");
			this.editInput.classList.add("hide");
			this.editInput.maxLength = 64;
			this.editInput.addEventListener("keydown", e => {
				if (e.code === "Enter")
					this.confirmButton.click();
			})
			this.append(this.editInput);
			this.confirmButton = document.createElement("button");
			this.confirmButton.className = "transparentButton hide";
			this.confirmButton.innerHTML = `<img src="/img/check.svg" alt="confirm edits">`;
			this.confirmButton.addEventListener("click" , e => {
				stopPropagation(e);
				this.hideEdit();
				this.data.text = this.editInput.value;
				this.flairContent.innerText = this.editInput.value;
				emojiFlagsToImages(this.flairContent);
				this.hasTextChanged = true;
			});
			this.append(this.confirmButton);
			this.cancelButton = document.createElement("button");
			this.cancelButton.className = "transparentButton hide";
			this.cancelButton.innerHTML = `<img src="/img/close.svg" alt="discard edits">`;
			this.cancelButton.addEventListener("click" , e => {
				stopPropagation(e);
				this.hideEdit();
			});
			this.append(this.cancelButton);
		}

		if ((!this.innerText || /^\s*$/.test(this.innerText)) && this.$tag("img").length === 0)
			this.classList.add("empty");
	}

	/**
	 * Use this when using reddit api response data of post or comment
	 *
	 * @param thingData raw api response
	 * @param prefix like "author" (for users) or "link" (for posts)
	 */
	static fromThingData(thingData: RedditApiData, prefix: string): Ph_Flair {
		return new Ph_Flair({
			id: thingData[`${prefix}_flair_template_id`],
			type: thingData[`${prefix}_flair_type`],
			backgroundColor: thingData[`${prefix}_flair_background_color`],
			textColor: thingData[`${prefix}_flair_text_color`],
			richText: thingData[`${prefix}_flair_richtext`],
			text: thingData[`${prefix}_flair_text`],
		}, false);
	}
	
	static fromFlairApi(data: FlairApiData, allowEdits = true): Ph_Flair {
		return new Ph_Flair({
			id: data.id,
			backgroundColor: data.background_color,
			isEditable: data.text_editable,
			richText: data.richtext,
			text: data.text,
			textColor: data.text_color,
			type: data.type
		}, allowEdits);
	}

	clone(allowEdits: boolean) {
		return new Ph_Flair(this.data, allowEdits);
	}

	private makeFlairColorScheme(color: string, secondaryColor?: string): [RGB, RGB] {
		const cacheKey = `${color},${secondaryColor || ""}`;
		if (Users.global.d.colorContrastCache[cacheKey]) {
			return Users.global.d.colorContrastCache[cacheKey];
		}
		let bgFgColor: [RGB, RGB];
		switch (color) {
			case "dark":
				bgFgColor = [this.shortColorToCss("dark"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("light")];
				break;
			case "light":
				bgFgColor = [this.shortColorToCss("light"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("dark")];
				break;
			default:
				if (color) {
					bgFgColor = [
						this.shortColorToCss(color),
						color === "transparent" && secondaryColor === "dark"
							? this.shortColorToCss("light")
							: this.shortColorToCss(secondaryColor) || this.oppositeColor(color)
					];
				}
				else
					bgFgColor = [this.shortColorToCss("dark"), this.shortColorToCss("light")];
		}
		bgFgColor = this.fixContrast(bgFgColor);
		Users.global.set(["colorContrastCache", cacheKey], bgFgColor);
		return bgFgColor;
	}

	private oppositeColor(color: string | RGB): RGB {
		if (color === "light")
			return this.shortColorToCss("dark");
		else if (color === "dark")
			return this.shortColorToCss("light");

		const rgbValues = typeof color === "string"
			? colorStringToRgb(`rgb(${this.shortColorToCss(color).join(",")})`)
			: color;
		const brightness = (rgbValues[0] + rgbValues[1] + rgbValues[2]) / 3;
		return brightness < 128 ? this.shortColorToCss("light") : this.shortColorToCss("dark");
	}

	private fixContrast(bgFgColor: [RGB, RGB]): [RGB, RGB] {
		const rgbToLuminance = (r: number, g: number, b: number) => {
			const a = [r, g, b].map(v => {
				v /= 255;
				return v <= 0.03928
					? v / 12.92
					: Math.pow((v + 0.055) / 1.055, 2.4);
			});
			return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
			};

		// keep increasing contrast until the contrast ratio >= 3.0
		let i = 0;
		let ratio: number;
		do {
			const bgLuminance = rgbToLuminance(...bgFgColor[0]);
			const fgLuminance = rgbToLuminance(...bgFgColor[1]);
			ratio = (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);
			if (ratio === 1) {		// same luminance
				bgFgColor[1] = this.oppositeColor(bgFgColor[0]);
				continue;
			}
			if (ratio < 4.5) {
				const bgFactor = bgLuminance > fgLuminance ? 1.25 : 0.75;
				const fgFactor = bgLuminance > fgLuminance ? 0.75 : 1.25;
				bgFgColor[0] = bgFgColor[0].map(c =>
					clamp(c * bgFactor, 0, 255)) as RGB;
				bgFgColor[1] = bgFgColor[1].map(c =>
					clamp(c * fgFactor, 0, 255)) as RGB;
			}
			i++;
		} while (ratio < 4.5 && i < 5);

		return bgFgColor;
	}

	private shortColorToCss(colorOrShortColor: string | RGB): RGB {
		switch (colorOrShortColor) {
			case "dark":
				return [18, 18, 18];
			case "light":
				return [228, 228, 228];
			default:
				return typeof colorOrShortColor === "string"
					? colorStringToRgb(colorOrShortColor)
					: colorOrShortColor;
		}
	}

	showEdit() {
		this.editInput.classList.remove("hide");
		this.confirmButton.classList.remove("hide");
		this.cancelButton.classList.remove("hide");
		this.editButton.classList.add("hide");
		this.flairContent.classList.add("hide");
		this.isEditing = true;
	}

	hideEdit() {
		this.editInput.classList.add("hide");
		this.confirmButton.classList.add("hide");
		this.cancelButton.classList.add("hide");
		this.editButton.classList.remove("hide");
		this.flairContent.classList.remove("hide");
		this.isEditing = false;
	}
}

function stopPropagation(e: Event) {
	e.stopImmediatePropagation()
}

customElements.define("ph-flair", Ph_Flair);
