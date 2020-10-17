
export function numberToShort(upvotes: number): string {
	switch (upvotes.toString().length) {
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
			break;
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
	const querySeparation = pathAndQuery.match(/([\w\/]+)(\?[\w&=]*)?/);
	return [querySeparation[1] || "/", querySeparation[2] || ""];
}