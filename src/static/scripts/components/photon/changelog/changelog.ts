import { getChangelog } from "../../../api/photonApi.js";
import { disableMainScroll, enableMainScroll, getLoadingIcon } from "../../../utils/htmlStatics.js";
import { photonWebVersion } from "../../../utils/version.js";
import VersionNumber from "../../../utils/versionNumber.js";

export default class Ph_Changelog extends HTMLElement {
	changelogContent: HTMLElement;
	previousVersion: VersionNumber;
	static currentChangelog: Ph_Changelog;

	constructor(prevVersion?: VersionNumber) {
		super();
		this.previousVersion = prevVersion;
	}

	static show(prevVersion?: VersionNumber) {
		if (!Ph_Changelog.currentChangelog)
			document.body.append(this.currentChangelog = new Ph_Changelog(prevVersion));
		this.currentChangelog.classList.remove("remove");
		disableMainScroll();
	}

	connectedCallback() {
		this.classList.add("changelog");
		this.classList.add("remove");

		this.changelogContent = document.createElement("div");
		this.changelogContent.className = "content";
		this.changelogContent.append(getLoadingIcon());
		this.appendChild(this.changelogContent);


		const closeButton = document.createElement("button");
		closeButton.className = "closeButton transparentButton";
		closeButton.innerHTML = `<img src="/img/close.svg" alt="close" draggable="false">`;
		closeButton.addEventListener("click", this.close.bind(this));
		this.changelogContent.appendChild(closeButton);


		this.addEventListener("click", e => {
			if (e.target === e.currentTarget)
				this.close();
		});

		this.populate();
	}

	async populate() {
		const currentVersion = new VersionNumber(photonWebVersion);
		const changelogData = await getChangelog();
		const newHtml = Object.entries(changelogData).map(version => {
			const ver = new VersionNumber(version[0]);
			const isInstalled = !ver.greaterThan(currentVersion);
			let isNew = false;
			if (this.previousVersion && ver.greaterThan(this.previousVersion))
				isNew = true;
			return `
				<h2>v${version[0]} ${isInstalled ? "" : "(not installed)"} ${isNew ? "(new)" : ""}</h2>
				${Object.entries(version[1]).map(versionChanges => `
					<h3>${versionChanges[0]}</h3>
					<ul>
					${versionChanges[1].map(change => `<li>${change}</li>`).join("\n")}
					</ul>
				`).join("\n")}
			`;
		}).join("\n");
		this.$class("loadingIcon")[0].remove();
		this.changelogContent.insertAdjacentHTML("beforeend", newHtml);
	}

	close() {
		this.classList.add("remove");
		enableMainScroll();
	}
}

customElements.define("ph-changelog", Ph_Changelog);
