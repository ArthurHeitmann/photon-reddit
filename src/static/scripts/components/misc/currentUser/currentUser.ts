import {PhEvents} from "../../../types/Events";
import {$classAr} from "../../../utils/htmlStatics";
import {getUserIconUrl, makeElement} from "../../../utils/utils";
import Users from "../../../multiUser/userManagement";

export default class Ph_CurrentUserDisplay extends HTMLElement {
	img: HTMLImageElement;
	uName: HTMLElement;

	constructor() {
		super();

		this.classList.add("currentUserDisplay");
		this.img = this.appendChild(makeElement("img", { src: getUserIconUrl(Users.current.d.userData) })) as HTMLImageElement;
		this.uName = this.appendChild(makeElement("div", {}, Users.current.displayName));
		this.classList.toggle("remove", Users.all.length < 3);
	}
}

window.addEventListener(PhEvents.userChanged, () => {
	for (const userDisplay of $classAr("currentUserDisplay") as Ph_CurrentUserDisplay[]) {
		userDisplay.img.src = getUserIconUrl(Users.current.d.userData);
		userDisplay.uName.innerText = Users.current.displayName;
		userDisplay.classList.toggle("remove", Users.all.length < 3);
	}
});

customElements.define("ph-current-user-display", Ph_CurrentUserDisplay);
