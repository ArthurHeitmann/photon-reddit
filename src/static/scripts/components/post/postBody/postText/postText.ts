import {editCommentOrPost} from "../../../../api/redditApi";
import {PhEvents} from "../../../../types/Events";
import {RedditPostData} from "../../../../types/redditTypes";
import {emojiFlagsToImages} from "../../../../utils/htmlStatics";
import {elementWithClassInTree, linksToSpa} from "../../../../utils/htmlStuff";
import {hasParams, makeElement} from "../../../../utils/utils";
import Ph_MarkdownForm from "../../../misc/markdownForm/markdownForm";
import Ph_Toast, {Level} from "../../../misc/toast/toast";
import Ph_RedditPoll from "./redditPoll";

/**
 * Text of a post. If in feed, has a max height. If higher than max height, show expand button
 */
export default class Ph_PostText extends HTMLElement {
	maxHeightInRem: number;
	expandButton: HTMLButtonElement;
	textWrapper: HTMLDivElement;
	markdown: string;
	editForm: Ph_MarkdownForm;
	postFullName: string;

	constructor(postData: RedditPostData) {
		super();
		if (!hasParams(arguments)) return;

		const bodyHtml = postData.selftext_html || "";
		const bodyMarkDown = postData.selftext || "";
		const postFullName = postData.name;

		this.className = "postText";
		this.markdown = bodyMarkDown;
		this.postFullName = postFullName;

		this.textWrapper = document.createElement("div");
		this.textWrapper.innerHTML = bodyHtml;
		emojiFlagsToImages(this.textWrapper);
		this.append(this.textWrapper);

		setTimeout(() => {
			if (this.isOverflowing() && elementWithClassInTree(this.parentElement, "isInFeed")) {
				this.classList.add("expandableText");
				this.maxHeightInRem = 10;
				this.updateMaxHeightStyle();

				this.expandButton = makeElement(
					"button", { class: "expandButton", onclick: this.expand.bind(this) }, [
						makeElement("img", { src: "/img/downArrow.svg", draggable: "false", alt: "more" })
				]) as HTMLButtonElement;
				this.append(this.expandButton);
			}
			else {
				this.style.setProperty("--max-height", `max-content`);
			}
		}, 0);

		this.editForm = new Ph_MarkdownForm("Edit", true);
		this.editForm.classList.add("hide");
		this.editForm.addEventListener(PhEvents.submit, this.edit.bind(this));
		this.editForm.addEventListener(PhEvents.cancel, this.endEditing.bind(this));
		this.append(this.editForm);

		if (postData.poll_data) {
			let links = this.$tagAr("a");
			links = links.filter(link => link.innerText === "View Poll");
			links[links.length - 1].remove();
			this.append(new Ph_RedditPoll(postData));
		}
	}

	updateMaxHeightStyle() {
		this.style.setProperty("--max-height", `${this.maxHeightInRem}rem`);
	}

	expand() {
		// first expand linearly then exponentially
		this.maxHeightInRem = Math.max(this.maxHeightInRem + 10, this.maxHeightInRem * 1.75);
		this.updateMaxHeightStyle();

		setTimeout(() => {
			if (!this.isOverflowing()) {
				this.expandButton.remove();
				this.style.setProperty("--max-height", `max-content`);
				this.classList.remove("expandableText");
			}
		}, 265)
	}

	isOverflowing(): boolean {
		return this.textWrapper.scrollHeight - this.textWrapper.offsetHeight > 15;
	}

	startEditing() {
		this.editForm.textField.value = this.markdown;
		this.editForm.classList.remove("hide");
		this.editForm.updateHeight();
		Array.from(this.children)
			.filter(el => el !== this.editForm)
			.forEach(el => el.classList.add("hide"));
	}

	endEditing() {
		this.editForm.classList.add("hide");
		Array.from(this.children)
			.filter(el => el !== this.editForm)
			.forEach(el => el.classList.remove("hide"));
	}

	async edit() {
		this.editForm.submitCommentBtn.disabled = true;
		const editData: any = await editCommentOrPost(this.editForm.textField.value, this.postFullName);
		this.editForm.submitCommentBtn.disabled = false;
		if (editData.json.errors.length > 0) {
			console.error("Error editing post");
			console.error(editData);
			console.error(JSON.stringify(editData));
			for (const error of editData.json.errors)
				new Ph_Toast(Level.error, error instanceof Array ? error.join(" | ") : JSON.stringify(error));
			return;
		}

		// this.markdown = editData["json"]["data"]["things"][0]["data"]["selftext"];
		// this.textWrapper.innerHTML = editData["json"]["data"]["things"][0]["data"]["selftext_html"];
		// emojiFlagsToImages(this.textWrapper);
		// linksToSpa(this, true)
		this.setText(
			editData["json"]["data"]["things"][0]["data"]["selftext"],
			editData["json"]["data"]["things"][0]["data"]["selftext_html"]
		);
		this.endEditing();
	}

	setText(markdown: string, html: string) {
		this.markdown = markdown;
		this.textWrapper.innerHTML = html;
		emojiFlagsToImages(this.textWrapper);
		linksToSpa(this, true)
	}
}

customElements.define("ph-post-text", Ph_PostText);
