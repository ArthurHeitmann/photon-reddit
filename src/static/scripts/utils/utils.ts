/**
 * Some general purpose utility funcitons
 */

import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {PhEvents} from "../types/Events";
import {
	RedditCommentData,
	RedditCommentObj,
	RedditListingObj,
	RedditMultiInfo,
	RedditPostData,
	RedditUserInfo,
	SubredditInfoBase
} from "../types/redditTypes";
import {fakeSubreddits} from "./consts";
import Users from "../multiUser/userManagement";
import {Ph_ViewState} from "../components/viewState/viewState";

/** */
function _numberToShort(num: number): { n: number, s?: string } {
	switch (Math.abs(num).toString().length) {
		case 0:
		case 1:
		case 2:
		case 3:
			return { n: num };
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


function _timePassedSinceParts(time: number): { n: number, s: string } {
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

function _timePassedSince(time: number): string {
	const { n, s } = _timePassedSinceParts(time);
	return `${n.toString()} ${n !== 1 ? s : s.replace(/s$/, "")}`;		// 1 seconds --> 1 second
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
export function timePassedSince(time: number, includeAdverb = true, adverb = "ago", absAdverb = "at"): string {
	if (Users.global.d.photonSettings.absoluteTimestamps) {
		const timeStr = new Date(time * 1000).toLocaleString();
		return includeAdverb ? `${absAdverb} ${timeStr}` : timeStr;
	}
	else {
		const timeStr = _timePassedSince(time);
		return includeAdverb ? `${timeStr} ${adverb}` : timeStr;
	}
}

/** @param time in seconds */
export function timePassedSinceStr(time: string, includeAdverb = true, adverb = "ago", absAdverb = "at"): string {
	return timePassedSince(parseInt(time), includeAdverb, adverb, absAdverb);
}

/** @param time in seconds */
export function timeRemainingReadable(time: number, includeAdverb = true, adverb = "in") {
	if (Users.global.d.photonSettings.absoluteTimestamps) {
		return timePassedSince(Date.now() / 1000 - time, includeAdverb, adverb);
	}
	else {
		const timeStr = timePassedSince(Date.now() / 1000 - time, false);
		return includeAdverb ? `${adverb} ${timeStr}` : timeStr;
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
	return function(this: any, ..._: any) {
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

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * From: https://gist.github.com/nmsdvid/8807205
 */
export function debounce<T>(this: T, func: (...any) => any, wait: number, immediate = false) {
	let timeout;
	return function(this: T) {
		const context = this;
		const args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		}, wait);
		if (immediate && !timeout) func.apply(context, args);
	};
}

/** basically does what obj === {} should (but doesn't) do */
export function isObjectEmpty(obj: {}) {
	return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function deepClone<T>(object: T): T {
	return JSON.parse(JSON.stringify(object));
}

export function isJsonEqual(obj1: object, obj2: object) {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
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
	const matches = uri.match(/^\/(?!\/)[^?#]*/);
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

export function waitForViewToBecomeVisible(view: Ph_ViewState, timeout?: number): Promise<boolean> {
	if (view.offsetHeight || view.offsetWidth)
		return Promise.resolve(true);
	return new Promise(resolve => {
		const timeoutId = timeout > 0 && setTimeout(() => {
			window.removeEventListener(PhEvents.viewChange, viewChangeListener);
			resolve(false);
		}, timeout);
		const viewChangeListener = () => {
			if (view.offsetHeight || view.offsetWidth) {
				timeoutId && clearTimeout(timeoutId);
				resolve(true);
			}
		};
		window.addEventListener(PhEvents.viewChange, viewChangeListener);
	});
}

export function waitForFullScreenExit(): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		if (!isFullscreen())
			resolve(false);

		const onFsChange = () => {
			if (isFullscreen())
				return;
			resolve(true);
			detachOnFullscreenChangeListener(document, onFsChange);
		};
		attachOnFullscreenChangeListener(document, onFsChange);
	});
}

export function attachOnFullscreenChangeListener(target: Element | Document, func: (...args) => void, once = false) {
	if ("onfullscreenchange" in target)
		target.addEventListener("fullscreenchange", func, { once });
	else if ("onwebkitfullscreenchange" in target)
		// @ts-ignore
		target.addEventListener("webkitfullscreenchange", func, { once });
}

export function detachOnFullscreenChangeListener(target: Element | Document, func: (...args) => void) {
	if ("onfullscreenchange" in target)
		target.removeEventListener("fullscreenchange", func);
	else if ("onwebkitfullscreenchange" in target)
		(target as Element).removeEventListener("webkitfullscreenchange", func);
}

const randomStringAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function randomString(length: number): string {
	let randStr = "";
	for (let i = 0; i < length; ++i)
		randStr += randomStringAlphabet[Math.floor(Math.random() * randomStringAlphabet.length)];
	return randStr;
}

export function hasParams(params: IArguments): boolean {
	return params.length > 0;
}

export function hasHTML(elem: Element): boolean {
	return elem.innerHTML !== "";
}

export function getPostIdFromUrl(url: string): string {
	const matches = url?.match(/\/(?:r|u|user)\/[^/?#]+\/comments\/([^/#?]+)/);
	return matches ? matches[1] : "";
}

/** Compile time validator that @param name is a property of T */
export const nameOf = <T>(name: keyof T) => name;



/**
 * Creates an element kinda in jsx fashion
 *
 * @param tagName Tag name of the element (div, span, etc.)
 * @param attributes Set of attributes of the element (ex: { class: "testClass", id: "testId" }
 * @param inner if of type array --> children of this element; else innerText (unless @param useInnerHTML is true)
 * @param useInnerHTML (default false) if true --> string for @param inner will be used for innerHTML
 */
export function makeElement<K extends keyof HTMLElementTagNameMap>(
	tagName: K | string,
	attributes?: Record<string, string | EventListener>,
	inner?: (HTMLElement | Node | string)[] | string,
	useInnerHTML = false
): HTMLElement {
	attributes = attributes || {};
	inner = inner || [];
	const elem = document.createElement(tagName);
	for (const [k, v] of Object.entries(attributes)) {
		if (/^on/.test(k))
			elem.addEventListener(k.match(/on(.*)/)?.[1], v as EventListener);
		else
			elem.setAttribute(k, v as string);
	}
	if (inner instanceof Array)
		elem.append(...inner.filter(value => Boolean(value)));
	else if (!useInnerHTML)
		elem.innerText = inner;
	else
		elem.innerHTML = inner;
	return elem;
}

interface EditableTimeStrPartDefinition {
	shortStr: string,
	fullStr: string
	ms: number,
	isPreferred: boolean
}

const editableTimeStrParts: EditableTimeStrPartDefinition[] = [
	{
		shortStr: "y",
		fullStr: "year",
		ms: 1000 * 60 * 60 * 24 * 365,
		isPreferred: true
	},
	{
		shortStr: "mo",
		fullStr: "month",
		ms: 1000 * 60 * 60 * 24 * 365 / 12,
		isPreferred: true
	},
	{
		shortStr: "w",
		fullStr: "week",
		ms: 1000 * 60 * 60 * 24 * 7,
		isPreferred: false
	},
	{
		shortStr: "d",
		fullStr: "day",
		ms: 1000 * 60 * 60 * 24,
		isPreferred: true
	},
	{
		shortStr: "h",
		fullStr: "hour",
		ms: 1000 * 60 * 60,
		isPreferred: true
	},
	{
		shortStr: "m",
		fullStr: "minute",
		ms: 1000 * 60,
		isPreferred: true
	},
	{
		shortStr: "s",
		fullStr: "second",
		ms: 1000,
		isPreferred: true
	},
	{
		shortStr: "ms",
		fullStr: "millisecond",
		ms: 1,
		isPreferred: true
	},
];

export function timeMsToEditableTimeStr(timeMs: number): string {
	if (timeMs === 0)
		return "0";

	let out = "";
	let remainingTimeMs = timeMs;
	for (const part of editableTimeStrParts) {
		if (!part.isPreferred)
			continue;
		const partValue = Math.floor(remainingTimeMs / part.ms);
		if (partValue < 1)
			continue;
		out += `${partValue}${part.shortStr}`;
		remainingTimeMs -= partValue * part.ms;
		if (remainingTimeMs <= 0)
			break;
		out += " ";
	}
	return out;
}

export function editableTimeStrToMs(editableStr: string, throwAndDisplayError = true): number | string {
	try {
		if (editableStr === "0")
			return 0;

		if (!/^\s*(\d+\s*[a-zA-Z]+\s*)+$/.test(editableStr)) {
			throw new Error("Invalid time format (example: 1y 7 months 1day 30s");
		}

		let timeMs = 0;

		const pairs: string[] = editableStr.match(/\d+\s*[a-zA-Z]+/g);
		for (const pair of pairs) {
			const matches = pair.match(/(\d+)\s*([a-zA-Z]+)/);
			const number = parseInt(matches[1]);
			if (!number && number !== 0) {
				throw new Error(`Invalid number ${number}`);
			}
			const timeFrame = matches[2]?.toLowerCase();
			const timeStrPart = editableTimeStrParts.find(value => {
				return timeFrame === value.shortStr || timeFrame.replace(/s?$/, "") === value.fullStr;
			});
			if (!timeStrPart) {
				throw new Error(`Invalid timeframe ${timeFrame}`);
			}

			timeMs += number * timeStrPart.ms;
		}

		return timeMs;
	} catch (e) {
		if (throwAndDisplayError) {
			new Ph_Toast(Level.error, e.message);
			throw e;
		}
		else
			return "Invalid time format (example: 1y 7 months 1day 30s";
	}
}

export function isParamRedditTruthy(param: string, fallback: boolean) {
	if (/^true|1|on|yes$/i.test(param))
		return true;
	else if (/^false|0|off|no$/i.test(param))
		return false;
	else
		return fallback;
}

export function isFullscreen(): boolean {
	return Boolean(getFullscreenElement());
}

export function getFullscreenElement(): Element {
	return document.fullscreenElement || document.webkitFullscreenElement;
}

export function enterFullscreen(target: HTMLElement): Promise<void> {
	return new Promise((resolve, reject) => {
		if (target.requestFullscreen)
			resolve(target.requestFullscreen());
		else if (target.webkitRequestFullscreen)
			resolve(target.webkitRequestFullscreen());
		else
			reject("No function to enter FS");
	});
}

export function exitFullscreen() {
	if (document.exitFullscreen)
		document.exitFullscreen();
	else if (document.webkitExitFullscreen)
		document.webkitExitFullscreen();
	else
		throw new Error("No function to exit FS");
}

/**
 * After a `mouseleave` event is triggered call `callback` after `bufferMs` milliseconds.
 * If a `mouseenter` event is triggered in the meanwhile, cancel the timeout.
 */
export function bufferedMouseLeave(elem: HTMLElement, bufferMs: number, callback: (...args) => any) {
	let timeout;
	function callbackWrapper(...args) {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		callback(...args);
	}

	elem.addEventListener("mouseleave", (...args) => {
		if (timeout !== null)
			clearTimeout(timeout);
		timeout = setTimeout(() => callbackWrapper(...args), bufferMs);
	});
	elem.addEventListener("mouseenter", () => {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	});
}

export function isFakeSubreddit(subreddit: string): boolean {
	return (new RegExp(fakeSubreddits.join("|"), "i")).test(subreddit)
}

export function getSubredditIconUrl(subData: SubredditInfoBase, useFallback = true): string | null {
	return subData.community_icon || subData.icon_img || (useFallback ? "/img/rSlash.svg" : null);
}

export function getUserIconUrl(userData: RedditUserInfo): string {
	return userData?.subreddit?.icon_img || userData?.icon_img || "/img/uSlash.svg";
}

export function getMultiIconUrl(multiData: RedditMultiInfo): string {
	return multiData.icon_url;
}

export function clientXOfEvent(e: MouseEvent | TouchEvent) {
	return e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX;
}

export function clientYOfEvent(e: MouseEvent | TouchEvent) {
	return e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY;
}

let isPageReady = false;

export function ensurePageLoaded(): Promise<void> {
	return new Promise(resolve => {
		if (isPageReady) {
			isPageReady = true;
			resolve();
		} else {
			window.addEventListener(
				PhEvents.pageReady,
				() => {
					isPageReady = true;
					resolve();
				},
				{ once: true }
			);
		}
	});
}

export function escRegex(strToEscape: string): string {
	return strToEscape.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capitalizeFirstLetter(str: string) {
	return (str[0] ?? "").toUpperCase() + str.slice(1);
}

export function applyAltVolumeFunc(volume: number): number {
	return Users.global.d.photonSettings.altVolumeFunction ? volume * volume : volume;
}

export function reverseAltVolumeFunc(volume: number): number {
	return Users.global.d.photonSettings.altVolumeFunction ? volume ** 0.5 : volume;
}

export function cancelEvent(e: Event) {
	e.stopImmediatePropagation();
	e.stopPropagation();
	e.preventDefault();
	return false;
}

export function getThumbnailUrl(postData: RedditPostData): string {
	return (
		postData?.preview?.images?.[0]?.source?.url
		?? postData?.thumbnail
	);
}

export function commentsToTree(comments: RedditCommentObj[]): RedditCommentObj[] {
	const tree: RedditCommentObj[] = [];
	const lookup: { [id: string]: RedditCommentObj } = {};
	for (const comment of comments)
		lookup[comment.data.name] = comment;

	for (const comment of comments) {
		const parent = lookup[comment.data.parent_id];
		if (parent) {
			if (!parent.data.replies) {
				parent.data.replies = <RedditListingObj<RedditCommentObj>>{
					kind: "Listing",
					data: {
						children: []
					}
				};
			}
			(<RedditCommentObj[]> parent.data.replies.data.children).push(comment);
		}
		else {
			tree.push(comment);
		}
	}

	return tree;
}

export function isCommentDeleted(commentData: RedditCommentData) {
	return (
		commentData.author === "[deleted]" && ["[deleted]", "[removed]"].includes(commentData.body))
		|| /^\[ ?Removed by Reddit ?.*]/i.test(commentData.body)
	;
}

export function isMobile(): boolean {
	return window.matchMedia("(max-width: 767px)").matches;
}

export function getTwitchClipEmbedUrl(embedlyUr: string): string {
	const params =  new URLSearchParams(embedlyUr.split("?")[1]);
	const twitchUrl = new URL(params.get("src"));
	if (twitchUrl.host == "player.twitch.tv") {
		twitchUrl.host = "clips.twitch.tv";
		twitchUrl.pathname = "/embed";
		twitchUrl.searchParams.set("clip", twitchUrl.searchParams.get("channel"));
		twitchUrl.searchParams.delete("channel");
	}
	twitchUrl.searchParams.delete("parent");
	twitchUrl.searchParams.set("parent", location.hostname);
	return twitchUrl.toString();
}

const base36Charts = "0123456789abcdefghijklmnopqrstuvwxyz";
export function toBase36(num: number): string {
	let str = "";
	do {
		str = base36Charts[num % 36] + str;
		num = Math.floor(num / 36);
	} while (num > 0);
	return str;
}

export function fromBase36(numB36: string): number {
	let num = 0;
	for (let i = 0; i < numB36.length; i++) {
		num += base36Charts.indexOf(numB36[i]) * 36 ** (numB36.length - i - 1);
	}
	return num;
}

export function strToNumNonNan<T>(numStr: string, fallback: T = undefined): number|T {
	const num = Number(numStr);
	return isNaN(num) ? fallback : num;
}

const subredditIconCache = new Map<string, string>();
export function getSubredditIconUrlCached(subreddit: string, useFallback = true): string | null {
	subreddit = subreddit.toLowerCase();
	return subredditIconCache.get(subreddit) ?? "/img/rSlash.svg";
}
export function setSubredditIconUrlCached(subreddit: string, url: string) {
	subreddit = subreddit.toLowerCase();
	subredditIconCache.set(subreddit, url);
}
