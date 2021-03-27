/**
 *
 */

/** */
export async function youtubeDlUrl(url): Promise<string> {
	const res = await fetch(`/api/youtube-dl?url=${encodeURIComponent(url)}`);
	const clipMp4 = (await res.json())["url"];
	return clipMp4;
}