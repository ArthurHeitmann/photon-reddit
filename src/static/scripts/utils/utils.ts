
function _numberToShort(num): { n: number, s: string } {
	switch (Math.abs(num).toString().length) {
		case 0:
		case 1:
		case 2:
		case 3:
			return num.toString();
		case 4:
			return { n: floorTo(num / 1000, 2), s: "k"};
		case 5:
		case 6:
			return { n: floorTo(num / 1000, 0), s: "k"};
		case 7:
			return { n: floorTo(num / 1000000, 2), s: "m"};
		case 8:
		case 9:
			return { n: floorTo(num / 1000000, 0), s: "m"};
		case 10:
			return { n: floorTo(num / 1000000000, 2), s: "b"};
		case 11:
		case 12:
			return { n: floorTo(num / 1000000000, 0), s: "b"};
		case 13:
			return { n: floorTo(num / 1000000000000, 2), s: "t"};
		case 14:
		case 15:
			return { n: floorTo(num / 1000000000000, 0), s: "t"};
		default:
			return { n: 0, s: " - ∞" }
	}
}

export function numberToShort(num: number): string {
	return Object.values(_numberToShort(num)).join("");
}

export function numberToShortStr(num: string): string {
	return numberToShort(parseInt(num));
}


function _timePassedSince(time: number): { n: number, s: string } {
	const s = Math.round(Date.now() / 1000 - time);
	if (s < 60)
		return { n: s, s: "seconds" };
	else if (s < 3600)
		return { n: Math.floor(s / 60), s: "minutes" };
	else if (s < 86400)
		return { n: Math.floor(s / 3600), s: "hours" };
	else if (s < 2592000)
		return { n: Math.floor(s / 86400), s: "days" };
	else if (s < 31557600)
		return { n: Math.floor(s / 2592000), s: "months" };
	else
		return { n: Math.floor(s / 31557600), s: "years" };
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
	const { n: n, s: s } = _timePassedSince(time);
	return `${n.toString()} ${n !== 1 ? s : s.replace(/s$/, "")}`;
}

export function timePassedSinceStr(time: string): string {
	return timePassedSince(parseInt(time));
}

export function replaceRedditLinks(el: HTMLElement) {
	for (const a of el.$tag("a")) {
		if (a.getAttribute("href")) {
			(a as HTMLAnchorElement).href = a.getAttribute("href").replaceAll(/(https?:\/\/)?(\w)*\.?reddit\.com/g, "");
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

export function deepClone<T>(object: T): T {
	return JSON.parse(JSON.stringify(object));
}

export function roundTo(number: number, precision: number): number {
	return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
}

export function floorTo(number: number, precision: number): number {
	return Math.floor(number * Math.pow(10, precision)) / Math.pow(10, precision);
}

export function ceilTo(number: number, precision: number): number {
	return Math.ceil(number * Math.pow(10, precision)) / Math.pow(10, precision);
}
