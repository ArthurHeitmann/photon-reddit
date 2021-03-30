/**
 *
 */

/** */
export async function youtubeDlUrl(url): Promise<string> {
	const res = await fetch(`/api/youtube-dl?url=${encodeURIComponent(url)}`);
	const clipMp4 = (await res.json())["url"];
	return clipMp4;
}

export function urlRequiresProxy(url: string): boolean {
	return (
		/^\/r\/(random|randnsfw)([/?#.].*)?$/.test(url) ||
		/^\/r\/[^/?#]+\/random/.test(url)
	);
}

export async function redditProxy(url: string, authorization: string): Promise<any> {
	try {
		const r = await fetch(`/api/proxy${url}`, {
			headers: { Authorization: authorization }
		});
		return r.json();
	}
	catch (e) {
		return { error: e }
	}
}
