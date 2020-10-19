import { RedditApiType } from "../../utils/types.js";

export default class Ph_VideoPlayer extends HTMLElement {
	constructor(postData: RedditApiType) {
		super();

		const url: string = postData.data["url"]; 
		this.classList.add("videoPlayer");
		switch (url.match(/^https:\/\/([\w\.]+)/)[1]) {
			case "i.imgur.com":
				const typelessUrl = url.match(/^https:\/\/i\.imgur\.com\/\w+/)[0];
				this.innerHTML = `
				<video controls="">
					<source src="${typelessUrl}.webm" type="video/webm">
					<source src="${typelessUrl}.mp4" type="video/mp4">
					Couldn't load imgur video
				</video>
				`;
				break;
			case "gfycat.com":
				const capitalizedPath = postData.data["media"]["oembed"]["thumbnail_url"].match(/^https:\/\/thumbs\.gfycat\.com\/(\w+)/)[1];
				this.innerHTML = `
				<video controls="">
					<source src="https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4" type="video/mp4">
					<source src="https://giant.gfycat.com/${capitalizedPath}.webm" type="video/webm">
					<source src="https://giant.gfycat.com/${capitalizedPath}.mp4" type="video/mp4">
					<source src="https://thumbs.gfycat.com/${capitalizedPath}-mobile.mp4" type="video/mp4">
				</video>
				`;
				break;
			case "v.redd.it":
				const videoUrl = postData.data["media"]["reddit_video"]["fallback_url"];
				const audioUrl = postData.data["url"] + "/DASH_audio.mp4";
				this.innerHTML = `
					<video controls>
						<source src="${videoUrl}" type="video/mp4">
					</video>
					<video controls>
						<source src="${audioUrl}" type="video/mp4">
					</video>
				`;
				break;
			default:
				this.innerText = `Unknown video provider for ${postData.data["url"]}`;
				break;
		}
	}
}

customElements.define("ph-video-player", Ph_VideoPlayer);
