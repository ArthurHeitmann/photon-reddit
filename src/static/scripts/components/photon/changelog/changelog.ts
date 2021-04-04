import { getChangelog } from "../../../api/photonApi.js";
import { getLoadingIcon } from "../../../utils/htmlStatics.js";
import { photonWebVersion } from "../../../utils/version.js";
import VersionNumber from "../../../utils/versionNumber.js";

export default class Ph_Changelog extends HTMLElement {
	changelogContent: HTMLElement;
	static currentChangelog: Ph_Changelog;

	constructor() {
		super();
	}

	static show() {
		if (!Ph_Changelog.currentChangelog)
			document.body.appendChild(this.currentChangelog = new Ph_Changelog());
		this.currentChangelog.classList.remove("remove");
	}

	connectedCallback() {
		this.classList.add("changelog");
		this.classList.add("remove");

		this.changelogContent = document.createElement("div");
		this.changelogContent.className = "content";
		this.changelogContent.appendChild(getLoadingIcon());
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
		const newHtml = Object.entries(changelogData).map(version => `
			<h2>v${version[0]} ${new VersionNumber(version[0]).greaterThan(currentVersion) ? "(not installed)" : ""}</h2>
			${Object.entries(version[1]).map(versionChanges => `
				<h3>${versionChanges[0]}</h3>
				<ul>
				${versionChanges[1].map(change => `<li>${change}</li>`).join("\n")}
				</ul>
			`).join("\n")}
		`).join("\n");
		this.$class("loadingIcon")[0].remove();
		this.changelogContent.insertAdjacentHTML("beforeend", newHtml);
	}

	close() {
		this.classList.add("remove");
	}
}

customElements.define("ph-changelog", Ph_Changelog);
