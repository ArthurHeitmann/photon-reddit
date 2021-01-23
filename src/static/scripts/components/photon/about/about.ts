const template = `
<h1>Photon</h1>
`;

export default class Ph_About extends HTMLElement {
	connectedCallback() {
		this.classList.add("about");
		this.innerHTML = template;
	}
}

customElements.define("ph-about", Ph_About);
