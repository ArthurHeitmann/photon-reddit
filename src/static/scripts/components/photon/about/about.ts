import {linksToSpa} from "../../../utils/htmlStuff";

const template = `
<h1>Photon</h1>

<p>
	<a href="/r/photon_reddit">r/photon_reddit</a> is the official subreddit.
</p>

<ul>
	<li><a href="#privacy">Privacy</a></li>
	<li><a href="#github">GitHub & Source Code</a></li>
	<li><a href="#contact">Contact</a></li>
	<li><a href="#credits">Credits</a></li>
</ul>
<br>

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
	</ul>
	<br>
	About once a week some user related data is reported. Data that is reported: browser support for a few modern features,
 	if and how much the user has customized the settings, how many posts were seen. The reported data is not correlated with the above-mentioned id. 
	<br>
	Tracking is disabled when Photon is running on localhost.
</p>

<h2 id="github">GitHub & Source Code</h2>

<p>
	All code can be read on <a href="https://github.com/ArthurHeitmann/photon-reddit">GitHub</a>. Feel free to contribute or to open issues.
</p>

<h2 id="contact">Contact</h2>

<p>
	You can contact the developer on <a href="https://github.com/ArthurHeitmann">GitHub</a> or via E-Mail art[dot]tec[dot]15[at]gmail[dot]com (replace [dot] with . and [at] with @)
</p>

<h2 id="credits">Credits</h2>

<p><h3>Icons</h3></p>

<p>
	The Photon logo is self made and may only be used in association with Photon Reddit.
</p>

<p>
	Most icons are from <a href="https://thenounproject.com/">thenounproject.com</a>.
	<br>
	Icons for the media viewer and more are from <a href="https://thenounproject.com/kerismaker/collection/music-video-player/">this collection</a> by 
	<a href="https://thenounproject.com/kerismaker/">tezar tantular</a>.
	<br>
	Icons for the toast notifications are from <a href="https://thenounproject.com/icongeek/collection/sign/">this collection</a> by 
	<a href="https://thenounproject.com/icongeek/">icongeek</a>.
	<br>
	Other attributions:
	<ul>
		<li>Sort by relevance icon: "sorting by Evgeni Moryakov from the Noun Project"</li>
		<li>The pin icon in the header: "Pin by Martins Ratkus from the Noun Project"</li>
		<li>Controversial icon: "Lightning by Rodolfo Alvarez from the Noun Project"</li>
		<li>Q & A icon: "question and answer by Wolf Böse from the Noun Project"</li>
		<li>Popular icon: "Trending up by DailyPM from the Noun Project"</li>
		<li>Frontpage icon: "book open by icon 54 from the Noun Project"</li>
		<li>Icon for r/all: "Earth by Royyan Wijaya from the Noun Project"</li>
		<li>Edit text icon: "text by Ricki Tri Putra from the Noun Project"</li>
		<li>Award icon: "Medal by Shashwathy from the Noun Project"</li>
		<li>Share icon: "Share by Arun Ganesh from the Noun Project"</li>
		<li>Crosspost icon: "Shuffle by ghayn from the Noun Project"</li>
		<li>New icon: "new by Adrien Coquet from the Noun Project"</li>
		<li>Best icon: "Rocket by The Icon Z from the Noun Project"</li>
		<li>Save icon: "bookmark by ghayn from the Noun Project"</li>
		<li>Top icon: "Data by Fengquan Li from the Noun Project"</li>
		<li>Inbox icon: "envelope by ghayn from the Noun Project"</li>
		<li>Delete icon: "Delete by ghayn from the Noun Project"</li>
		<li>Post icon: note by Uri Kelman from the Noun Project</li>
		<li>Hot icon: "Hot by Pawel Rak from the Noun Project"</li>
		<li>HD icon: "HD by Vectorstall from the Noun Project"</li>
		<li>Flair icon: "Tag by Ranjit from the Noun Project"</li>
	</ul>
	
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
