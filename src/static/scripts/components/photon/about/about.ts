import { linksToSpa } from "../../../utils/htmlStuff.js";

const template = `
<h1>Photon</h1>

<ul>
	<li><a href="#credits">Credits</a></li>
	<li><a href="#privacy">Privacy</a></li>
	<li><a href="#github">GitHub & Source Code</a></li>
	<li><a href="#contact">Contact</a></li>
</ul>
<br>

<h2 id="credits">Credits</h2>

<p><h3>Icons</h3></p>

<p>
	Most icons are from <a href="https://thenounproject.com/">thenounproject.com</a>.
	<br>
	Mainly from <a href="https://thenounproject.com/kerismaker/collection/music-video-player/">this collection</a> by 
	<a href="https://thenounproject.com/kerismaker/">tezar tantular</a>.
	<br>
	Icons for the toast notifications are from <a href="https://thenounproject.com/icongeek/collection/sign/">this collection</a> by 
	<a href="https://thenounproject.com/icongeek/">icongeek</a>.
	<br>
	The pin icon in the header is "Pin by Martins Ratkus from the Noun Project".
</p>

<p>
	The Photon logo is self made and can may only be used in association with Photon Reddit.
</p>

<h2 id="privacy">Privacy</h2>

<p>
	Photon does some very basic tracking. Collected data is stored on a private server and isn't shared with anyone.
	<br>
	Photon tracks events that are triggered by visiting a page. With an event the following data is associated:
	<ul>
		<li>
			A randomized user id. The id is in no way related to the username, ip or anything else. The id gets reset 
			after 30 days and a new one is generated. The new id is not related to the previous id
		</li>
		<li>
			The shortened page url. If the user visits /r/AskReddit/ then /r/AskReddit/ is tracked. 
			Anything after the 3rd slash will not be tracked. If the user visits /r/AskReddit/comments/iwedc5 then only 
			/r/AskReddit/ is tracked.
			<br>
			When Incognito Mode (not the Chrome feature) is enabled in the settings, regardless of the true url, only /i will be tracked.
		</li>
		<li>
			The referer is either the referer header when first visiting the website. On visiting internal links the 
			value of the previous shortened url is tracked. When in Incognito Mode an empty referer string will be tracked.
		</li>
		<li>
			The time in milliseconds in UTC.
		</li>
		<br>
		Tracking is disabled when Photon is running on localhost.
	</ul>
</p>

<h2 id="github">GitHub & Source Code</h2>

<p>
	All code can be read on <a href="https://github.com/ArthurHeitmann/photon-reddit">GitHub</a>. Feel free to contribute or to open issues!
</p>

<h2 id="contact">Contact</h2>

<p>
	You can contact the developer on <a href="/user/RaiderBDev">Reddit u/RaiderBDev</a> or via E-Mail art[dot]tec[dot]15[at]gmail[dot]com (replace [dot] with . and [at] with @)
</p>

`;

/**
 * About page
 */
export default class Ph_About extends HTMLElement {
	connectedCallback() {
		this.classList.add("about");
		this.innerHTML = template;

		linksToSpa(this);
	}
}

customElements.define("ph-about", Ph_About);
