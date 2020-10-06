export class Ph_ViewState extends HTMLElement {
	historyIndex: number;
	state: Object;
	title: string;
	url: string

	constructor(state: Object, title: string, url: string) {
		super();
		
		this.state = state;
		this.title = title;
		this.url = url;
	}
}
