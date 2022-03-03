import Ph_Post from "../../post/post";

export default class PostsFocusStack {
	private stack: Ph_Post[] = [];

	push(post: Ph_Post): void {
		if (this.stack.length === 0)
			post.onIsOnScreen();
		if (!this.contains(post))
			this.stack.push(post);
	}

	pop(post: Ph_Post): void {
		post.onIsOffScreen();
		const postIndex = this.stack.indexOf(post);
		if (postIndex !== -1)
			this.stack.splice(postIndex, 1);
		if (this.stack.length > 0)
			this.top().onIsOnScreen();
	}

	top(): Ph_Post | undefined {
		return this.stack[this.stack.length - 1];
	}

	clear(): void {
		this.stack = [];
	}

	contains(post: Ph_Post): boolean {
		return this.stack.indexOf(post) !== -1;
	}
}
