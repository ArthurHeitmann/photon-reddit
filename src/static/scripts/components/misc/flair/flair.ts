import { RedditApiData } from "../../../types/misc.js";
import { hasParams } from "../../../utils/utils.js";
import Ph_Toast, { Level } from "../toast/toast.js";

export interface FlairData {
	type: string,
	backgroundColor?: string,
	textColor?: string,
	richText?: {}[],
	text?: string,
	isEditable?: boolean,
	id?: string
}

export interface FlairApiData {
	background_color: string,
	id: string,
	richtext: object[],
	text: string,
	text_color: string,
	text_editable: boolean,
	type: string
}

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
		this.style.setProperty("--flair-bg", bgColor);
		this.style.setProperty("--flair-tc", textColor);

		this.flairContent = document.createElement("div");
		this.append(this.flairContent);

		if (data.type === "richtext") {
			for (const flairPart of data.richText) {
				switch (flairPart["e"]) {
					case "text":
						const text = document.createElement("span");
						text.className = "flairText";
						text.innerText = flairPart["t"];
						this.flairContent.append(text);
						break;
					case "emoji":
						const flairImgWrapper = document.createElement("span");
						flairImgWrapper.setAttribute("data-tooltip", flairPart["a"]);
						flairImgWrapper.className = "flairImg";
						const flairImg = document.createElement("img");
						flairImgWrapper.append(flairImg);
						flairImg.src = flairPart["u"];
						flairImg.alt = "flairImg";
						this.flairContent.append(flairImgWrapper);
						break;
					default:
						this.flairContent.append(`Unknown Flair ${flairPart["e"]}`);
						console.error("Unknown flair part");
						console.error(flairPart);
						break;
				}
			}
		}
		else if (data.type === "text") {
			this.flairContent.innerText = data.text;
		}
		else {
			this.flairContent.innerText = `Unknown Flair ${data.text}`;
			console.log(data);
		}

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

	private makeFlairColorScheme(color: string, secondaryColor?: string): string[] {
		switch (color) {
			case "dark":
				return [this.shortColorToCss("dark"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("light")];
			case "light":
				return [this.shortColorToCss("light"), this.shortColorToCss(secondaryColor) || this.shortColorToCss("dark")];
			default:
				if (color) {
					return [
						this.shortColorToCss(color),
						color === "transparent" && secondaryColor === "dark"
							? this.shortColorToCss("light")
							: this.shortColorToCss(secondaryColor) || this.contrastColor(color)
					];
				}
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
			new Ph_Toast(Level.error, "Invalid flair color");
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
