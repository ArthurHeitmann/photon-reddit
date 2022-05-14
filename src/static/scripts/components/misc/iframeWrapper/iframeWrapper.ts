import Users from "../../../multiUser/userManagement";
import {makeElement} from "../../../utils/utils";
import {AllowIframesDecision, PhotonSettings} from "../../global/photonSettings/settingsConfig";
import Ph_PostLink from "../../post/postLink/postLink";
import Ph_PhotonBaseElement from "../../photon/photonBaseElement/photonBaseElement";
import {PhEvents} from "../../../types/Events";
import {$css} from "../../../utils/htmlStatics";
import Ph_PhotonSettings from "../../global/photonSettings/photonSettings";

interface IframeWrapperOptionals {
	aspectRatio?: number;
	loadingText?: string;
	fallbackUrl?: string;
	fallbackThumbnailUrl?: string;
}

export default class Ph_IframeWrapper extends Ph_PhotonBaseElement {
	srcUrl: string;
	loadingText: string;
	fallbackUrl: string;
	thumbnailUrl: string;

	constructor(srcUrl: string, optional: IframeWrapperOptionals = {}) {
		super();

		const {
			aspectRatio = 16 / 9,
			loadingText = "Loading External Media...",
			fallbackUrl = "",
			fallbackThumbnailUrl = "",
		} = optional;

		this.srcUrl = srcUrl;
		this.loadingText = loadingText;
		this.fallbackUrl = fallbackUrl || srcUrl;
		this.thumbnailUrl = fallbackThumbnailUrl;

		this.classList.add("iframeWrapper");
		this.style.setProperty("--aspect-ratio", aspectRatio.toString());

		this.updateState(Users.global.d.photonSettings.allowIframes);

		this.addWindowEventListener(PhEvents.settingsChanged, (e: CustomEvent) => {
			const changed = e.detail as PhotonSettings;
			if ("allowIframes" in changed) {
				this.updateState(changed.allowIframes);
			}
		});
	}

	private updateState(state: AllowIframesDecision) {
		switch (state) {
			case AllowIframesDecision.allow:
				this.showIframe();
				break;
			case AllowIframesDecision.block:
				this.showLink();
				break;
			case AllowIframesDecision.ask:
				this.showDecisionPrompt();
				break;
		}
	}

	private showDecisionPrompt() {
		this.innerHTML = "";
		this.setAttribute("data-state", "ask");
		this.append(
			makeElement("div", { class: "promptText" }, "Allow embedded media?"),
			makeElement("div", { class: "promptSubtitle" }, "Websites like YouTube or Twitter can potentially place cookies or track you. You can change this later under Settings > Other."),
			makeElement("div", { class: "promptButtons" }, [
				makeElement("button", { class: "button yes", onclick: () => Ph_IframeWrapper.setDecision(true) }, "Yes"),
				makeElement("button", { class: "button no",  onclick: () => Ph_IframeWrapper.setDecision(false) }, "No")
			])
		);
	}

	private showIframe() {
		this.innerHTML = "";
		this.setAttribute("data-state", "iframe");
		this.append(
			makeElement("div", { class: "loadingText" }, this.loadingText),
			makeElement("iframe", { src: this.srcUrl, allowfullscreen: "true", frameborder: "0" })
		);
	}

	private showLink() {
		this.innerHTML = "";
		this.setAttribute("data-state", "link");
		this.append(new Ph_PostLink(this.fallbackUrl, this.thumbnailUrl));
	}

	static setDecision(allowIframes: boolean) {
		const settings = $css(".photonSettings")[0] as Ph_PhotonSettings;
		settings.setSettingTo("allowIframes", allowIframes ? AllowIframesDecision.allow : AllowIframesDecision.block);
	}
}

customElements.define('ph-iframe-wrapper', Ph_IframeWrapper);
