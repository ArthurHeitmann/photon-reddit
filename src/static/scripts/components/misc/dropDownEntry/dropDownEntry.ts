
export default class Ph_DropDownEntry extends HTMLElement {
	data: any[];

	constructor(text: string, data: any[], onSelectCallback, nestedElements: string[] = []) {
		super();

		this.data = data;
		this.classList.add("dropDownEntry");

		const label = document.createElement("div");
		label.innerText = text;
		this.appendChild(label);

		if (nestedElements.length > 0) {
			const expandList = document.createElement("div");
			expandList.innerText = ">";
			this.appendChild(expandList);
		}

		if (onSelectCallback !== null)
			this.onclick = onSelectCallback;
	}
}

customElements.define("ph-drop-down-entry", Ph_DropDownEntry);
