
export function numberToShort(upvotes: number): string {
	switch (Math.abs(upvotes).toString().length) {
		case 0:
		case 1:
		case 2:
		case 3:
			return upvotes.toString();
		case 4:
			return `${(upvotes / 1000).toFixed(2)}k`;
		case 5:
		case 6:
			return `${(upvotes / 1000).toFixed(0)}k`;
		case 7:
			return "a lot";
		default:
			return "∞";
	}
}

export function numberToShortStr(num: string): string {
	return numberToShort(parseInt(num));
}


/**
 * 	1 - 59		 	 1s
 *	60 - 3599	 	 1 - 59m
 *	3600 - 86399	 1 - 23h
 *	86400 - 2591999	 1 - 29d
 *	2592000-31557599 1 - 12mo
 *	1 - ..y
 * @param time 
 */
export function timePassedSince(time: number): string {
	const s = Math.round(Date.now() / 1000 - time);
	if (s < 60)
		return `${s} seconds`;
	else if (s < 3600)
		return `${(s / 60).toFixed(0)} minutes`;
	else if (s < 86400)
		return `${(s / 3600).toFixed(0)} hours`;
	else if (s < 2592000)
		return `${(s / 86400).toFixed(0)} days`;
	else if (s < 31557600)
		return `${(s / 2592000).toFixed(0)} months`;
	else
		return `${(s / 31557600).toFixed(0)} years`;
}

export function timePassedSinceStr(time: string): string {
	return timePassedSince(parseInt(time));
}

export function replaceRedditLinks(el: HTMLElement) {
	for (const a of el.getElementsByTagName("a")) {
		if (a.getAttribute("href")) {
			a.href = a.getAttribute("href").replaceAll(/(https?:\/\/)?(\w)*\.?reddit\.com/g, "");
		}
	}
}

export function splitPathQuery(pathAndQuery: string): string[] {
	const querySeparation = pathAndQuery.match(/([^?]+)(\?[\w&=]*)?/);
	return [querySeparation[1] || "/", querySeparation[2] || ""];
}

export function secondsToVideoTime(seconds: number): string {
	if (isNaN(seconds)) seconds = 0;
	return `${padWith0(Math.floor(seconds / 60), 2)}:${padWith0(Math.floor(seconds % 60), 2)}`;
}

export function padWith0(num: number, minLength: number): string {
	return "0".repeat(Math.max(0, minLength - num.toString().length)) + num.toString();
}

export function clamp(val: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, val));
}

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
// from https://stackoverflow.com/questions/27078285/simple-throttle-in-js
export function throttle(func: (...any) => any, wait: number, options: { leading?: boolean, trailing?: boolean } = { leading: true, trailing: true}) {
	let context, args, result;
	let timeout = null;
	let previous = 0;
	if (!options) options = {};
	const later = function() {
		previous = options.leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) {
			context = args = null;
		}
	};
	return function() {
		const now = Date.now();
		if (!previous && options.leading === false) previous = now;
		const remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
}

export function isObjectEmpty(obj: {}) {
	// basically does what resp === {} should (but doesn't) do
	return Object.keys(obj).length === 0 && obj.constructor === Object;
}
