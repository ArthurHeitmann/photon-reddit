/**
 * Some general purpose utility funcitons
 */

/** */
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

/** convert long numbers like 11,234 to 11k */
export function numberToShort(num: number): string {
	return Object.values(_numberToShort(num)).join("");
}

/** convert long numbers like 11,234 to 11k */
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
 * @param time in seconds
 */
export function timePassedSince(time: number): string {
	const { n, s } = _timePassedSince(time);
	return `${n.toString()} ${n !== 1 ? s : s.replace(/s$/, "")}`;		// 1 seconds --> 1 second
}

/** @param time in seconds */
export function timePassedSinceStr(time: string): string {
	return timePassedSince(parseInt(time));
}

/** @param time in seconds */
export function timePeriodReadable(time: number) {
	return timePassedSince(Date.now() / 1000 - time);
}

/** replaces all href in <a> like: https://reddit.com/r/all --> /r/all */
export function _replaceRedditLinks(el: HTMLElement) {
	for (const a of el.$tag("a") as HTMLCollectionOf<HTMLAnchorElement>) {
		if (a.hasAttribute("excludeLinkFromSpa"))
			continue;
		a.href = a.getAttribute("href")
			.replaceAll(/redd.it\/(\w+)/g, "reddit.com/comments/$1");
		a.href = a.getAttribute("href")		// map all reddit or same origin links to current origin (reddit.com/r/all --> /r/all)
			.replaceAll(new RegExp(`(https?://)((\\w)*\.?reddit\\.com|${location.hostname})`, "g"), "");
		if (!a.getAttribute("href"))
			a.href = "/";
	}
}

/** splits "/r/all/top?t=day" to ["/r/all/top", "?t=day"] */
export function splitPathQuery(pathAndQuery: string): string[] {
	const querySeparation = pathAndQuery.match(/([^?]+)(\?.*)?/);
	return querySeparation ? [querySeparation[1] || "/", querySeparation[2] || ""] : ["/", ""];
}

/** converts numbers like 69 to "01:09" */
export function secondsToVideoTime(seconds: number): string {
	if (isNaN(seconds)) seconds = 0;
	return `${padWith0(Math.floor(seconds / 60), 2)}:${padWith0(Math.floor(seconds % 60), 2)}`;
}

/** Convert num to string with enough leading 0 to reach the minLength; example: padWith0(9, 2) --> "09" */
export function padWith0(num: number, minLength: number): string {
	return "0".repeat(Math.max(0, minLength - num.toString().length)) + num.toString();
}

export function clamp(val: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, val));
}

/**
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 * from https://stackoverflow.com/questions/27078285/simple-throttle-in-js
 */
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
	return function(..._: any) {
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

/** basically does what obj === {} should (but doesn't) do */
export function isObjectEmpty(obj: {}) {
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

export function stringSortComparer(s1: string, s2): number {
	return s1.toLowerCase().localeCompare(s2.toLowerCase());
}

/** extracts the path part from an uri; example: "reddit.com/r/all?query" --> "/r/all" */
export function extractPath(uri: string):string {
	const matches = uri.match(/(?<!\/)\/(?!\/)[^?#]*/);
	return matches && matches[0] || "";
}

/** extracts the query part from an uri; example: "reddit.com/r/all?query" --> "?query" */
export function extractQuery(uri: string): string {
	const matches = uri.match(/\?[^#]*/);
	return matches && matches[0] || "";
}

/** extracts the hash part from an uri; example: "/r/AskReddit/wiki/index#wiki_-rule_1-" --> "#wiki_-rule_1-" */
export function extractHash(uri: string): string {
	const matches = uri.match(/#.*$/);
	return matches && matches[0] || "";
}

export function urlWithHttps(url: string) {
	return url.replace(/^http:/, "https:");
}

export async function sleep(ms: number): Promise<void> {
	return  new Promise(resolve => setTimeout(resolve, ms));
}

export function waitForFullScreenExit(): Promise<boolean> {
	return new Promise<boolean>(resolve => {
		if (!document.fullscreenElement) {
			return resolve(false);
		}
		window.addEventListener("fullscreenchange", () => resolve(true), { once: true });
	});
}
