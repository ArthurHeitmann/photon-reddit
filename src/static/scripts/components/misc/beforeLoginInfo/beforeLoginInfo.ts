import { redirectToLoginPage } from "../../../auth/loginHandler";
import { parseMarkdown } from "../../../lib/markdownForReddit/markdown-for-reddit";
import Ph_ModalPane from "../modalPane/modalPane";

const loginInfoMd = `
## Quick Info
	
You are about to log in through Reddit.  
What does that mean?
	
- **Your Reddit password stays with reddit**
- **All your Reddit data stays with reddit and in your browser**
- **Your Reddit user data is not stored anywhere else**
	
Also
	
- Photon will request some permissions (view your subreddits, comment, upvote, etc.)
- Without these permissions Photon can't work
- Some permissions are currently not needed but are still included in case they are needed in the future
`

export default class Ph_BeforeLoginInfo extends Ph_ModalPane {
	constructor() {
		super();

		this.classList.add("beforeLoginInfo")

		const infoText = document.createElement("div");
		infoText.innerHTML = parseMarkdown(loginInfoMd);
		this.content.append(infoText);

		const loginBtn = document.createElement("button");
		loginBtn.className = "loginButton"
		loginBtn.innerText = "Login";
		loginBtn.addEventListener("click", redirectToLoginPage);
		this.content.append(loginBtn);

		document.body.append(this);
	}

	hide() {
		super.hide();
		setTimeout(this.remove.bind(this), 500);
	}
}

customElements.define("ph-before-login-info", Ph_BeforeLoginInfo);
