import { Ph_ViewState } from "../components/viewState/viewState.js";

export default class ViewsStack {
	private views: Ph_ViewState[] = [];
	private pos = -1;

	push(el: Ph_ViewState): ViewsStack {
		this.views.splice(this.pos + 1).forEach(el => el.remove());

		this.views.push(el);
		el.historyIndex = this.views.length - 1;

		if (this.pos !== -1)
			this.peek().classList.add("hide");

		return this;
	}

	pop(): HTMLElement {
		if (this.views.length <= 0) 
			throw new Error("Cannot pop empty stack");
		
		if (this.pos + 1 === this.views.length) {
			this.views[this.pos].remove();
			--this.pos;
		}
		
		return this.views.pop();
	}

	clear() {
		this.views = [];
	}

	peek(offset = 0): HTMLElement {
		if (this.views.length === offset) 
			return null;
		else if (this.views.length < offset)
			throw new Error(`Not enough elements in view stack stack.length = ${this.views.length}; offset = ${offset}`);

		return this.views[this.views.length - 1 - offset];
	}

	current(): HTMLElement {
		return this.views[this.pos];
	}

	first(): HTMLElement {
		if (this.views.length === 0)
			return null;
		
		return this.views[0]
	}

	last(): HTMLElement {
		if (this.views.length === 0)
			return null;
		
		return this.peek();
	}

	next(): HTMLElement {
		if (this.pos + 1 >= this.views.length && this.pos !== -1)
			throw new Error("Cannot next(): no next elements in stack");
		
		if (this.pos !== -1)
			this.views[this.pos].classList.add("hide");
		++this.pos;
		this.views[this.pos].classList.remove("hide");
		history.pushState(
			this.views[this.pos].historyIndex, 
			this.views[this.pos].title, 
			this.views[this.pos].url
		);
		history.forward();
		
		return this.views[this.pos];
	}
	
	prev(): HTMLElement {
		if (this.pos <= 0)
		throw new Error("Cannot prev(): no previous elements in stack");
		
		this.views[this.pos].classList.add("hide");
		--this.pos;
		this.views[this.pos].classList.remove("hide");
		// history.pushState(
		// 	this.views[this.pos].historyIndex, 
		// 	this.views[this.pos].title, 
		// 	this.views[this.pos].url
		// );
		// history.forward();

		return this.views[this.pos];
	}

	size(): number {
		return this.views.length;
	}

	position(): number {
		return this.pos;
	}
}